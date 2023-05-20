/**
 * @fileOverview fruchterman layout
 * @author shiwu.wyy@antfin.com
 */

// @ts-nocheck
import {
  OutNode,
  Edge,
  PointTuple,
  IndexMap,
  Point,
  GForceLayoutOptions,
  Degree,
  NodeMap,
  CentripetalOptions,
} from '../types';
import { Base } from '../base';
import {
  isNumber,
  isFunction,
  isArray,
  getDegreeMap,
  isObject,
  getEdgeTerminal,
  getAvgNodePosition,
  getCoreNodeAndRelativeLeafNodes,
} from '../../util';
import { forceNBody } from './ForceNBody';

type INode = OutNode & {
  size: number | PointTuple;
};

const proccessToFunc = (
  value: number | Function | undefined,
  defaultV?: number
): ((d: any) => number) => {
  let func;
  if (!value) {
    func = (d: any): number => {
      return defaultV || 1;
    };
  } else if (isNumber(value)) {
    func = (d: any): number => {
      return value;
    };
  } else {
    func = value;
  }
  return func as any;
};

/**
 * graphin 中的 force 布局
 */
export class Force2Layout extends Base {
  /** 布局中心 */
  public center: PointTuple;

  /** 停止迭代的最大迭代数 */
  public maxIteration: number = 1000;

  /** 是否启动 worker */
  public workerEnabled: boolean = false;

  /** 弹簧引力系数 */
  public edgeStrength: number | ((d?: any) => number) | undefined = 200;

  /** 斥力系数 */
  public nodeStrength:
    | number
    | ((d?: any, edges?: any[]) => number)
    | undefined = 1000;

  /** 库伦系数 */
  public coulombDisScale: number = 0.005;

  /** 阻尼系数 */
  public damping: number = 0.9;

  /** 最大速度 */
  public maxSpeed: number = 500;

  /** 一次迭代的平均移动距离小于该值时停止迭代 */
  public minMovement: number = 0.4;

  /** 迭代中衰减 */
  public interval: number = 0.02;

  /** 斥力的一个系数 */
  public factor: number = 1;

  /** 每个节点质量的回调函数，若不指定，则默认使用度数作为节点质量 */
  public getMass: ((d?: any) => number) | undefined;

  /** 每个节点中心力的 x、y、强度的回调函数，若不指定，则没有额外中心力 */
  public getCenter: ((d?: any, degree?: number) => number[]) | undefined;

  /** 计算画布上下两侧对节点吸引力大小  */
  public defSideCoe?: (node: Node, edges: Edge[]) => number;

  /** 理想边长 */
  public linkDistance:
    | number
    | ((edge?: any, source?: any, target?: any) => number)
    | undefined = 200;

  /** 理想边长，兼容 graphin-force */
  public defSpringLen:
    | number
    | ((edge?: any, source?: any, target?: any) => number)
    | undefined;

  /** 重力大小 */
  public gravity: number = 0;

  /** 向心力 */
  public centripetalOptions: CentripetalOptions;

  /** 是否需要叶子节点聚类 */
  public leafCluster: boolean;

  /** 是否需要全部节点聚类 */
  public clustering: boolean;

  /** 节点聚类的映射字段 */
  public nodeClusterBy: string;

  /** 节点聚类作用力系数 */
  public clusterNodeStrength: number | ((node: Node) => number) = 20;

  /** 是否防止重叠 */
  public preventOverlap: boolean = true;

  /** 防止重叠时的节点大小，默认从节点数据中取 size */
  public nodeSize: number | number[] | ((d?: any) => number) | undefined;

  /** 防止重叠时的节点之间最小间距 */
  public nodeSpacing: number | number[] | ((d?: any) => number) | undefined;

  /** 阈值的使用条件，mean 代表平均移动距离小于 minMovement 时停止迭代，max 代表最大移动距离大时 minMovement 时停时迭代。默认为 mean */
  public distanceThresholdMode: 'mean' | 'max' | 'min' = 'mean';

  /** 每次迭代结束的回调函数 */
  public tick: (() => void) | null = () => {};

  /** 是否允许每次迭代结束调用回调函数 */
  public enableTick: boolean;

  public nodes: INode[] | null = [];

  public edges: Edge[] | null = [];

  public width: number = 300;

  public height: number = 300;

  public nodeMap: NodeMap = {};

