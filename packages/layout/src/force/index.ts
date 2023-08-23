import { Graph as IGraph } from '@antv/graphlib';
import { isNumber, isObject } from '@antv/util';
import {
  Graph,
  Node,
  Edge,
  LayoutMapping,
  ForceLayoutOptions,
  Point,
  OutNode,
  LayoutWithIterations,
} from '../types';
import { formatNumberFn, isArray } from '../util';
import { forceNBody } from './forceNBody';
import {
  CalcNode,
  CalcEdge,
  CalcNodeData,
  CalcEdgeData,
  CalcGraph,
  FormatedOptions,
} from './types';

const DEFAULTS_LAYOUT_OPTIONS: Partial<ForceLayoutOptions> = {
  dimensions: 2,
  maxIteration: 500,
  gravity: 10,
  factor: 1,
  edgeStrength: 200,
  nodeStrength: 1000,
  coulombDisScale: 0.005,
  damping: 0.9,
  maxSpeed: 500,
  minMovement: 0.4,
  interval: 0.02,
  linkDistance: 200,
  clusterNodeStrength: 20,
  preventOverlap: true,
  distanceThresholdMode: 'mean',
};

/**
 * Layout with faster force
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class ForceLayout implements LayoutWithIterations<ForceLayoutOptions> {
  id = 'force';
  /**
   * time interval for layout force animations
   */
  private timeInterval: number = 0;
  /**
   * compare with minMovement to end the nodes' movement
   */
  private judgingDistance: number = 0;

  private running: boolean = false;
  private lastLayoutNodes: OutNode[];
  private lastLayoutEdges: Edge[];
  private lastAssign: boolean;
  private lastCalcGraph: IGraph<CalcNodeData, CalcEdgeData>;
  private lastGraph: Graph;
  private lastOptions: FormatedOptions;
  private lastVelMap: {
    [id: string]: Point;
  };
  private lastResult: LayoutMapping;

  constructor(public options: ForceLayoutOptions = {} as ForceLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: ForceLayoutOptions) {
    return this.genericForceLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: ForceLayoutOptions) {
    this.genericForceLayout(true, graph, options);
  }

  /**
   * Stop simulation immediately.
   */
  stop() {
    if (this.timeInterval && typeof window !== 'undefined') {
      window.clearInterval(this.timeInterval);
    }
    this.running = false;
  }

  /**
   * Manually steps the simulation by the specified number of iterations.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick(iterations = this.options.maxIteration || 1) {
    if (this.lastResult) {
      return this.lastResult;
    }

    for (
      let i = 0;
      (this.judgingDistance > this.lastOptions.minMovement || i < 1) &&
      i < iterations;
      i++
    ) {
      this.runOneStep(
        this.lastCalcGraph,
        this.lastGraph,
        i,
        this.lastVelMap,
        this.lastOptions
      );
      this.updatePosition(
        this.lastGraph,
        this.lastCalcGraph,
        this.lastVelMap,
        this.lastOptions
      );
    }

    const result = {
      nodes: this.lastLayoutNodes,
      edges: this.lastLayoutEdges,
    };

    if (this.lastAssign) {
      result.nodes.forEach((node) =>
        this.lastGraph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
          z: this.options.dimensions === 3 ? node.data.z : undefined,
        })
      );
    }

    return result;
  }

  private async genericForceLayout(
    assign: false,
    graph: Graph,
    options?: ForceLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericForceLayout(
    assign: true,
    graph: Graph,
    options?: ForceLayoutOptions
  ): Promise<void>;
  private async genericForceLayout(
    assign: boolean,
    graph: Graph,
    options?: ForceLayoutOptions
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    const formattedOptions = this.formatOptions(mergedOptions, graph);
    const {
      dimensions,
      width,
      height,
      nodeSize,
      getMass,
      nodeStrength,
      edgeStrength,
      linkDistance,
    } = formattedOptions;

    // clones the original data and attaches calculation attributes for this layout algorithm
    const layoutNodes: CalcNode[] = nodes.map(
      (node, i) =>
        ({
          ...node,
          data: {
            ...node.data,
            // ...randomDistribution(node, dimensions, 30, i),
            x: isNumber(node.data.x) ? node.data.x : Math.random() * width,
            y: isNumber(node.data.y) ? node.data.y : Math.random() * height,
            z: isNumber(node.data.z)
              ? node.data.z
              : Math.random() * Math.sqrt(width * height),
            size: nodeSize(node) || 30,
            mass: getMass(node),
            nodeStrength: nodeStrength(node),
          },
        } as CalcNode)
    );
    const layoutEdges: CalcEdge[] = edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        edgeStrength: edgeStrength(edge),
        linkDistance: linkDistance(
          edge,
          graph.getNode(edge.source),
          graph.getNode(edge.target)
        ),
      },
    }));

    if (!nodes?.length) {
      this.lastResult = { nodes: [], edges };
      return { nodes: [], edges };
    }

    const velMap: { [id: string]: Point } = {};
    nodes.forEach((node, i) => {
      velMap[node.id] = {
        x: 0,
        y: 0,
        z: 0,
      };
    });

    const calcGraph = new IGraph<CalcNodeData, CalcEdgeData>({
      nodes: layoutNodes,
      edges: layoutEdges,
    });

    this.formatCentripetal(formattedOptions, calcGraph);

    const { maxIteration, minMovement, onTick } = formattedOptions;

    // Use them later in `tick`.
    this.lastLayoutNodes = layoutNodes;
    this.lastLayoutEdges = layoutEdges;
    this.lastAssign = assign;
    this.lastGraph = graph;
    this.lastCalcGraph = calcGraph;
    this.lastOptions = formattedOptions;
    this.lastVelMap = velMap;

    if (typeof window === 'undefined') return;
    let iter = 0;

    return new Promise((resolve) => {
      // interval for render the result after each iteration
      this.timeInterval = window.setInterval(() => {
        if (!nodes || !this.running) {
          resolve({
            nodes: formatOutNodes(graph, layoutNodes),
            edges,
          });
        }
        this.runOneStep(calcGraph, graph, iter, velMap, formattedOptions);
        this.updatePosition(graph, calcGraph, velMap, formattedOptions);
        if (assign) {
          layoutNodes.forEach((node) =>
            graph.mergeNodeData(node.id, {
              x: node.data.x,
              y: node.data.y,
              z: dimensions === 3 ? node.data.z : undefined,
            })
          );
        }
        onTick?.({
          nodes: formatOutNodes(graph, layoutNodes),
          edges,
        });
        iter++;
        if (iter >= maxIteration || this.judgingDistance < minMovement) {
          window.clearInterval(this.timeInterval);

          resolve({
            nodes: formatOutNodes(graph, layoutNodes),
            edges,
          });
        }
      }, 0);
      this.running = true;
    });
  }

  /**
   * Format merged layout options.
   * @param options merged layout options
   * @param graph original graph
   * @returns
   */
  private formatOptions(
    options: ForceLayoutOptions,
    graph: Graph
  ): FormatedOptions {
    const formattedOptions = options as FormatedOptions;
    const { width: propsWidth, height: propsHeight, getMass } = options;

    // === formating width, height, and center =====
    formattedOptions.width =
      !propsWidth && typeof window !== 'undefined'
        ? window.innerWidth
        : (propsWidth as number);
    formattedOptions.height =
      !propsHeight && typeof window !== 'undefined'
        ? window.innerHeight
        : (propsHeight as number);
    if (!options.center) {
      formattedOptions.center = [
        formattedOptions.width / 2,
        formattedOptions.height / 2,
      ];
    }

    // === formating node mass =====
    if (!getMass) {
      formattedOptions.getMass = (d?: Node) => {
        let massWeight = 1;
        if (isNumber(d?.data.mass)) massWeight = d?.data.mass as number;
        const degree = graph.getDegree(d!.id, 'both');
        return !degree || degree < 5 ? massWeight : degree * 5 * massWeight;
      };
    }

    // === formating node size =====
    if (options.preventOverlap) {
      const nodeSpacingFunc = formatNumberFn<Node>(0, options.nodeSpacing);
      if (!options.nodeSize) {
        formattedOptions.nodeSize = (d?: Node) => {
          const { size } = d?.data || {};
          if (size) {
            if (isArray(size)) {
              return Math.max(size[0], size[1]) + nodeSpacingFunc(d);
            }
            if (isObject<{ width: number; height: number }>(size)) {
              return Math.max(size.width, size.height) + nodeSpacingFunc(d);
            }
            return (size as number) + nodeSpacingFunc(d);
          }
          return 10 + nodeSpacingFunc(d);
        };
      } else if (isArray(options.nodeSize)) {
        formattedOptions.nodeSize = (d?: Node) => {
          const nodeSize = options.nodeSize as [number, number];
          return Math.max(nodeSize[0], nodeSize[1]) + nodeSpacingFunc(d);
        };
      } else {
        formattedOptions.nodeSize = (d?: Node) =>
          (options.nodeSize as number) + nodeSpacingFunc(d);
      }
    }

    // === formating node / edge strengths =====
    formattedOptions.linkDistance = options.linkDistance
      ? formatNumberFn(1, options.linkDistance)
      : (edge?: Edge) =>
          1 +
          formattedOptions.nodeSize(graph.getNode(edge!.source)) +
          formattedOptions.nodeSize(graph.getNode(edge!.target));
    formattedOptions.nodeStrength = formatNumberFn(1, options.nodeStrength);
    formattedOptions.edgeStrength = formatNumberFn(1, options.edgeStrength);

    return options as FormatedOptions;
  }

  /**
   * Format centripetalOption in the option.
   * @param options merged layout options
   * @param calcGraph calculation graph
   */
  private formatCentripetal(options: FormatedOptions, calcGraph: CalcGraph) {
    const {
      dimensions,
      centripetalOptions,
      center,
      clusterNodeStrength,
      leafCluster,
      clustering,
      nodeClusterBy,
    } = options;
    const calcNodes = calcGraph.getAllNodes();
    // === formating centripetalOptions =====
    const basicCentripetal = centripetalOptions || {
      leaf: 2,
      single: 2,
      others: 1,
      // eslint-disable-next-line
      center: (n: any) => {
        return {
          x: center[0],
          y: center[1],
          z: dimensions === 3 ? center[2] : undefined,
        };
      },
    };
    if (typeof clusterNodeStrength !== 'function') {
      options.clusterNodeStrength = (node?: Node) =>
        clusterNodeStrength as number;
    }
    let sameTypeLeafMap: any;
    let clusters: string[] = [];
    if (leafCluster && nodeClusterBy) {
      sameTypeLeafMap = getSameTypeLeafMap(calcGraph, nodeClusterBy);
      clusters =
        Array.from(
          new Set(calcNodes?.map((node) => node.data[nodeClusterBy] as string))
        ) || [];
      // @ts-ignore
      options.centripetalOptions = Object.assign(basicCentripetal, {
        single: 100,
        leaf: (node: Node) => {
          // 找出与它关联的边的起点或终点出发的所有一度节点中同类型的叶子节点
          const { siblingLeaves, sameTypeLeaves } =
            sameTypeLeafMap[node.id] || {};
          // 如果都是同一类型或者每种类型只有1个，则施加默认向心力
          if (
            sameTypeLeaves?.length === siblingLeaves?.length ||
            clusters?.length === 1
          ) {
            return 1;
          }
          return options.clusterNodeStrength(node);
        },
        others: 1,
        center: (node: Node) => {
          const degree = calcGraph.getDegree(node.id, 'both');
          // 孤点默认给1个远离的中心点
          if (!degree) {
            return {
              x: 100,
              y: 100,
              z: 0,
            };
          }
          let centerPos: Point | undefined;
          if (degree === 1) {
            // 如果为叶子节点
            // 找出与它关联的边的起点出发的所有一度节点中同类型的叶子节点
            const { sameTypeLeaves = [] } = sameTypeLeafMap[node.id] || {};
            if (sameTypeLeaves.length === 1) {
              // 如果同类型的叶子节点只有1个，中心位置为undefined
              centerPos = undefined;
            } else if (sameTypeLeaves.length > 1) {
              // 找出同类型节点平均位置作为中心
              centerPos = getAvgNodePosition(sameTypeLeaves);
            }
          } else {
            centerPos = undefined;
          }
          return {
            x: centerPos?.x!,
            y: centerPos?.y!,
            z: centerPos?.z!,
          };
        },
      });
    }
    if (clustering && nodeClusterBy) {
      if (!sameTypeLeafMap) {
        sameTypeLeafMap = getSameTypeLeafMap(calcGraph, nodeClusterBy);
      }
      if (!clusters) {
        clusters = Array.from(
          new Set(
            calcNodes.map((node: Node) => node.data[nodeClusterBy] as string)
          )
        );
      }
      clusters = clusters.filter((item) => item !== undefined);

      const centerInfo: { [key: string]: Point } = {};
      clusters.forEach((cluster) => {
        const sameTypeNodes = calcNodes
          .filter((node) => node.data[nodeClusterBy] === cluster)
          .map((node) => calcGraph.getNode(node.id));
        // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
        centerInfo[cluster] = getAvgNodePosition(sameTypeNodes);
      });
      options.centripetalOptions = Object.assign(basicCentripetal, {
        single: (node: Node) => options.clusterNodeStrength(node),
        leaf: (node: Node) => options.clusterNodeStrength(node),
        others: (node: Node) => options.clusterNodeStrength(node),
        center: (node: Node) => {
          // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
          const centerPos = centerInfo[node.data[nodeClusterBy] as string];
          return {
            x: centerPos?.x!,
            y: centerPos?.y!,
            z: centerPos?.z!,
          };
        },
      });
    }
    const { leaf, single, others } = options.centripetalOptions || {};
    if (leaf && typeof leaf !== 'function') {
      options.centripetalOptions.leaf = () => leaf;
    }
    if (single && typeof single !== 'function') {
      options.centripetalOptions.single = () => single;
    }
    if (others && typeof others !== 'function') {
      options.centripetalOptions.others = () => others;
    }
  }

  /**
   * One iteration.
   * @param calcGraph calculation graph
   * @param graph origin graph
   * @param iter current iteration index
   * @param velMap nodes' velocity map
   * @param options formatted layout options
   * @returns
   */
  private runOneStep(
    calcGraph: CalcGraph,
    graph: Graph,
    iter: number,
    velMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const accMap: { [id: string]: Point } = {};
    const calcNodes = calcGraph.getAllNodes();
    const calcEdges = calcGraph.getAllEdges();
    if (!calcNodes?.length) return;
    const { monitor } = options;
    this.calRepulsive(calcGraph, accMap, options);
    if (calcEdges) this.calAttractive(calcGraph, accMap, options);
    this.calGravity(calcGraph, graph, accMap, options);
    this.updateVelocity(calcGraph, accMap, velMap, options);

    /** 如果需要监控信息，则提供给用户 */
    if (monitor) {
      const energy = this.calTotalEnergy(accMap, calcNodes);
      monitor({
        energy,
        nodes: graph.getAllNodes(),
        edges: graph.getAllEdges(),
        iterations: iter,
      });
    }
  }

  /**
   * Calculate graph energy for monitoring convergence.
   * @param accMap acceleration map
   * @param nodes calculation nodes
   * @returns energy
   */
  private calTotalEnergy(accMap: { [id: string]: Point }, nodes: CalcNode[]) {
    if (!nodes?.length) return 0;
    let energy = 0.0;

    nodes.forEach((node, i) => {
      const vx = accMap[node.id].x;
      const vy = accMap[node.id].y;
      const vz = this.options.dimensions === 3 ? accMap[node.id].z : 0;
      const speed2 = vx * vx + vy * vy + vz * vz;
      const { mass = 1 } = node.data;
      energy += mass * speed2 * 0.5; // p = 1/2*(mv^2)
    });

    return energy;
  }

  /**
   * Calculate the repulsive forces according to coulombs law.
   * @param calcGraph calculation graph
   * @param accMap acceleration map
   * @param options formatted layout options
   */
  public calRepulsive(
    calcGraph: CalcGraph,
    accMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const { dimensions, factor, coulombDisScale } = options;
    forceNBody(
      calcGraph,
      factor,
      coulombDisScale * coulombDisScale,
      accMap,
      dimensions
    );
  }

  /**
   * Calculate the attractive forces according to hooks law.
   * @param calcGraph calculation graph
   * @param accMap acceleration map
   */
  public calAttractive(
    calcGraph: CalcGraph,
    accMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const { dimensions } = options;
    calcGraph.getAllEdges().forEach((edge, i) => {
      const { source, target } = edge;
      const sourceNode = calcGraph.getNode(source);
      const targetNode = calcGraph.getNode(target);
      if (!sourceNode || !targetNode) return;
      let vecX = targetNode.data.x - sourceNode.data.x;
      let vecY = targetNode.data.y - sourceNode.data.y;
      let vecZ = dimensions === 3 ? targetNode.data.z - sourceNode.data.z : 0;
      if (!vecX && !vecY) {
        vecX = Math.random() * 0.01;
        vecY = Math.random() * 0.01;

        if (dimensions === 3 && !vecZ) {
          vecZ = Math.random() * 0.01;
        }
      }
      const vecLength = Math.sqrt(vecX * vecX + vecY * vecY + vecZ * vecZ);
      const direX = vecX / vecLength;
      const direY = vecY / vecLength;
      const direZ = vecZ / vecLength;
      const { linkDistance = 200, edgeStrength = 200 } = edge.data || {};
      const diff = linkDistance - vecLength;
      const param = diff * edgeStrength;
      const massSource = sourceNode.data.mass || 1;
      const massTarget = targetNode.data.mass || 1;
      // 质量占比越大，对另一端影响程度越大
      const sourceMassRatio = 1 / massSource;
      const targetMassRatio = 1 / massTarget;
      const disX = direX * param;
      const disY = direY * param;
      const disZ = direZ * param;
      accMap[source].x -= disX * sourceMassRatio;
      accMap[source].y -= disY * sourceMassRatio;
      accMap[source].z -= disZ * sourceMassRatio;
      accMap[target].x += disX * targetMassRatio;
      accMap[target].y += disY * targetMassRatio;
      accMap[target].z += disZ * targetMassRatio;
    });
  }

  /**
   * Calculate the gravity forces toward center.
   * @param calcGraph calculation graph
   * @param graph origin graph
   * @param accMap acceleration map
   * @param options formatted layout options
   */
  public calGravity(
    calcGraph: CalcGraph,
    graph: Graph,
    accMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const { getCenter } = options;
    const calcNodes = calcGraph.getAllNodes();
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    const {
      width,
      height,
      center,
      gravity: defaultGravity,
      centripetalOptions,
    } = options;
    if (!calcNodes) return;
    calcNodes.forEach((calcNode) => {
      const { id, data } = calcNode;
      const { mass, x, y, z } = data;
      const node = graph.getNode(id);
      let vecX = 0;
      let vecY = 0;
      let vecZ = 0;
      let gravity = defaultGravity;
      const inDegree = calcGraph.getDegree(id, 'in');
      const outDegree = calcGraph.getDegree(id, 'out');
      const degree = calcGraph.getDegree(id, 'both');
      const forceCenter = getCenter?.(node, degree);
      if (forceCenter) {
        const [centerX, centerY, strength] = forceCenter;
        vecX = x - centerX;
        vecY = y - centerY;
        gravity = strength;
      } else {
        vecX = x - center[0];
        vecY = y - center[1];
        vecZ = z - center[2];
      }

      if (gravity) {
        accMap[id].x -= (gravity * vecX) / mass;
        accMap[id].y -= (gravity * vecY) / mass;
        accMap[id].z -= (gravity * vecZ) / mass;
      }

      if (centripetalOptions) {
        const {
          leaf,
          single,
          others,
          center: centriCenter,
        } = centripetalOptions;
        const {
          x: centriX,
          y: centriY,
          z: centriZ,
          centerStrength,
        } = centriCenter?.(node, nodes, edges, width, height) || {
          x: 0,
          y: 0,
          z: 0,
          centerStrength: 0,
        };
        if (!isNumber(centriX) || !isNumber(centriY)) return;
        const vx = (x - centriX) / mass;
        const vy = (y - centriY) / mass;
        const vz = (z - centriZ) / mass;
        if (centerStrength) {
          accMap[id].x -= centerStrength * vx;
          accMap[id].y -= centerStrength * vy;
          accMap[id].z -= centerStrength * vz;
        }

        // 孤点
        if (degree === 0) {
          const singleStrength = single(node);
          if (!singleStrength) return;
          accMap[id].x -= singleStrength * vx;
          accMap[id].y -= singleStrength * vy;
          accMap[id].z -= singleStrength * vz;
          return;
        }

        // 没有出度或没有入度，都认为是叶子节点
        if (inDegree === 0 || outDegree === 0) {
          const leafStrength = leaf(node, nodes, edges);
          if (!leafStrength) return;
          accMap[id].x -= leafStrength * vx;
          accMap[id].y -= leafStrength * vy;
          accMap[id].z -= leafStrength * vz;
          return;
        }

        /** others */
        const othersStrength = others(node);
        if (!othersStrength) return;
        accMap[id].x -= othersStrength * vx;
        accMap[id].y -= othersStrength * vy;
        accMap[id].z -= othersStrength * vz;
      }
    });
  }

  /**
   * Update the velocities for nodes.
   * @param calcGraph calculation graph
   * @param accMap acceleration map
   * @param velMap velocity map
   * @param options formatted layout options
   * @returns
   */
  public updateVelocity(
    calcGraph: CalcGraph,
    accMap: { [id: string]: Point },
    velMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const { damping, maxSpeed, interval, dimensions } = options;
    const calcNodes = calcGraph.getAllNodes();
    if (!calcNodes?.length) return;
    calcNodes.forEach((calcNode) => {
      const { id } = calcNode;
      let vx = (velMap[id].x + accMap[id].x * interval) * damping || 0.01;
      let vy = (velMap[id].y + accMap[id].y * interval) * damping || 0.01;
      let vz =
        dimensions === 3
          ? (velMap[id].z + accMap[id].z * interval) * damping || 0.01
          : 0.0;
      const vLength = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vLength > maxSpeed) {
        const param2 = maxSpeed / vLength;
        vx = param2 * vx;
        vy = param2 * vy;
        vz = param2 * vz;
      }
      velMap[id] = {
        x: vx,
        y: vy,
        z: vz,
      };
    });
  }

  /**
   * Update nodes' positions.
   * @param graph origin graph
   * @param calcGraph calculatition graph
   * @param velMap velocity map
   * @param options formatted layou options
   * @returns
   */
  public updatePosition(
    graph: Graph,
    calcGraph: CalcGraph,
    velMap: { [id: string]: Point },
    options: FormatedOptions
  ) {
    const { distanceThresholdMode, interval, dimensions } = options;
    const calcNodes = calcGraph.getAllNodes();
    if (!calcNodes?.length) {
      this.judgingDistance = 0;
      return;
    }
    let sum = 0;
    if (distanceThresholdMode === 'max') this.judgingDistance = -Infinity;
    else if (distanceThresholdMode === 'min') this.judgingDistance = Infinity;

    calcNodes.forEach((calcNode: CalcNode) => {
      const { id } = calcNode;
      const node = graph.getNode(id);
      if (isNumber(node.data.fx) && isNumber(node.data.fy)) {
        calcGraph.mergeNodeData(id, {
          x: node.data.fx,
          y: node.data.fy,
          z: dimensions === 3 ? (node.data.fz as number) : undefined,
        });
        return;
      }
      const distX = velMap[id].x * interval;
      const distY = velMap[id].y * interval;
      const distZ = dimensions === 3 ? velMap[id].z * interval : 0.0;
      calcGraph.mergeNodeData(id, {
        x: calcNode.data.x + distX,
        y: calcNode.data.y + distY,
        z: calcNode.data.z + distZ,
      });

      const distanceMagnitude = Math.sqrt(
        distX * distX + distY * distY + distZ * distZ
      );
      switch (distanceThresholdMode) {
        case 'max':
          if (this.judgingDistance < distanceMagnitude) {
            this.judgingDistance = distanceMagnitude;
          }
          break;
        case 'min':
          if (this.judgingDistance > distanceMagnitude) {
            this.judgingDistance = distanceMagnitude;
          }
          break;
        default:
          sum = sum + distanceMagnitude;
          break;
      }
    });
    if (!distanceThresholdMode || distanceThresholdMode === 'mean') {
      this.judgingDistance = sum / calcNodes.length;
    }
  }
}

