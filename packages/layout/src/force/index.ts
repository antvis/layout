import { Graph } from "@antv/graphlib";
import { Node, Edge, LayoutMapping, ForceLayoutOptions, SyncLayout, Point, OutNode } from "../types";
import { getFunc, isArray, isNumber, isObject } from "../util";
import { forceNBody } from "./forceNBody";
import { CalcNode, CalcEdge } from './types';

// TODO: animate(not silence) and webworker

const DEFAULTS_LAYOUT_OPTIONS: Partial<ForceLayoutOptions> = {
  maxIteration: 500,
  gravity: 10,
  animate: true,
}

/**
 * Layout with faster force
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new ForceLayout({ center: [100, 100] });
 * const positions = layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { center: [100, 100] });
 */
export class ForceLayout implements SyncLayout<ForceLayoutOptions> {
  id = 'force';
  /**
   * time interval for layout force animations
   */
  private timeInterval: number = 0;
  /**
   * compare with minMovement to end the nodes' movement
   */
  private judgingDistance: number = 0;

  constructor(public options: ForceLayoutOptions = {} as ForceLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<Node, Edge>, options?: ForceLayoutOptions): LayoutMapping {
    return this.genericForceLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<Node, Edge>, options?: ForceLayoutOptions) {
    this.genericForceLayout(true, graph, options);
  }