  public nodeIdxMap: IndexMap = {};

  public canvasEl: HTMLCanvasElement;

  public onLayoutEnd: () => void;

  /** 是否使用 window.setInterval 运行迭代 */
  public animate: Boolean;

  /** 监控信息，不配置则不计算 */
  public monitor: (params: {
    energy: number;
    nodes: INode[];
    edge: Edge[];
    iterations: number;
  }) => void;

  /** 存储节点度数 */
  private degreesMap: { [id: string]: Degree };

  /** 迭代中的标识 */
  private timeInterval: number;

  /** 与 minMovement 进行对比的判断停止迭代节点移动距离 */
  private judgingDistance: number;

  /** 缓存一个节点的相关边数据 */
  private relatedEdges: { [nodeId: string]: Edge[] };

  /** 缓存当前迭代中最小和最大的 y 值，用于计算上下引力 */
  private currentMinY: number;
  private currentMaxY: number;

  constructor(options?: GForceLayoutOptions) {
    super();
    this.judgingDistance = 0;
    /** 默认的向心配置 */
    this.centripetalOptions = {
      leaf: 2,
      single: 2,
      others: 1,
      // eslint-disable-next-line
      center: (n: any) => {
        return {
          x: this.width / 2,
          y: this.height / 2,
        };
      },
    };
    const { getMass } = options;
    this.propsGetMass = getMass;
    this.updateCfg(options);
  }

  public getCentripetalOptions() {
    const {
      leafCluster,
      clustering,
      nodeClusterBy,
      nodes,
      nodeMap,
      clusterNodeStrength: propsClusterNodeStrength,
    } = this;

    const getClusterNodeStrength = (node: Node) =>
      typeof propsClusterNodeStrength === 'function'
        ? propsClusterNodeStrength(node)
        : propsClusterNodeStrength;

    let centripetalOptions = {};
    let sameTypeLeafMap: any;
    // 如果传入了需要叶子节点聚类
    if (leafCluster) {
      sameTypeLeafMap = this.getSameTypeLeafMap() || {};
      const relativeNodesType =
        Array.from(new Set(nodes?.map((node) => node[nodeClusterBy]))) || [];
      centripetalOptions = {
        single: 100,
        leaf: (node, nodes, edges) => {
          // 找出与它关联的边的起点或终点出发的所有一度节点中同类型的叶子节点
          const { relativeLeafNodes, sameTypeLeafNodes } =
            sameTypeLeafMap[node.id] || {};
          // 如果都是同一类型或者每种类型只有1个，则施加默认向心力
          if (
            sameTypeLeafNodes?.length === relativeLeafNodes?.length ||
            relativeNodesType?.length === 1
          ) {
            return 1;
          }
          return getClusterNodeStrength(node);
        },
        others: 1,
        center: (node, nodes, edges) => {
          const { degree } = node.data?.layout || {};
          // 孤点默认给1个远离的中心点
          if (!degree) {
            return {
              x: 100,
              y: 100,
            };
          }
          let centerNode;
          if (degree === 1) {
            // 如果为叶子节点
            // 找出与它关联的边的起点出发的所有一度节点中同类型的叶子节点
            const { sameTypeLeafNodes = [] } = sameTypeLeafMap[node.id] || {};
            if (sameTypeLeafNodes.length === 1) {
              // 如果同类型的叶子节点只有1个，中心节点置为undefined
              centerNode = undefined;
            } else if (sameTypeLeafNodes.length > 1) {
              // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
              centerNode = getAvgNodePosition(sameTypeLeafNodes);
            }
          } else {
            centerNode = undefined;
          }
          return {
            x: centerNode?.x as number,
            y: centerNode?.y as number,
          };
        },
      };
    }

    // 如果传入了全局节点聚类
    if (clustering) {
      if (!sameTypeLeafMap) sameTypeLeafMap = this.getSameTypeLeafMap();
      const clusters: string[] = Array.from(
        new Set(
          nodes.map((node, i) => {
            return node[nodeClusterBy];
          })
        )
      ).filter((item) => item !== undefined);
      const centerNodeInfo: { [key: string]: { x: number; y: number } } = {};
      clusters.forEach((cluster) => {
        const sameTypeNodes = nodes
          .filter((item) => item[nodeClusterBy] === cluster)
          .map((node) => nodeMap[node.id]);
        // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
        centerNodeInfo[cluster] = getAvgNodePosition(sameTypeNodes);
      });
      centripetalOptions = {
        single: (node) => getClusterNodeStrength(node),
        leaf: (node) => getClusterNodeStrength(node),
        others: (node) => getClusterNodeStrength(node),
        center: (node, nodes, edges) => {
          // 找出同类型节点平均位置节点的距离最近的节点作为中心节点
          const centerNode = centerNodeInfo[node[nodeClusterBy]];
          return {
            x: centerNode?.x as number,
            y: centerNode?.y as number,
          };
        },
      };
    }

    this.centripetalOptions = {
      ...this.centripetalOptions,
      ...centripetalOptions,
    };

    const { leaf, single, others } = this.centripetalOptions;
    if (leaf && typeof leaf !== 'function')
      this.centripetalOptions.leaf = () => leaf;
    if (single && typeof single !== 'function')
      this.centripetalOptions.single = () => single;
    if (others && typeof others !== 'function')
      this.centripetalOptions.others = () => others;
  }

