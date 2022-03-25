/**
 * @fileOverview dagre layout
 * @author shiwu.wyy@antfin.com
 */

import { Edge, OutNode, DagreLayoutOptions, PointTuple, Point, Node } from "./types";
import dagre from "./dagre/index";
import { isArray, isNumber, isObject, getEdgeTerminal, getFunc, isString } from "../util";
import { Base } from "./base";
import { Graph as DagreGraph } from './dagre/graph';

/**
 * 层次布局
 */
export class DagreLayout extends Base {
  /** layout 方向, 可选 TB, BT, LR, RL */
  public rankdir: "TB" | "BT" | "LR" | "RL" = "TB";

  /** 节点对齐方式，可选 UL, UR, DL, DR */
  public align: undefined | "UL" | "UR" | "DL" | "DR";

  /** 布局的起始（左上角）位置 */
  public begin: PointTuple;

  /** 节点大小 */
  public nodeSize: number | number[] | undefined;

  /** 节点水平间距(px) */
  public nodesepFunc: ((d?: any) => number) | undefined;

  /** 每一层节点之间间距 */
  public ranksepFunc: ((d?: any) => number) | undefined;

  /** 节点水平间距(px) */
  public nodesep: number = 50;

  /** 每一层节点之间间距 */
  public ranksep: number = 50;

  /** 是否保留布局连线的控制点 */
  public controlPoints: boolean = false;

  /** 每层节点是否根据节点数据中的 comboId 进行排序，以防止同层 combo 重叠 */
  public sortByCombo: boolean = false;

  /** 是否保留每条边上的dummy node */
  public edgeLabelSpace: boolean = true;

  /** 是否基于 dagre 进行辐射布局，若是，第一层节点将被放置在最内环上，其余层依次向外辐射 */
  public radial: boolean = false;

  /** radial 下生效，中心节点，被指定的节点及其同层节点将被放置在最内环上 */
  public focusNode: string | Node | null;

  /** 给定的节点顺序，配合keepNodeOrder使用 */
  public nodeOrder: string[];

  /** 上次的布局结果 */
  public preset: {
    nodes: OutNode[],
    edges: any[],
  };

  public nodes: OutNode[] = [];

  public edges: Edge[] = [];

  /** 迭代结束的回调函数 */
  public onLayoutEnd: () => void = () => {};

  constructor(options?: DagreLayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {
      rankdir: "TB", // layout 方向, 可选 TB, BT, LR, RL
      align: undefined, // 节点对齐方式，可选 UL, UR, DL, DR
      nodeSize: undefined, // 节点大小
      nodesepFunc: undefined, // 节点水平间距(px)
      ranksepFunc: undefined, // 每一层节点之间间距
      nodesep: 50, // 节点水平间距(px)
      ranksep: 50, // 每一层节点之间间距
      controlPoints: false, // 是否保留布局连线的控制点
      radial: false, // 是否基于 dagre 进行辐射布局
      focusNode: null, // radial 为 true 时生效，关注的节点
    };
  }

  public layoutNode = (nodeId: string) => {
    const self = this;
    const { nodes } = self;
    const node = nodes.find((node) => node.id === nodeId);
    if (node) {
      const layout = node.layout !== false;
      return layout;
    }
    return true;
  }

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const { nodes, nodeSize, rankdir, combos, begin, radial } = self;
    if (!nodes) return;
    const edges = (self.edges as any[]) || [];
    const g = new DagreGraph({
      multigraph: true,
      compound: true,
    });

    let nodeSizeFunc: (d?: any) => number[];
    if (!nodeSize) {
      nodeSizeFunc = (d: any) => {
        if (d.size) {
          if (isArray(d.size)) {
            return d.size;
          }  if (isObject(d.size)) {
            return [d.size.width || 40, d.size.height || 40];
          }
          return [d.size, d.size];
        }
        return [40, 40];
      };
    } else if (isArray(nodeSize)) {
      nodeSizeFunc = () => nodeSize;
    } else {
      nodeSizeFunc = () => [nodeSize, nodeSize];
    }
    const ranksepfunc = getFunc(self.ranksep, 50, self.ranksepFunc);
    const nodesepfunc = getFunc(self.nodesep, 50, self.nodesepFunc);
    let horisep: Function = nodesepfunc;
    let vertisep: Function = ranksepfunc;