  private genericForceLayout(assign: boolean, graph: Graph<Node, Edge>, options?: ForceLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();
    if (!mergedOptions.layoutInvisibles) {
      nodes = nodes.filter(node => node.data.visible || node.data.visible === undefined);
      edges = edges.filter(edge => edge.data.visible || edge.data.visible === undefined);
    }

    this.formatOptions(mergedOptions, graph);
    const { width, height, nodeSize, getMass, nodeStrength, edgeStrength, linkDistance } = mergedOptions;

    // clones the original data and attaches calculation attributes for this layout algorithm
    const layoutNodes: CalcNode[] = nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        x: isNumber(node.data.x) ? node.data.x : Math.random() * width,
        y: isNumber(node.data.y) ? node.data.y : Math.random() * height,
        size: nodeSize(node) || 30,
        mass: getMass(node),
        nodeStrength: nodeStrength(node)
      }
    }));
    const layoutEdges: CalcEdge[] = edges.map(edge => ({
      ...edge,
      data: {
        ...edge.data,
        edgeStrength: edgeStrength(edge),
        linkDistance: linkDistance(edge, graph.getNode(edge.source), graph.getNode(edge.target)),
      }
    }));

    if (!nodes?.length) return { nodes: [], edges };


    const velMap: { [id: string]: Point } = {}
    nodes.forEach((node, i) => {
      velMap[node.id] = {
        x: 0,
        y: 0
      }
    });
    
    const calcGraph = new Graph<CalcNode, CalcEdge>({
      nodes: layoutNodes,
      edges: layoutEdges,
    });

    this.formatCentripetal(mergedOptions, calcGraph);

    const { maxIteration, animate, minMovement, onLayoutEnd, onTick } = mergedOptions;
    const silence = !animate;
    if (silence) {
      for (let i = 0; (this.judgingDistance > minMovement || i < 1) && i < maxIteration; i++) {
        this.runOneStep(calcGraph, graph, i, velMap, mergedOptions);
        this.updatePosition(graph, calcGraph, velMap, mergedOptions);
        if (assign) {
          layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
            x: node.data.x,
            y: node.data.y
          }));
        }
        onTick?.({
          nodes: formatOutNodes(graph, layoutNodes),
          edges
        });
      }

      if (assign) {
        layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y
        }))
      }
      const result = {
        nodes: formatOutNodes(graph, layoutNodes),
        edges
      }
      onLayoutEnd?.(result);
      return result;
      
    } else {
      if (typeof window === "undefined") return;
      let iter = 0;
      // interval for render the result after each iteration
      this.timeInterval = window.setInterval(() => {
        if (!nodes) return;
        this.runOneStep(calcGraph, graph, iter, velMap, mergedOptions);
        this.updatePosition(graph, calcGraph, velMap, mergedOptions);
        if (assign) {
          layoutNodes.forEach(node => graph.mergeNodeData(node.id, {
            x: node.data.x,
            y: node.data.y
          }));
        }
        onTick?.({
          nodes: formatOutNodes(graph, layoutNodes),
          edges
        });
        iter++;
        if (iter >= maxIteration || this.judgingDistance < minMovement) {
          onLayoutEnd?.({
            nodes: formatOutNodes(graph, layoutNodes),
            edges
          });
          window.clearInterval(this.timeInterval);
        }
      }, 0);
    }
    
    // has been returned while silence, and not useful for interval
    return {
      nodes,
      edges
    };
  }

  /**
   * Format merged layout options.
   * @param options merged layout options
   * @param graph original graph
   * @returns 
   */
  private formatOptions(options: ForceLayoutOptions, graph: Graph<Node, Edge>) {
    const { width: propsWidth, height: propsHeight, getMass } = options;
    
    // === formating width, height, and center =====
    options.width = !propsWidth && typeof window !== "undefined" ? window.innerWidth : propsWidth as number;
    options.height = !propsHeight && typeof window !== "undefined" ? window.innerHeight : propsHeight as number;
    if (!options.center) {
      options.center = [options.width / 2, options.height / 2];
    }
    
    // === formating node mass =====
    if (!getMass) {
      options.getMass = (d: Node) => {
        let massWeight = 1;
        if (isNumber(d.data.mass)) massWeight = d.data.mass;
        const degree = graph.getDegree(d.id, 'both');
        return (!degree || degree < 5) ? massWeight : degree * 5 * massWeight;
      }
    }

    // === formating node size =====
    if (options.preventOverlap) {
      const nodeSpacing = options.nodeSpacing;
      const nodeSpacingFunc = getFunc(nodeSpacing, 0);
      if (!options.nodeSize) {
        options.nodeSize = (d: Node) => {
          const { size } = d.data || {};
          if (size) {
            if (isArray(size)) {
              return Math.max(size[0], size[1]) + nodeSpacingFunc(d);
            } if (isObject(size)) {
              return Math.max(size.width, size.height) + nodeSpacingFunc(d);
            }
            return (size as number) + nodeSpacingFunc(d);
          }
          return 10 + nodeSpacingFunc(d);
        };
      } else if (isArray(options.nodeSize)) {
        options.nodeSize = (d: Node) => {
          return Math.max(options.nodeSize[0], options.nodeSize[1]) + nodeSpacingFunc(d);
        };
      } else {
        options.nodeSize = (d: Node) => (options.nodeSize as number) + nodeSpacingFunc(d);
      }
    }

    // === formating node / edge strengths =====
    options.linkDistance = options.linkDistance ?
      getFunc(options.linkDistance, 1) :
      (edge: Edge) => (1 + options.nodeSize(graph.getNode(edge.source)) + options.nodeSize(graph.getNode(edge.target)));
    options.nodeStrength = getFunc(options.nodeStrength, 1);
    options.edgeStrength = getFunc(options.edgeStrength, 1);

    return options;
  }

  /**
   * Format centripetalOption in the option.
   * @param options merged layout options
   * @param calcGraph calculation graph
   */
  private formatCentripetal(options: ForceLayoutOptions, calcGraph: Graph<CalcNode, CalcEdge>) {
    const { centripetalOptions, center, getClusterNodeStrength } = options;
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
          y: center[1]
        };
      },
    };
    if (typeof getClusterNodeStrength !== 'function') {
      options.getClusterNodeStrength = (node: Node) => getClusterNodeStrength;
    }
    let sameTypeLeafMap: any;
    let clusters: string[];
    if (options.leafCluster) {
      sameTypeLeafMap = getSameTypeLeafMap(calcGraph, nodeClusterBy);;
      clusters = Array.from(new Set(calcNodes?.map((node) => node.data[nodeClusterBy]))) || [];
      options.centripetalOptions = Object.assign(basicCentripetal, {
        single: 100,
        leaf: (node: Node) => {
          // 找出与它关联的边的起点或终点出发的所有一度节点中同类型的叶子节点
          const { relativeLeafNodes, sameTypeLeafNodes } = sameTypeLeafMap[node.id] || {};
          // 如果都是同一类型或者每种类型只有1个，则施加默认向心力
          if (sameTypeLeafNodes?.length === relativeLeafNodes?.length || clusters?.length === 1) {
            return 1;
          }
          return getClusterNodeStrength(node);
        },
        others: 1,
        center: (node: Node) => {
          const degree = calcGraph.getDegree(node.id, 'both');
          // 孤点默认给1个远离的中心点
          if (!degree) {
            return {
              x: 100,
              y: 100,
            };
          }
          let centerPos: Point | undefined;
          if (degree === 1) {
            // 如果为叶子节点
            // 找出与它关联的边的起点出发的所有一度节点中同类型的叶子节点
            const { sameTypeLeafNodes = [] } = sameTypeLeafMap[node.id] || {};
            if (sameTypeLeafNodes.length === 1) {
              // 如果同类型的叶子节点只有1个，中心位置为undefined
              centerPos = undefined;
            } else if (sameTypeLeafNodes.length > 1) {
              // 找出同类型节点平均位置作为中心
              centerPos = getAvgNodePosition(sameTypeLeafNodes);
            }
          } else {
            centerPos = undefined;
          }
          return {
            x: centerPos?.x as number,
            y: centerPos?.y as number,
          };
        },
      });
    }
    if (options.clustering) {
      if (!sameTypeLeafMap) sameTypeLeafMap = getSameTypeLeafMap(calcGraph, nodeClusterBy);
      if (!clusters) clusters = Array.from(new Set(calcNodes.map((node: Node) => node.data[nodeClusterBy])));
      clusters = clusters.filter((item) => item !== undefined);

      const centerInfo: { [key: string]: Point } = {};
      clusters.forEach((cluster) => {
        const sameTypeNodes = calcNodes.filter((node) => node.data[nodeClusterBy] === cluster).map((node) => calcGraph.getNode(node.id));
        // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
        centerInfo[cluster] = getAvgNodePosition(sameTypeNodes);
      });
      options.centripetalOptions = Object.assign(basicCentripetal, {
        single: (node: Node) => getClusterNodeStrength(node),
        leaf: (node: Node) => getClusterNodeStrength(node),
        others: (node: Node) => getClusterNodeStrength(node),
        center: (node: Node) => {
          // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
          const centerPos = centerInfo[node.data[nodeClusterBy]];
          return {
            x: centerPos?.x as number,
            y: centerPos?.y as number,
          };
        },
      });
    }
    const { leaf, single, others } = options.centripetalOptions;
    if (leaf && typeof leaf !== 'function') options.centripetalOptions.leaf = () => leaf;
    if (single && typeof single !== 'function') options.centripetalOptions.single = () => single;
    if (others && typeof others !== 'function') options.centripetalOptions.others = () => others;

  }

  private runOneStep(
    calcGraph: Graph<CalcNode, CalcEdge>,
    graph: Graph<Node, Edge>,
    iter: number,
    velMap: { [id: string]: Point },
    options: ForceLayoutOptions
  ) {
    const accMap: { [id: string]: Point } = {};
    const calcNodes = calcGraph.getAllNodes();
    const calcEdges = calcGraph.getAllEdges();
    if (!calcNodes?.length) return;
    const { monitor } = options;
    this.calRepulsive(calcGraph, accMap, options);
    if (calcEdges) this.calAttractive(calcGraph, accMap);
    this.calGravity(calcGraph, graph, accMap, options);
    this.updateVelocity(calcGraph, accMap, velMap, options);

    /** 如果需要监控信息，则提供给用户 */
    if (monitor) {
      const energy = this.calTotalEnergy(accMap, calcNodes);
      monitor({ energy, nodes: graph.getAllNodes(), edges: graph.getAllEdges(), iterations: iter });
    }
  }

  private calTotalEnergy(accMap: { [id: string]: Point }, nodes: CalcNode[]) {
    if (!nodes?.length) return 0;
    let energy = 0.0;

    nodes.forEach((node, i) => {
      const vx = accMap[node.id].x;
      const vy = accMap[node.id].y;
      const speed2 = vx * vx + vy * vy;
      const { mass = 1 } = node;
      energy += mass * speed2 * 0.5; // p = 1/2*(mv^2)
    });

    return energy;
  }

  // coulombs law
  public calRepulsive(calcGraph: Graph<CalcNode, CalcEdge>, accMap: { [id: string]: Point }, options: ForceLayoutOptions) {
    const { factor, coulombDisScale } = options;
    forceNBody(calcGraph, factor, coulombDisScale * coulombDisScale, accMap);
  }

  // hooks law
  public calAttractive(calcGraph: Graph<CalcNode, CalcEdge>, accMap: { [id: string]: Point }) {
    calcGraph.getAllEdges().forEach((edge, i) => {
      const { source, target } = edge;
      const sourceNode = calcGraph.getNode(source);
      const targetNode = calcGraph.getNode(target);
      if (!sourceNode || !targetNode) return;
      let vecX = targetNode.data.x - sourceNode.data.x;
      let vecY = targetNode.data.y - sourceNode.data.y;
      if (!vecX && !vecY) {
        vecX = Math.random() * 0.01;
        vecY = Math.random() * 0.01;
      }
      const vecLength = Math.sqrt(vecX * vecX + vecY * vecY);
      const direX = vecX / vecLength;
      const direY = vecY / vecLength;
      // @ts-ignore
      const { linkDistance = 200, edgeStrength = 200 } = edgeInfos[i] || {};
      const diff = linkDistance - vecLength;
      const param = diff * edgeStrength;
      const massSource = sourceNode.data.mass || 1;
      const massTarget = targetNode.data.mass || 1;
      // 质量占比越大，对另一端影响程度越大
      const sourceMassRatio = 1 / massSource;
      const targetMassRatio = 1 / massTarget;
      const disX = direX * param;
      const disY = direY * param;
      accMap[source].x -= disX * sourceMassRatio;
      accMap[source].y -= disY * sourceMassRatio;
      accMap[target].x += disX * targetMassRatio;
      accMap[target].y += disY * targetMassRatio;
    });
  }

  // attract to center
  public calGravity(calcGraph: Graph<CalcNode, CalcEdge>, graph: Graph<Node, Edge>, accMap: { [id: string]: Point }, options: ForceLayoutOptions) {
    const { getCenter } = options;
    const calcNodes = calcGraph.getAllNodes();
    const nodes = graph.getAllNodes(); // TODO: filter out the invisibles
    const edges = graph.getAllEdges(); // TODO: filter out the invisibles
    const { width, height, center, gravity: defaultGravity, degreesMap, centripetalOptions } = options;
    if (!calcNodes) return;
    calcNodes.forEach(calcNode => {
      const { id, data } = calcNode;
      const { mass, x, y } = data;
      const node = graph.getNode(id);
      let vecX = 0;
      let vecY = 0;
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
      }

      if (gravity) {
        accMap[id].x -= gravity * vecX / mass;
        accMap[id].y -= gravity * vecY / mass;
      }

      if (centripetalOptions) {
        const { leaf, single, others, center: centriCenter } = centripetalOptions;
        const { x: centriX, y: centriY, centerStrength } = centriCenter?.(node, nodes, edges, width, height) || { x: 0, y: 0, centerStrength: 0 };
        if (!isNumber(centriX) || !isNumber(centriY)) return;
        const vx = (x - centriX) / mass;
        const vy = (y - centriY) / mass;
        if (centerStrength) {
          accMap[id].x -= centerStrength * vx;
          accMap[id].y -= centerStrength * vy;
        }

        // 孤点
        if (degree === 0) {
          const singleStrength = single(node);
          if (!singleStrength) return;
          accMap[id].x -= singleStrength * vx;
          accMap[id].y -= singleStrength * vy;
          return;
        }

        // 没有出度或没有入度，都认为是叶子节点
        if (inDegree === 0 || outDegree === 0) {
          const leafStrength = leaf(node, nodes, edges);
          if (!leafStrength) return;
          accMap[id].x -= leafStrength * vx;
          accMap[id].y -= leafStrength * vy;
          return;
        }

        /** others */
        const othersStrength = others(node);
        if (!othersStrength) return;
        accMap[id].x -= othersStrength * vx;
        accMap[id].y -= othersStrength * vy;
      }
    });
  }

  public updateVelocity(
    calcGraph: Graph<CalcNode, CalcEdge>,
    accMap: { [id: string]: Point },
    velMap: { [id: string]: Point },
    options: ForceLayoutOptions
  ) {
    const { damping, maxSpeed, stepInterval } = options;
    const calcNodes = calcGraph.getAllNodes();
    if (!calcNodes?.length) return;
    calcNodes.forEach((calcNode) => {
      const { id } = calcNode;
      let vx = (velMap[id].x + accMap[id].x * stepInterval) * damping || 0.01;
      let vy = (velMap[id].y + accMap[id].y * stepInterval) * damping || 0.01;
      const vLength = Math.sqrt(vx * vx + vy * vy);
      if (vLength > maxSpeed) {
        const param2 = maxSpeed / vLength;
        vx = param2 * vx;
        vy = param2 * vy;
      }
      velMap[id] = {
        x: vx,
        y: vy
      };
    });
  }

  public updatePosition(
    graph: Graph<Node, Edge>,
    calcGraph: Graph<CalcNode, CalcEdge>,
    velMap: { [id: string]: Point },
    options: ForceLayoutOptions
  ) {
    const { distanceThresholdMode, stepInterval } = options;
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
        });
        return;
      }
      const distX = velMap[id].x * stepInterval;
      const distY = velMap[id].y * stepInterval;
      calcGraph.mergeNodeData(id, {
        x: calcNode.data.x + distX,
        y: calcNode.data.y + distY,
      });

      const distanceMagnitude = Math.sqrt(distX * distX + distY * distY);
      switch (distanceThresholdMode) {
        case 'max':
          if (this.judgingDistance < distanceMagnitude) this.judgingDistance = distanceMagnitude;
          break;
        case 'min':
          if (this.judgingDistance > distanceMagnitude) this.judgingDistance = distanceMagnitude;
          break;
        default:
          sum = sum + distanceMagnitude;
          break;
      }
    });
    if (!distanceThresholdMode || distanceThresholdMode === 'mean') this.judgingDistance = sum / calcNodes.length;
  }

  public stop() {
    if (this.timeInterval && typeof window !== "undefined") {
      window.clearInterval(this.timeInterval);
    }
  }
}