type SameTypeLeafMap = {
  [nodeId: string]: {
    coreNode: Node;
    siblingLeaves: Node[];
    sameTypeLeaves: Node[];
  };
};

/**
 * Group the leaf nodes according to nodeClusterBy field.
 * @param calcGraph calculation graph
 * @param nodeClusterBy the field name in node.data to ditinguish different node clusters
 * @returns related same group leaf nodes for each leaf node
 */
const getSameTypeLeafMap = (
  calcGraph: CalcGraph,
  nodeClusterBy: string
): SameTypeLeafMap => {
  const calcNodes = calcGraph.getAllNodes();
  if (!calcNodes?.length) return {};
  const sameTypeLeafMap: SameTypeLeafMap = {};
  calcNodes.forEach((node, i) => {
    const degree = calcGraph.getDegree(node.id, 'both');
    if (degree === 1) {
      sameTypeLeafMap[node.id] = getCoreNodeAndSiblingLeaves(
        calcGraph,
        'leaf',
        node,
        nodeClusterBy
      );
    }
  });
  return sameTypeLeafMap;
};

/**
 * Find the successor or predecessor of node as coreNode, the sibling leaf nodes
 * @param calcGraph calculation graph
 * @param type ('all') filter out the not-same-cluster nodes, ('leaf') or filter out the not-leaf nodes in the same time
 * @param node the target node
 * @param nodeClusterBy the field name in node.data to ditinguish different node clusters
 * @returns coreNode, sibling leaf nodes, and grouped sibling leaf nodes
 */