    if (rankdir === "LR" || rankdir === "RL") {
      horisep = ranksepfunc;
      vertisep = nodesepfunc;
    }
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(self);

    const comboMap: { [key: string]: boolean } = {};

    if (this.sortByCombo && combos) {
      combos.forEach((combo) => {
        if (!combo.parentId) return;
        if (!comboMap[combo.parentId]) {
          comboMap[combo.parentId] = true;
          g.setNode(combo.parentId, {});
        }
        g.setParent(combo.id, combo.parentId);
      });
    }

    nodes.filter((node) => node.layout !== false).forEach((node) => {
      const size = nodeSizeFunc(node);
      const verti = vertisep(node);
      const hori = horisep(node);
      const width = size[0] + 2 * hori;
      const height = size[1] + 2 * verti;
      const layer = node.layer;
      if (isNumber(layer)) {
        // 如果有layer属性，加入到node的label中
        g.setNode(node.id, { width, height, layer });
      } else {
        g.setNode(node.id, { width, height });
      }

      if (this.sortByCombo && node.comboId) {
        if (!comboMap[node.comboId]) {
          comboMap[node.comboId] = true;
          g.setNode(node.comboId, {});
        }
        g.setParent(node.id, node.comboId);
      }
    });
    


    edges.forEach((edge) => {
      // dagrejs Wiki https://github.com/dagrejs/dagre/wiki#configuring-the-layout
      const source = getEdgeTerminal(edge, 'source');
      const target = getEdgeTerminal(edge, 'target');
      if (this.layoutNode(source) && this.layoutNode(target)) {
        g.setEdge(source, target, {
          weight: edge.weight || 1,
        });
      }
    });

    // 考虑增量图中的原始图
    let prevGraph: DagreGraph | undefined = undefined;
    if (self.preset) {
      prevGraph = new DagreGraph({
        multigraph: true,
        compound: true,
      });
      self.preset.nodes.forEach((node) => {
        prevGraph?.setNode(node.id, node);
      });
    }

    dagre.layout(g, {
      prevGraph,
      edgeLabelSpace: self.edgeLabelSpace,
      keepNodeOrder: Boolean(!!self.nodeOrder),
      nodeOrder: self.nodeOrder,
    });

    const dBegin = [0, 0];
    if (begin) {
      let minX = Infinity;
      let minY = Infinity;
      g.nodes().forEach((node) => {
        const coord = g.node(node)!;
        if (minX > coord.x!) minX = coord.x!;
        if (minY > coord.y!) minY = coord.y!;
      });
      g.edges().forEach((edge) => {
        const coord = g.edge(edge)!;
        coord.points?.forEach((point: any) => {
          if (minX > point.x) minX = point.x;
          if (minY > point.y) minY = point.y;
        });
      });
      dBegin[0] = begin[0] - minX;
      dBegin[1] = begin[1] - minY;
    }