const getSameTypeLeafMap = (
  calcGraph: Graph<CalcNode, CalcEdge>,
  nodeClusterBy: string
) => {
  const calcNodes = calcGraph.getAllNodes();
  if (!calcNodes?.length) return;
  const sameTypeLeafMap: {
    [nodeId: string]: {
      coreNode: Node,
      relativeLeafNodes: Node[],
      sameTypeLeafNodes: Node[]
    }
  } = {};
  calcNodes.forEach((node, i) => {
    const degree = calcGraph.getDegree(node.id, 'both');
    if (degree === 1) {
      sameTypeLeafMap[node.id] = getCoreNodeAndRelativeLeafNodes(calcGraph, 'leaf', node, nodeClusterBy);
    }
  });
  return sameTypeLeafMap;
}

const getCoreNodeAndRelativeLeafNodes = (
  calcGraph: Graph<CalcNode, CalcEdge>,
  type: 'leaf' | 'all',
  node: Node, nodeClusterBy: string
): {
  coreNode: Node,
  relativeLeafNodes: Node[],
  sameTypeLeafNodes: Node[]
} => {
  const inDegree = calcGraph.getDegree(node.id, 'in');
  const outDegree = calcGraph.getDegree(node.id, 'out');
  let coreNode: Node = node;
  let relativeLeafNodes: Node[] = [];
  if (inDegree === 0) {
    // 如果为没有出边的叶子节点，则找出与它关联的边的起点出发的所有一度节点
    coreNode = calcGraph.getPredecessors(node.id)[0];
    relativeLeafNodes = calcGraph.getNeighbors(coreNode.id);
  } else if (outDegree === 0) {
    // 如果为没有入边边的叶子节点，则找出与它关联的边的起点出发的所有一度节点
    coreNode = calcGraph.getSuccessors(node.id)[0];
    relativeLeafNodes = calcGraph.getNeighbors(coreNode.id);
  }
  relativeLeafNodes = relativeLeafNodes.filter(
    (node) => calcGraph.getDegree(node.id, 'in') === 0 || calcGraph.getDegree(node.id, 'out') === 0
  );
  const sameTypeLeafNodes = getSameTypeNodes(calcGraph, type, nodeClusterBy, node, relativeLeafNodes);
  return { coreNode, relativeLeafNodes, sameTypeLeafNodes };
};

// 找出同类型的节点
const getSameTypeNodes = (calcGraph: Graph<CalcNode, CalcEdge>, type: 'leaf' | 'all', nodeClusterBy: string, node: Node, relativeNodes: Node[]) => {
  // @ts-ignore
  const typeName = node.data[nodeClusterBy] || '';
  // @ts-ignore
  let sameTypeNodes = relativeNodes?.filter((item) => item.data[nodeClusterBy] === typeName) || [];
  if (type === 'leaf') {
    sameTypeNodes = sameTypeNodes.filter((item) => calcGraph.getDegree(item.id, 'in') === 0 || calcGraph.getDegree(item.id, 'out') === 0);
  }
  return sameTypeNodes;
};

/**
 * Get the average position of nodes
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

const formatOutNodes = (graph: Graph<Node, Edge>, layoutNodes: CalcNode[]): OutNode[] => layoutNodes.map(calcNode => {
  const { id, data } = calcNode;
  const node = graph.getNode(id);
  return {
    ...node,
    data: {
      ...node.data,
      x: data.x,
      y: data.y
    }
  }
});