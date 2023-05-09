/**
 * @fileOverview dagre layout
 * @author shiwu.wyy@antfin.com
 */

import {
  Edge,
  OutNode,
  DagreLayoutOptions,
  PointTuple,
  Point,
  Node,
} from './types';
import dagre from './dagre/index';
import {
  isArray,
  isNumber,
  isObject,
  getEdgeTerminal,
  getFunc,
  isString,
} from '../util';
import { Base } from './base';
import { Graph as DagreGraph } from './dagre/graph';

/**
 * 层次布局
 */
export class DagreLayout extends Base {
  /** layout 方向, 可选 TB, BT, LR, RL */
  public rankdir: 'TB' | 'BT' | 'LR' | 'RL' = 'TB';

  /** 节点对齐方式，可选 UL, UR, DL, DR */
  public align: undefined | 'UL' | 'UR' | 'DL' | 'DR';

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
    nodes: OutNode[];
    edges: any[];
  };

  public nodes: OutNode[] = [];

  public edges: Edge[] = [];

  /** 迭代结束的回调函数 */
  public onLayoutEnd: () => void = () => {};

  private nodeMap: {
    [id: string]: OutNode;
  };

  constructor(options?: DagreLayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {
      rankdir: 'TB', // layout 方向, 可选 TB, BT, LR, RL
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
  };

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const {
      nodes,
      nodeSize,
      rankdir,
      combos,
      begin,
      radial,
      comboEdges = [],
      vedges = [],
    } = self;
    if (!nodes) return;
    const edges = (self.edges as any[]) || [];
    const g = new DagreGraph({
      multigraph: true,
      compound: true,
    });

    // collect the nodes in their combo, to create virtual edges for comboEdges
    self.nodeMap = {};
    const nodeComboMap = {} as any;
    nodes.forEach((node) => {
      self.nodeMap[node.id] = node;
      if (!node.comboId) return;
      nodeComboMap[node.comboId] = nodeComboMap[node.comboId] || [];
      nodeComboMap[node.comboId].push(node.id);
    });

    let sortedNodes: OutNode[] = [];
    const visitedMap: { [id: string]: boolean } = {};
    if (self.nodeOrder?.length) {
      self.nodeOrder.forEach((id) => {
        visitedMap[id] = true;
        sortedNodes.push(self.nodeMap[id]);
      });
      nodes.forEach((node) => {
        if (!visitedMap[node.id]) sortedNodes.push(node);
      });
    } else {
      sortedNodes = nodes;
    }

    let nodeSizeFunc: (d?: any) => number[];
    if (!nodeSize) {
      nodeSizeFunc = (d: any) => {
        if (d.size) {
          if (isArray(d.size)) {
            return d.size;
          }
          if (isObject(d.size)) {
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

    if (rankdir === 'LR' || rankdir === 'RL') {
      horisep = ranksepfunc;
      vertisep = nodesepfunc;
    }
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(self);

    const comboMap: { [key: string]: any } = {};

    if (this.sortByCombo && combos) {
      combos.forEach((combo) => {
        comboMap[combo.id] = combo;
        // regard the collapsed combo as a node
        if (combo.collapsed) {
          const size = nodeSizeFunc(combo);
          const verti = vertisep(combo);
          const hori = horisep(combo);
          const width = size[0] + 2 * hori;
          const height = size[1] + 2 * verti;
          g.setNode(combo.id, { width, height });
        }
        if (!combo.parentId) return;
        if (!comboMap[combo.parentId]) {
          g.setNode(combo.parentId, {});
        }
        g.setParent(combo.id, combo.parentId);
      });
    }

    sortedNodes
      .filter((node) => node.layout !== false)
      .forEach((node) => {
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
            comboMap[node.comboId] = { id: node.comboId };
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

    // create virtual edges from node to node for comboEdges
    comboEdges?.concat(vedges || [])?.forEach((comboEdge: any) => {
      const { source, target } = comboEdge;
      const sources = comboMap[source]?.collapsed
        ? [source]
        : nodeComboMap[source] || [source];
      const targets = comboMap[target]?.collapsed
        ? [target]
        : nodeComboMap[target] || [target];
      sources.forEach((s: string) => {
        targets.forEach((t: string) => {
          g.setEdge(s, t, {
            weight: comboEdge.weight || 1,
          });
        });
      });
    });

    // 考虑增量图中的原始图
    let prevGraph: DagreGraph | undefined = undefined;
    if (self.preset?.nodes) {
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

    const isHorizontal = rankdir === 'LR' || rankdir === 'RL';
    // 变形为辐射
    if (radial) {
      const { focusNode, ranksep, getRadialPos } = this;
      const focusId = isString(focusNode) ? focusNode : focusNode?.id;
      const focusLayer = focusId ? g.node(focusId)?._rank : 0;
      const layers: any[] = [];
      const dim = isHorizontal ? 'y' : 'x';
      const sizeDim = isHorizontal ? 'height' : 'width';
      // 找到整个图作为环的坐标维度（dim）的最大、最小值，考虑节点宽度
      let min = Infinity;
      let max = -Infinity;
      g.nodes().forEach((node: any) => {
        const coord = g.node(node)! as any;
        if (!self.nodeMap[node]) return;
        const currentNodesep = nodesepfunc(self.nodeMap[node]);

        if (focusLayer === 0) {
          if (!layers[coord._rank]) {
            layers[coord._rank] = {
              nodes: [],
              totalWidth: 0,
              maxSize: -Infinity,
            };
          }
          layers[coord._rank].nodes.push(node);
          layers[coord._rank].totalWidth += currentNodesep * 2 + coord[sizeDim];
          if (
            layers[coord._rank].maxSize < Math.max(coord.width, coord.height)
          ) {
            layers[coord._rank].maxSize = Math.max(coord.width, coord.height);
          }
        } else {
          const diffLayer = coord._rank - focusLayer!;
          if (diffLayer === 0) {
            if (!layers[diffLayer]) {
              layers[diffLayer] = {
                nodes: [],
                totalWidth: 0,
                maxSize: -Infinity,
              };
            }
            layers[diffLayer].nodes.push(node);
            layers[diffLayer].totalWidth += currentNodesep * 2 + coord[sizeDim];
            if (
              layers[diffLayer].maxSize < Math.max(coord.width, coord.height)
            ) {
              layers[diffLayer].maxSize = Math.max(coord.width, coord.height);
            }
          } else {
            const diffLayerAbs = Math.abs(diffLayer);
            if (!layers[diffLayerAbs]) {
              layers[diffLayerAbs] = {
                left: [],
                right: [],
                totalWidth: 0,
                maxSize: -Infinity,
              };
            }
            layers[diffLayerAbs].totalWidth +=
              currentNodesep * 2 + coord[sizeDim];
            if (
              layers[diffLayerAbs].maxSize < Math.max(coord.width, coord.height)
            ) {
              layers[diffLayerAbs].maxSize = Math.max(
                coord.width,
                coord.height
              );
            }
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
      const range = [
        (min + max - rangeLength) * 0.5,
        (min + max + rangeLength) * 0.5,
      ];

      // 根据半径、分布比例，计算节点在环上的位置，并返回该组节点中最大的 ranksep 值
      const processNodes = (
        layerNodes: any,
        radius: number,
        propsMaxRanksep = -Infinity,
        arcRange = [0, 1]
      ) => {
        let maxRanksep = propsMaxRanksep;
        layerNodes.forEach((node: any) => {
          const coord = g.node(node);
          radiusMap[node] = radius;
          // 获取变形为 radial 后的直角坐标系坐标
          const { x: newX, y: newY } = getRadialPos(
            coord![dim]!,
            range,
            rangeLength,
            radius,
            arcRange
          );
          // 将新坐标写入源数据
          if (!self.nodeMap[node]) return;
          self.nodeMap[node].x = newX + dBegin[0];
          self.nodeMap[node].y = newY + dBegin[1];
          // @ts-ignore: pass layer order to data for increment layout use
          self.nodeMap[node]._order = coord._order;

          // 找到本层最大的一个 ranksep，作为下一层与本层的间隙，叠加到下一层的半径上
          const currentNodeRanksep = ranksepfunc(self.nodeMap[node]);
          if (maxRanksep < currentNodeRanksep) maxRanksep = currentNodeRanksep;
        });
        return maxRanksep;
      };

      let isFirstLevel = true;
      const lastLayerMaxNodeSize = 0;
      layers.forEach((layerNodes) => {
        if (
          !layerNodes?.nodes?.length &&
          !layerNodes?.left?.length &&
          !layerNodes?.right?.length
        ) {
          return;
        }
        // 第一层只有一个节点，直接放在圆心，初始半径设定为 0
        if (isFirstLevel && layerNodes.nodes.length === 1) {
          // 将新坐标写入源数据
          const nodeId = layerNodes.nodes[0];
          if (!self.nodeMap[nodeId]) return;
          self.nodeMap[nodeId].x = dBegin[0];
          self.nodeMap[nodeId].y = dBegin[1];
          radiusMap[layerNodes.nodes[0]] = 0;
          radius = ranksepfunc(self.nodeMap[nodeId]);
          isFirstLevel = false;
          return;
        }

        // 为接缝留出空隙，半径也需要扩大
        radius = Math.max(radius, layerNodes.totalWidth / (2 * Math.PI)); // / 0.9;

        let maxRanksep = -Infinity;
        if (focusLayer === 0 || layerNodes.nodes?.length) {
          maxRanksep = processNodes(
            layerNodes.nodes,
            radius,
            maxRanksep,
            [0, 1]
          ); // 0.8
        } else {
          const leftRatio =
            layerNodes.left?.length /
            (layerNodes.left?.length + layerNodes.right?.length);
          maxRanksep = processNodes(layerNodes.left, radius, maxRanksep, [
            0,
            leftRatio,
          ]); // 接缝留出 0.05 的缝隙
          maxRanksep = processNodes(layerNodes.right, radius, maxRanksep, [
            leftRatio + 0.05,
            1,
          ]); // 接缝留出 0.05 的缝隙
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
        if (i <= -1) return;
        if (
          self.edgeLabelSpace &&
          self.controlPoints &&
          edges[i].type !== 'loop'
        ) {
          const otherDim = dim === 'x' ? 'y' : 'x';
          const controlPoints = coord?.points?.slice(
            1,
            coord.points.length - 1
          );
          const newControlPoints: Point[] = [];
          const sourceOtherDimValue = g.node(edge.v)?.[otherDim]!;
          const otherDimDist =
            sourceOtherDimValue - g.node(edge.w)?.[otherDim]!;
          const sourceRadius = radiusMap[edge.v];
          const radiusDist = sourceRadius - radiusMap[edge.w];
          controlPoints?.forEach((point: any) => {
            // 根据该边的起点、终点半径，及起点、终点、控制点位置关系，确定该控制点的半径
            const cRadius =
              ((point[otherDim] - sourceOtherDimValue) / otherDimDist) *
                radiusDist +
              sourceRadius;
            // 获取变形为 radial 后的直角坐标系坐标
            const newPos = getRadialPos(
              point[dim],
              range,
              rangeLength,
              cRadius
            );
            newControlPoints.push({
              x: newPos.x + dBegin[0],
              y: newPos.y + dBegin[1],
            });
          });
          edges[i].controlPoints = newControlPoints;
        }
      });
    } else {
      const layerCoords: Set<number> = new Set();
      const isInvert = rankdir === 'BT' || rankdir === 'RL';
      const layerCoordSort = isInvert
        ? (a: number, b: number) => b - a
        : (a: number, b: number) => a - b;
      g.nodes().forEach((node: any) => {
        const coord = g.node(node)!;
        if (!coord) return;
        let ndata: any = this.nodeMap[node];
        if (!ndata) {
          ndata = combos?.find((it) => it.id === node);
        }
        if (!ndata) return;
        ndata.x = coord.x! + dBegin[0];
        ndata.y = coord.y! + dBegin[1];
        // @ts-ignore: pass layer order to data for increment layout use
        ndata._order = coord._order;
        layerCoords.add(isHorizontal ? ndata.x : ndata.y);
      });
      const layerCoordsArr = Array.from(layerCoords).sort(layerCoordSort);

      // pre-define the isHorizontal related functions to avoid redundant calc in interations
      const isDifferentLayer = isHorizontal
        ? (point1: Point, point2: Point) => point1.x !== point2.x
        : (point1: Point, point2: Point) => point1.y !== point2.y;
      const filterControlPointsOutOfBoundary = isHorizontal
        ? (ps: Point[], point1: Point, point2: Point) => {
            const max = Math.max(point1.y, point2.y);
            const min = Math.min(point1.y, point2.y);
            return ps.filter((point) => point.y <= max && point.y >= min);
          }
        : (ps: Point[], point1: Point, point2: Point) => {
            const max = Math.max(point1.x, point2.x);
            const min = Math.min(point1.x, point2.x);
            return ps.filter((point) => point.x <= max && point.x >= min);
          };

      g.edges().forEach((edge: any) => {
        const coord = g.edge(edge);
        const i = edges.findIndex((it) => {
          const source = getEdgeTerminal(it, 'source');
          const target = getEdgeTerminal(it, 'target');
          return source === edge.v && target === edge.w;
        });
        if (i <= -1) return;
        if (
          self.edgeLabelSpace &&
          self.controlPoints &&
          edges[i].type !== 'loop'
        ) {
          coord?.points?.forEach((point: any) => {
            point.x += dBegin[0];
            point.y += dBegin[1];
          });

          const sourceNode = self.nodeMap[edge.v];
          const targetNode = self.nodeMap[edge.w];
          edges[i].controlPoints = getControlPoints(
            coord?.points,
            sourceNode,
            targetNode,
            layerCoordsArr,
            isHorizontal,
            isDifferentLayer,
            filterControlPointsOutOfBoundary
          );
        }
      });
    }

    if (self.onLayoutEnd) self.onLayoutEnd();
    return {
      nodes,
      edges,
    };
  }

  private getRadialPos(
    dimValue: number,
    range: number[],
    rangeLength: number,
    radius: number,
    arcRange: number[] = [0, 1]
  ) {
    // dimRatio 占圆弧的比例
    let dimRatio = (dimValue - range[0]) / rangeLength;
    // 再进一步归一化到指定的范围上
    dimRatio = dimRatio * (arcRange[1] - arcRange[0]) + arcRange[0];
    // 使用最终归一化后的范围计算角度
    const angle = dimRatio * 2 * Math.PI; // 弧度
    // 将极坐标系转换为直角坐标系
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  }

  public getType() {
    return 'dagre';
  }
}

/**
 * Format controlPoints to avoid polylines crossing nodes
 * @param points
 * @param sourceNode
 * @param targetNode
 * @param layerCoordsArr
 * @param isHorizontal
 * @returns
 */
const getControlPoints = (
  points: Point[] | undefined,
  sourceNode: OutNode,
  targetNode: OutNode,
  layerCoordsArr: number[],
  isHorizontal: boolean,
  isDifferentLayer: (point1: Point, point2: Point) => boolean,
  filterControlPointsOutOfBoundary: (
    ps: Point[],
    point1: Point,
    point2: Point
  ) => Point[]
) => {
  let controlPoints = points?.slice(1, points.length - 1) || []; // 去掉头尾
  // 酌情增加控制点，使折线不穿过跨层的节点
  if (sourceNode && targetNode) {
    let { x: sourceX, y: sourceY } = sourceNode;
    let { x: targetX, y: targetY } = targetNode;
    if (isHorizontal) {
      sourceX = sourceNode.y;
      sourceY = sourceNode.x;
      targetX = targetNode.y;
      targetY = targetNode.x;
    }
    // 为跨层级的边增加第一个控制点。忽略垂直的/横向的边。
    // 新控制点 = {
    //   x: 终点x,
    //   y: (起点y + 下一层y) / 2,   #下一层y可能不等于终点y
    // }
    if (targetY !== sourceY && sourceX !== targetX) {
      const sourceLayer = layerCoordsArr.indexOf(sourceY);
      const sourceNextLayerCoord = layerCoordsArr[sourceLayer + 1];
      if (sourceNextLayerCoord) {
        const firstControlPoint = controlPoints[0];
        const insertStartControlPoint = isHorizontal
          ? {
              x: (sourceY + sourceNextLayerCoord) / 2,
              y: firstControlPoint?.y || targetX,
            }
          : {
              x: firstControlPoint?.x || targetX,
              y: (sourceY + sourceNextLayerCoord) / 2,
            };
        // 当新增的控制点不存在（!=当前第一个控制点）时添加
        if (
          !firstControlPoint ||
          isDifferentLayer(firstControlPoint, insertStartControlPoint)
        ) {
          controlPoints.unshift(insertStartControlPoint);
        }
      }

      const targetLayer = layerCoordsArr.indexOf(targetY);
      const layerDiff = Math.abs(targetLayer - sourceLayer);
      if (layerDiff === 1) {
        controlPoints = filterControlPointsOutOfBoundary(
          controlPoints,
          sourceNode,
          targetNode
        );
        // one controlPoint at least
        if (!controlPoints.length) {
          controlPoints.push(
            isHorizontal
              ? {
                  x: (sourceY + targetY) / 2,
                  y: sourceX,
                }
              : {
                  x: sourceX,
                  y: (sourceY + targetY) / 2,
                }
          );
        }
      } else if (layerDiff > 1) {
        const targetLastLayerCoord = layerCoordsArr[targetLayer - 1];
        if (targetLastLayerCoord) {
          const lastControlPoints = controlPoints[controlPoints.length - 1];
          const insertEndControlPoint = isHorizontal
            ? {
                x: (targetY + targetLastLayerCoord) / 2,
                y: lastControlPoints?.y || targetX,
              }
            : {
                x: lastControlPoints?.x || sourceX,
                y: (targetY + targetLastLayerCoord) / 2,
              };
          // 当新增的控制点不存在（!=当前最后一个控制点）时添加
          if (
            !lastControlPoints ||
            isDifferentLayer(lastControlPoints, insertEndControlPoint)
          ) {
            controlPoints.push(insertEndControlPoint);
          }
        }
      }
    }
  }
  return controlPoints;
};