const getCoreNodeAndSiblingLeaves = (
  calcGraph: CalcGraph,
  type: 'leaf' | 'all',
  node: Node,
  nodeClusterBy: string
): {
  coreNode: Node;
  siblingLeaves: Node[];
  sameTypeLeaves: Node[];
} => {
  const inDegree = calcGraph.getDegree(node.id, 'in');
  const outDegree = calcGraph.getDegree(node.id, 'out');
  // node is not a leaf, coreNode is itself, siblingLeaves is empty
  let coreNode: Node = node;
  let siblingLeaves: Node[] = [];
  if (inDegree === 0) {
    // node is a leaf node without out edges, its related(successor) node is coreNode, siblingLeaves is the neighbors of its related node
    coreNode = calcGraph.getSuccessors(node.id)[0];
    siblingLeaves = calcGraph.getNeighbors(coreNode.id);
  } else if (outDegree === 0) {
    // node is a leaf node without in edges, its related(predecessor) node is coreNode, siblingLeaves is the neighbors of its related node
    coreNode = calcGraph.getPredecessors(node.id)[0];
    siblingLeaves = calcGraph.getNeighbors(coreNode.id);
  }
  // siblingLeaves are leaf nodes
  siblingLeaves = siblingLeaves.filter(
    (node) =>
      calcGraph.getDegree(node.id, 'in') === 0 ||
      calcGraph.getDegree(node.id, 'out') === 0
  );
  const sameTypeLeaves = getSameTypeNodes(
    calcGraph,
    type,
    nodeClusterBy,
    node,
    siblingLeaves
  );
  return { coreNode, siblingLeaves, sameTypeLeaves };
};