    // 变形为辐射
    if (radial) {
      const { focusNode, ranksep, getRadialPos } = this;
      const focusId = isString(focusNode) ? focusNode: focusNode?.id;
      const focusLayer = focusId ? g.node(focusId)?._rank : 0;
      const layers: any[] = [];
      const isHorizontal = rankdir === 'LR' || rankdir === 'RL';
      const dim = isHorizontal ? 'y' : 'x';
      const sizeDim = isHorizontal ? 'height' : 'width';
      // 找到整个图作为环的坐标维度（dim）的最大、最小值，考虑节点宽度
      let min = Infinity;
      let max = -Infinity;
      g.nodes().forEach((node: any) => {
        const coord = g.node(node)! as any;
        const i = nodes.findIndex((it) => it.id === node);
        if (!nodes[i]) return;
        const currentNodesep = nodesepfunc(nodes[i]);

        if (focusLayer === 0) {
          if (!layers[coord._rank]) layers[coord._rank] = { nodes: [], totalWidth: 0, maxSize: -Infinity };
          layers[coord._rank].nodes.push(node);
          layers[coord._rank].totalWidth += currentNodesep * 2 + coord[sizeDim];
          if (layers[coord._rank].maxSize < Math.max(coord.width, coord.height)) layers[coord._rank].maxSize = Math.max(coord.width, coord.height);
        } else {
          const diffLayer = coord._rank - focusLayer!;
          if (diffLayer === 0) {
            if (!layers[diffLayer]) layers[diffLayer] = { nodes: [], totalWidth: 0, maxSize: -Infinity };
            layers[diffLayer].nodes.push(node);
            layers[diffLayer].totalWidth += currentNodesep * 2 + coord[sizeDim];
            if (layers[diffLayer].maxSize < Math.max(coord.width, coord.height)) layers[diffLayer].maxSize = Math.max(coord.width, coord.height);
          } else {
            const diffLayerAbs = Math.abs(diffLayer);
            if (!layers[diffLayerAbs]) layers[diffLayerAbs] = { left: [], right: [], totalWidth: 0, maxSize: -Infinity };
            layers[diffLayerAbs].totalWidth += currentNodesep * 2 + coord[sizeDim];
            if (layers[diffLayerAbs].maxSize < Math.max(coord.width, coord.height)) layers[diffLayerAbs].maxSize = Math.max(coord.width, coord.height);
            if (diffLayer < 0) {
              layers[diffLayerAbs].left.push(node);
            } else {
              layers[diffLayerAbs].right.push(node);
            }
          }
        }
        const leftPos = coord[dim] - coord[sizeDim] / 2 - currentNodesep;
        const rightPos = coord[dim] + coord[sizeDim] / 2 + currentNodesep;
        if (leftPos < min) min = leftPos;
        if (rightPos > max) max = rightPos;
      });
      // const padding = (max - min) * 0.1; // TODO
      // 初始化为第一圈的半径，后面根据每层 ranksep 叠加
      let radius = ranksep || 50; // TODO;
      const radiusMap: any = {};

      // 扩大最大最小值范围，以便为环上留出接缝处的空隙
      const rangeLength = (max - min) / 0.9;
      const range = [ (min + max - rangeLength) * 0.5 , (min + max + rangeLength) * 0.5 ];

      // 根据半径、分布比例，计算节点在环上的位置，并返回该组节点中最大的 ranksep 值
      const processNodes = (layerNodes: any, radius: number, propsMaxRanksep = -Infinity, arcRange = [0, 1]) => {
        let maxRanksep = propsMaxRanksep;
        layerNodes.forEach((node: any) => {
          const coord = g.node(node);
          radiusMap[node] = radius;
          // 获取变形为 radial 后的直角坐标系坐标
          const { x: newX, y: newY } = getRadialPos(coord![dim]!, range, rangeLength, radius, arcRange);
          // 将新坐标写入源数据
          const i = nodes.findIndex((it) => it.id === node);
          if (!nodes[i]) return;
          nodes[i].x = newX + dBegin[0];
          nodes[i].y = newY + dBegin[1];
          // @ts-ignore: pass layer order to data for increment layout use
          nodes[i]._order = coord._order;

          // 找到本层最大的一个 ranksep，作为下一层与本层的间隙，叠加到下一层的半径上
          const currentNodeRanksep = ranksepfunc(nodes[i]);
          if (maxRanksep < currentNodeRanksep) maxRanksep = currentNodeRanksep;
        });
        return maxRanksep;
      };

      let isFirstLevel = true;
      const lastLayerMaxNodeSize = 0;
      layers.forEach((layerNodes) => {
        if (!layerNodes?.nodes?.length && !layerNodes?.left?.length && !layerNodes?.right?.length) return;
        // 第一层只有一个节点，直接放在圆心，初始半径设定为 0
        if (isFirstLevel && layerNodes.nodes.length === 1) {
          // 将新坐标写入源数据
          const i = nodes.findIndex((it) => it.id === layerNodes.nodes[0]);
          nodes[i].x = dBegin[0];
          nodes[i].y = dBegin[1];
          radiusMap[layerNodes.nodes[0]] = 0;
          radius = ranksepfunc(nodes[i]);
          isFirstLevel = false;
          return;
        }

        // 为接缝留出空隙，半径也需要扩大
        radius = Math.max(radius, layerNodes.totalWidth / (2 * Math.PI)); // / 0.9;
        
        let maxRanksep = -Infinity;
        if (focusLayer === 0 || layerNodes.nodes?.length) {
          maxRanksep = processNodes(layerNodes.nodes, radius, maxRanksep, [0, 1]); // 0.8
        } else {
          const leftRatio = layerNodes.left?.length / (layerNodes.left?.length + layerNodes.right?.length);
          maxRanksep= processNodes(layerNodes.left, radius, maxRanksep, [0, leftRatio]); // 接缝留出 0.05 的缝隙
          maxRanksep = processNodes(layerNodes.right, radius, maxRanksep, [leftRatio + 0.05, 1]); // 接缝留出 0.05 的缝隙
        }
        radius += maxRanksep;
        isFirstLevel = false;
        lastLayerMaxNodeSize - layerNodes.maxSize;
      });
      g.edges().forEach((edge: any) => {
        const coord = g.edge(edge);
        const i = edges.findIndex((it) => {
          const source = getEdgeTerminal(it, 'source');
          const target = getEdgeTerminal(it, 'target');
          return source === edge.v && target === edge.w;
        });
        if ((self.edgeLabelSpace) && self.controlPoints && edges[i].type !== "loop") {
          const otherDim = dim === 'x' ? 'y' : 'x';
          const controlPoints = coord?.points?.slice(1, coord.points.length - 1);
          const newControlPoints: Point[] = [];
          const sourceOtherDimValue = g.node(edge.v)?.[otherDim]!;
          const otherDimDist = sourceOtherDimValue - g.node(edge.w)?.[otherDim]!;
          const sourceRadius = radiusMap[edge.v];
          const radiusDist = sourceRadius - radiusMap[edge.w];
          controlPoints?.forEach((point: any) => {
            // 根据该边的起点、终点半径，及起点、终点、控制点位置关系，确定该控制点的半径
            const cRadius = (point[otherDim] - sourceOtherDimValue) / otherDimDist * radiusDist + sourceRadius;
            // 获取变形为 radial 后的直角坐标系坐标
            const newPos = getRadialPos(point[dim], range, rangeLength, cRadius);
            newControlPoints.push({
              x: newPos.x + dBegin[0],
              y: newPos.y + dBegin[1]
            });
          });
          edges[i].controlPoints = newControlPoints;
        }
      });
    } else {
      g.nodes().forEach((node: any) => {
        const coord = g.node(node)!;
        const i = nodes.findIndex((it) => it.id === node);
        if (!nodes[i]) return;
        nodes[i].x = coord.x! + dBegin[0];
        nodes[i].y = coord.y! + dBegin[1];
        // @ts-ignore: pass layer order to data for increment layout use
        nodes[i]._order = coord._order;
      });
      g.edges().forEach((edge: any) => {
        const coord = g.edge(edge);
        const i = edges.findIndex((it) => {
          const source = getEdgeTerminal(it, 'source');
          const target = getEdgeTerminal(it, 'target');
          return source === edge.v && target === edge.w;
        });
        if ((self.edgeLabelSpace) && self.controlPoints && edges[i].type !== "loop") {
          edges[i].controlPoints = coord?.points?.slice(1, coord.points.length - 1); // 去掉头尾
          edges[i].controlPoints.forEach((point: any) => {
            point.x += dBegin[0];
            point.y += dBegin[1];
          });
        }
      });
    }

    if (self.onLayoutEnd) self.onLayoutEnd();

    return {
      nodes,
      edges,
    };
  }

  private getRadialPos(dimValue: number, range: number[], rangeLength: number, radius: number, arcRange: number[] = [0, 1]) {
    // dimRatio 占圆弧的比例
    let dimRatio = (dimValue - range[0]) / rangeLength;
    // 再进一步归一化到指定的范围上
    dimRatio = dimRatio * (arcRange[1] - arcRange[0]) + arcRange[0];
    // 使用最终归一化后的范围计算角度
    const angle = dimRatio * 2 * Math.PI; // 弧度
    // 将极坐标系转换为直角坐标系
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  }

  public getType() {
    return "dagre";
  }
}