  public updateCfg(cfg: any) {
    if (cfg) Object.assign(this, cfg);
  }

  public getDefaultCfg() {
    return {
      maxIteration: 500,
      gravity: 10,
      enableTick: true,
      animate: true,
    };
  }

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    self.stop();
    const { nodes, edges, defSpringLen } = self;

    self.judgingDistance = 0;

    if (!nodes || nodes.length === 0) {
      self.onLayoutEnd([]);
      return;
    }

    if (!self.width && typeof window !== 'undefined') {
      self.width = window.innerWidth;
    }
    if (!self.height && typeof window !== 'undefined') {
      self.height = window.innerHeight;
    }
    if (!self.center) {
      self.center = [self.width / 2, self.height / 2];
    }
    const center = self.center;

    if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      self.onLayoutEnd([{ ...nodes[0] }]);
      return;
    }
    self.degreesMap = getDegreeMap(nodes, edges);
    if (self.propsGetMass) {
      self.getMass = self.propsGetMass;
    } else {
      self.getMass = (d) => {
        let massWeight = 1;
        if (isNumber(d.mass)) massWeight = d.mass;
        const degree = self.degreesMap[d.id].all;
        return !degree || degree < 5 ? massWeight : degree * 5 * massWeight;
      };
    }

    // node size function
    const nodeSize = self.nodeSize;
    let nodeSizeFunc;
    if (self.preventOverlap) {
      const nodeSpacing = self.nodeSpacing;
      let nodeSpacingFunc: (d?: any) => number;
      if (isNumber(nodeSpacing)) {
        nodeSpacingFunc = () => nodeSpacing as number;
      } else if (isFunction(nodeSpacing)) {
        nodeSpacingFunc = nodeSpacing as (d?: any) => number;
      } else {
        nodeSpacingFunc = () => 0;
      }
      if (!nodeSize) {
        nodeSizeFunc = (d: INode) => {
          if (d.size) {
            if (isArray(d.size)) {
              return Math.max(d.size[0], d.size[1]) + nodeSpacingFunc(d);
            } else if (isObject(d.size)) {
              return Math.max(d.size.width, d.size.height) + nodeSpacingFunc(d);
            }
            return (d.size as number) + nodeSpacingFunc(d);
          }
          return 10 + nodeSpacingFunc(d);
        };
      } else if (isArray(nodeSize)) {
        nodeSizeFunc = (d: INode) => {
          return Math.max(nodeSize[0], nodeSize[1]) + nodeSpacingFunc(d);
        };
      } else {
        nodeSizeFunc = (d: INode) => (nodeSize as number) + nodeSpacingFunc(d);
      }
    }
    self.nodeSize = nodeSizeFunc;

    self.linkDistance = proccessToFunc(self.linkDistance, 1);
    self.nodeStrength = proccessToFunc(self.nodeStrength, 1);
    self.edgeStrength = proccessToFunc(self.edgeStrength, 1);

    const nodeMap: NodeMap = {};
    const nodeIdxMap: IndexMap = {};
    nodes.forEach((node, i) => {
      if (!isNumber(node.x)) node.x = Math.random() * self.width;
      if (!isNumber(node.y)) node.y = Math.random() * self.height;
      const degree = self.degreesMap[node.id];
      nodeMap[node.id] = {
        ...node,
        data: {
          ...node.data,
          size: self.nodeSize(node) || 30,
          layout: {
            inDegree: degree.in,
            outDegree: degree.out,
            degree: degree.all,
            tDegree: degree.in,
            sDegree: degree.out,
            force: {
              mass: self.getMass(node),
              nodeStrength: self.nodeStrength(node, edges),
            },
          },
        },
      };
      nodeIdxMap[node.id] = i;
    });
    self.nodeMap = nodeMap;
    self.nodeIdxMap = nodeIdxMap;

    self.edgeInfos = [];
    edges?.forEach((edge) => {
      const sourceNode = nodeMap[edge.source];
      const targetNode = nodeMap[edge.target];
      if (!sourceNode || !targetNode) {
        elf.edgeInfos.push({});
      } else {
        self.edgeInfos.push({
          edgeStrength: self.edgeStrength(edge),
          linkDistance: defSpringLen
            ? defSpringLen(
                {
                  ...edge,
                  source: sourceNode,
                  target: targetNode,
                },
                sourceNode,
                targetNode
              )
            : self.linkDistance(edge, sourceNode, targetNode) ||
              1 + (nodeSize(sourceNode) + nodeSize(sourceNode) || 0) / 2,
        });
      }
    });

    this.getCentripetalOptions();

    self.onLayoutEnd = self.onLayoutEnd || (() => {});

    self.run();
  }

  public run() {
    const self = this;
    const {
      maxIteration,
      nodes,
      edges,
      workerEnabled,
      minMovement,
      animate,
      nodeMap,
      height,
    } = self;
    self.currentMinY = 0;
    self.currentMaxY = height;

    if (!nodes) return;

    const velArray: number[] = [];
    nodes.forEach((_, i) => {
      velArray[2 * i] = 0;
      velArray[2 * i + 1] = 0;
    });

    if (this.defSideCoe && typeof this.defSideCoe === 'function') {
      const relatedEdges: { [nodeId: string]: Edge[] } = {};
      edges.forEach((edge) => {
        const { source, target } = edge;
        relatedEdges[source] = relatedEdges[source] || [];
        relatedEdges[source].push(edge);
        relatedEdges[target] = relatedEdges[target] || [];
        relatedEdges[target].push(edge);
      });
      this.relatedEdges = relatedEdges;
    }

    const maxIter = maxIteration;
    const silence = !animate;
    if (workerEnabled || silence) {
      let usedIter = 0;
      for (
        let i = 0;
        (self.judgingDistance > minMovement || i < 1) && i < maxIter;
        i++
      ) {
        usedIter = i;
        self.runOneStep(i, velArray);
      }
      self.onLayoutEnd(Object.values(nodeMap));
    } else {
      if (typeof window === 'undefined') return;
      let iter = 0;
      // interval for render the result after each iteration
      this.timeInterval = window.setInterval(() => {
        if (!nodes) return;
        self.runOneStep(iter, velArray);
        iter++;
        if (iter >= maxIter || self.judgingDistance < minMovement) {
          self.onLayoutEnd(Object.values(nodeMap));
          window.clearInterval(self.timeInterval);
        }
      }, 0);
    }
  }

  private runOneStep(iter: number, velArray: number[]) {
    const self = this;
    const { nodes, edges, nodeMap, monitor } = self;
    const accArray: number[] = [];
    if (!nodes?.length) return;
    self.calRepulsive(accArray);
    if (edges) self.calAttractive(accArray);
    self.calGravity(accArray);
    self.attractToSide(accArray);
    const stepInterval = self.interval; // Math.max(0.02, self.interval - iter * 0.002);
    self.updateVelocity(accArray, velArray, stepInterval);
    self.updatePosition(velArray, stepInterval);
    self.tick?.();

    /** 如果需要监控信息，则提供给用户 */
    if (monitor) {
      const energy = this.calTotalEnergy(accArray);
      monitor({ energy, nodes, edges, iterations: iter });
    }
  }

  private calTotalEnergy(accArray: number[]) {
    const { nodes, nodeMap } = this;
    if (!nodes?.length) return 0;
    let energy = 0.0;

    nodes.forEach((node, i) => {
      const vx = accArray[2 * i];
      const vy = accArray[2 * i + 1];
      const speed2 = vx * vx + vy * vy;
      const { mass = 1 } = nodeMap[node.id].data.layout.force;
      energy += mass * speed2 * 0.5; // p = 1/2*(mv^2)
    });

    return energy;
  }

  // coulombs law
  public calRepulsive(accArray: number[]) {
    const self = this;
    const { nodes, nodeMap, factor, coulombDisScale } = self;
    const nodeSize = self.nodeSize as Function;
    forceNBody(
      nodes,
      nodeMap,
      factor,
      coulombDisScale * coulombDisScale,
      accArray
    );
  }

  // hooks law
  public calAttractive(accArray: number[]) {
    const self = this;
    const { edges, nodeMap, nodeIdxMap, edgeInfos } = self;
    const nodeSize = self.nodeSize as Function;
    edges.forEach((edge, i) => {
      const source = getEdgeTerminal(edge, 'source');
      const target = getEdgeTerminal(edge, 'target');
      const sourceNode = nodeMap[source];
      const targetNode = nodeMap[target];
      if (!sourceNode || !targetNode) return;
      let vecX = targetNode.x - sourceNode.x;
      let vecY = targetNode.y - sourceNode.y;
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
      const massSource = sourceNode.data.layout.force.mass || 1;
      const massTarget = targetNode.data.layout.force.mass || 1;
      // 质量占比越大，对另一端影响程度越大
      const sourceMassRatio = 1 / massSource;
      const targetMassRatio = 1 / massTarget;
      const disX = direX * param;
      const disY = direY * param;
      const sourceIdx = 2 * nodeIdxMap[source];
      const targetIdx = 2 * nodeIdxMap[target];
      accArray[sourceIdx] -= disX * sourceMassRatio;
      accArray[sourceIdx + 1] -= disY * sourceMassRatio;
      accArray[targetIdx] += disX * targetMassRatio;
      accArray[targetIdx + 1] += disY * targetMassRatio;
    });
  }

  // attract to center
  public calGravity(accArray: number[]) {
    const self = this;
    const {
      nodes,
      edges = [],
      nodeMap,
      width,
      height,
      center,
      gravity: defaultGravity,
      degreesMap,
      centripetalOptions,
    } = self;
    if (!nodes) return;
    const nodeLength = nodes.length;
    for (let i = 0; i < nodeLength; i++) {
      const idx = 2 * i;
      const node = nodeMap[nodes[i].id];
      const { mass = 1 } = node.data.layout.force;
      let vecX = 0;
      let vecY = 0;
      let gravity = defaultGravity;

      const { in: inDegree, out: outDegree, all: degree } = degreesMap[node.id];
      const forceCenter = self.getCenter?.(node, degree);
      if (forceCenter) {
        const [centerX, centerY, strength] = forceCenter;
        vecX = node.x - centerX;
        vecY = node.y - centerY;
        gravity = strength;
      } else {
        vecX = node.x - center[0];
        vecY = node.y - center[1];
      }

      if (gravity) {
        accArray[idx] -= (gravity * vecX) / mass;
        accArray[idx + 1] -= (gravity * vecY) / mass;
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
          centerStrength,
        } = centriCenter?.(node, nodes, edges, width, height) || {
          x: 0,
          y: 0,
          centerStrength: 0,
        };
        if (!isNumber(centriX) || !isNumber(centriY)) continue;
        const vx = (node.x - centriX) / mass;
        const vy = (node.y - centriY) / mass;
        if (centerStrength) {
          accArray[idx] -= centerStrength * vx;
          accArray[idx + 1] -= centerStrength * vy;
        }

        // 孤点
        if (degree === 0) {
          const singleStrength = single(node);
          if (!singleStrength) continue;
          accArray[idx] -= singleStrength * vx;
          accArray[idx + 1] -= singleStrength * vy;
          continue;
        }

        // 没有出度或没有入度，都认为是叶子节点
        if (inDegree === 0 || outDegree === 0) {
          const leafStrength = leaf(node, nodes, edges);
          if (!leafStrength) continue;
          accArray[idx] -= leafStrength * vx;
          accArray[idx + 1] -= leafStrength * vy;
          continue;
        }

        /** others */
        const othersStrength = others(node);
        if (!othersStrength) continue;
        accArray[idx] -= othersStrength * vx;
        accArray[idx + 1] -= othersStrength * vy;
      }
    }
  }

  /**
   * Attract forces to the top and bottom.
   * @param accArray
   * @returns
   */
  public attractToSide(accArray: number[]) {
    const {
      defSideCoe,
      height,
      nodes,
      relatedEdges,
      currentMinY = 0,
      currentMaxY = this.height,
    } = this;
    if (!defSideCoe || typeof defSideCoe !== 'function' || !nodes?.length)
      return;
    nodes.forEach((node, i) => {
      const sideCoe = defSideCoe!(node, relatedEdges[node.id] || []);
      if (sideCoe === 0) return;
      const targetY = sideCoe < 0 ? currentMinY : currentMaxY;
      const strength = Math.abs(sideCoe);
      accArray[2 * i + 1] -= strength * (node.y - targetY);
    });
  }

  public updateVelocity(
    accArray: number[],
    velArray: number[],
    stepInterval: number
  ) {
    const self = this;
    const { nodes, damping, maxSpeed } = self;
    if (!nodes?.length) return;
    nodes.forEach((_, i) => {
      let vx =
        (velArray[2 * i] + accArray[2 * i] * stepInterval) * damping || 0.01;
      let vy =
        (velArray[2 * i + 1] + accArray[2 * i + 1] * stepInterval) * damping ||
        0.01;
      const vLength = Math.sqrt(vx * vx + vy * vy);
      if (vLength > maxSpeed) {
        const param2 = maxSpeed / vLength;
        vx = param2 * vx;
        vy = param2 * vy;
      }
      velArray[2 * i] = vx;
      velArray[2 * i + 1] = vy;
    });
  }

  public updatePosition(velArray: number[], stepInterval: number) {
    const self = this;
    const { nodes, distanceThresholdMode, nodeMap } = self;
    if (!nodes?.length) {
      this.judgingDistance = 0;
      return;
    }
    let sum = 0;
    if (distanceThresholdMode === 'max') self.judgingDistance = -Infinity;
    else if (distanceThresholdMode === 'min') self.judgingDistance = Infinity;

    let currentMinY = Infinity;
    let currentMaxY = -Infinity;
    nodes.forEach((node: any, i) => {
      const mappedNode = nodeMap[node.id];
      if (isNumber(node.fx) && isNumber(node.fy)) {
        node.x = node.fx;
        node.y = node.fy;
        mappedNode.x = node.x;
        mappedNode.y = node.y;
        return;
      }
      const distX = velArray[2 * i] * stepInterval;
      const distY = velArray[2 * i + 1] * stepInterval;
      node.x += distX;
      node.y += distY;
      mappedNode.x = node.x;
      mappedNode.y = node.y;

      if (node.y < currentMinY) currentMinY = node.y;
      if (node.y > currentMaxY) currentMaxY = node.y;

      const distanceMagnitude = Math.sqrt(distX * distX + distY * distY);
      switch (distanceThresholdMode) {
        case 'max':
          if (self.judgingDistance < distanceMagnitude)
            self.judgingDistance = distanceMagnitude;
          break;
        case 'min':
          if (self.judgingDistance > distanceMagnitude)
            self.judgingDistance = distanceMagnitude;
          break;
        default:
          sum = sum + distanceMagnitude;
          break;
      }
    });
    this.currentMinY = currentMinY;
    this.currentMaxY = currentMaxY;
    if (!distanceThresholdMode || distanceThresholdMode === 'mean')
      self.judgingDistance = sum / nodes.length;
  }

  public stop() {
    if (this.timeInterval && typeof window !== 'undefined') {
      window.clearInterval(this.timeInterval);
    }
  }

  public destroy() {
    const self = this;
    self.stop();
    self.tick = null;
    self.nodes = null;
    self.edges = null;
    self.destroyed = true;
  }

  public getType() {
    return 'force2';
  }

  private getSameTypeLeafMap() {
    const { nodeClusterBy, nodes, edges, nodeMap, degreesMap } = this;
    if (!nodes?.length) return;
    // eslint-disable-next-line
    const sameTypeLeafMap: { [nodeId: string]: any } = {};
    nodes.forEach((node, i) => {
      const degree = degreesMap[node.id].all;
      if (degree === 1) {
        sameTypeLeafMap[node.id] = getCoreNodeAndRelativeLeafNodes(
          'leaf',
          node,
          edges,
          nodeClusterBy,
          degreesMap,
          nodeMap
        );
      }
    });
    return sameTypeLeafMap;
  }
}