/**
 * Find the same type (according to nodeClusterBy field) of node in relativeNodes.
 * @param calcGraph calculation graph
 * @param type ('all') filter out the not-same-cluster nodes, ('leaf') or filter out the not-leaf nodes in the same time
 * @param nodeClusterBy the field name in node.data to ditinguish different node clusters
 * @param node the target node
 * @param relativeNodes node's related ndoes to be filtered
 * @returns related nodes that meet the filtering conditions
 */
const getSameTypeNodes = (
  calcGraph: CalcGraph,
  type: 'leaf' | 'all',
  nodeClusterBy: string,
  node: Node,
  relativeNodes: Node[]
) => {
  const typeName = node.data[nodeClusterBy] || '';
  let sameTypeNodes =
    relativeNodes?.filter((item) => item.data[nodeClusterBy] === typeName) ||
    [];
  if (type === 'leaf') {
    sameTypeNodes = sameTypeNodes.filter(
      (item) =>
        calcGraph.getDegree(item.id, 'in') === 0 ||
        calcGraph.getDegree(item.id, 'out') === 0
    );
  }
  return sameTypeNodes;
};

/**
 * Get the average position of nodes.
 * @param nodes nodes set
 * @returns average ppsition
 */
const getAvgNodePosition = (nodes: CalcNode[]): Point => {
  const totalNodes = { x: 0, y: 0 };
  nodes.forEach((node) => {
    const { x, y } = node.data;
    totalNodes.x += x || 0;
    totalNodes.y += y || 0;
  });
  // 获取均值向量
  const length = nodes.length || 1;
  return {
    x: totalNodes.x / length,
    y: totalNodes.y / length,
  };
};

/**
 * Format the output nodes from CalcNode[].
 * @param graph origin graph
 * @param layoutNodes calculation nodes
 * @returns output nodes
 */
const formatOutNodes = (graph: Graph, layoutNodes: CalcNode[]): OutNode[] =>
  layoutNodes.map((calcNode) => {
    const { id, data } = calcNode;
    const node = graph.getNode(id);
    return {
      ...node,
      data: {
        ...node.data,
        x: data.x,
        y: data.y,
        z: data.z,
      },
    } as OutNode;
  });
