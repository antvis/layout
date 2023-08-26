import { Graph, ID } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import { layout } from './dagre/layout';
import type {
  Graph as IGraph,
  Layout,
  LayoutMapping,
  OutNode,
  Node,
  Edge,
  DagreLayoutOptions,
  NodeData,
  EdgeData,
  Point,
} from './types';
import { cloneFormatData, formatNumberFn, formatNodeSize } from './util';

const DEFAULTS_LAYOUT_OPTIONS: Partial<DagreLayoutOptions> = {
  rankdir: 'TB',
  nodesep: 50, // 节点水平间距(px)
  ranksep: 50, // 每一层节点之间间距
  edgeLabelSpace: true,
  controlPoints: false, // 是否保留布局连线的控制点
  radial: false, // 是否基于 dagre 进行辐射布局
  focusNode: null, // radial 为 true 时生效，关注的节点
};

/**
 * Layout arranging the nodes in a circle.
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph, { radius: 20 }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { radius: 20 });
 */
export class DagreLayout implements Layout<DagreLayoutOptions> {
  id = 'dagre';

  constructor(public options: DagreLayoutOptions = {} as DagreLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: IGraph, options?: DagreLayoutOptions) {
    return this.genericDagreLayout(false, graph, options);
  }

  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: IGraph, options?: DagreLayoutOptions) {
    await this.genericDagreLayout(true, graph, options);
  }

  private async genericDagreLayout(
    assign: false,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericDagreLayout(
    assign: true,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<void>;
  private async genericDagreLayout(
    assign: boolean,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const {
      nodeSize,
      align,
      rankdir = 'TB',
      ranksep,
      nodesep,
      ranksepFunc,
      nodesepFunc,
      edgeLabelSpace,
      nodeOrder,
      begin,
      controlPoints,
      radial,
      sortByCombo,
      // focusNode,
      // prevGraph,
    } = mergedOptions;

    const g = new Graph<NodeData, EdgeData>({
      tree: [],
    });

    const ranksepfunc = formatNumberFn(ranksep || 50, ranksepFunc);
    const nodesepfunc = formatNumberFn(nodesep || 50, nodesepFunc);
    let horisep: (d?: Node | undefined) => number = nodesepfunc;
    let vertisep: (d?: Node | undefined) => number = ranksepfunc;
    if (rankdir === 'LR' || rankdir === 'RL') {
      horisep = ranksepfunc;
      vertisep = nodesepfunc;
    }
    const nodeSizeFunc = formatNodeSize(nodeSize, undefined);

    // copy graph to g
    const nodes: Node[] = graph.getAllNodes();
    const edges: Edge[] = graph.getAllEdges();

    nodes.forEach((node) => {
      const size = nodeSizeFunc(node);
      const verti = vertisep(node);
      const hori = horisep(node);
      // FIXME: support 2 dimensions?
      // const width = size[0] + 2 * hori;
      // const height = size[1] + 2 * verti;
      const width = size + 2 * hori;
      const height = size + 2 * verti;
      const layer = node.data.layer;
      if (isNumber(layer)) {
        // 如果有layer属性，加入到node的label中
        g.addNode({
          id: node.id,
          data: { width, height, layer },
        });
      } else {
        g.addNode({
          id: node.id,
          data: { width, height },
        });
      }
    });
    if (sortByCombo) {
      g.attachTreeStructure('combo');
      nodes.forEach((node) => {
        const { parentId } = node.data;
        if (parentId === undefined) return;
        console.log('setparent', g.hasNode(parentId as ID));
        if (g.hasNode(parentId as ID)) {
          g.setParent(node.id, parentId as ID, 'combo');
        }
      });
    }

    edges.forEach((edge) => {
      // dagrejs Wiki https://github.com/dagrejs/dagre/wiki#configuring-the-layout
      g.addEdge({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: {
          weight: edge.data.weight || 1,
        },
      });
    });

    // TODO: combo & prevGraph
    layout(g, {
      prevGraph: null,
      edgeLabelSpace,
      keepNodeOrder: !!nodeOrder,
      nodeOrder: nodeOrder || [],
      acyclicer: 'greedy',
      ranker: 'network-simplex',
      rankdir,
      nodesep,
      align,
    });

    const layoutTopLeft = [0, 0];
    if (begin) {
      let minX = Infinity;
      let minY = Infinity;
      g.getAllNodes().forEach((node) => {
        if (minX > node.data.x!) minX = node.data.x!;
        if (minY > node.data.y!) minY = node.data.y!;
      });
      g.getAllEdges().forEach((edge) => {
        edge.data.points?.forEach((point) => {
          if (minX > point.x) minX = point.x;
          if (minY > point.y) minY = point.y;
        });
      });
      layoutTopLeft[0] = begin[0] - minX;
      layoutTopLeft[1] = begin[1] - minY;
    }

    const isHorizontal = rankdir === 'LR' || rankdir === 'RL';
    if (radial) {
      // const focusId = (isString(focusNode) ? focusNode : focusNode?.id) as ID;
      // const focusLayer = focusId ? g.getNode(focusId)?.data._rank as number : 0;
      // const layers: any[] = [];
      // const dim = isHorizontal ? "y" : "x";
      // const sizeDim = isHorizontal ? "height" : "width";
      // // 找到整个图作为环的坐标维度（dim）的最大、最小值，考虑节点宽度
      // let min = Infinity;
      // let max = -Infinity;
      // g.getAllNodes().forEach((node) => {
      //   const currentNodesep = nodesepfunc(node);
      //   if (focusLayer === 0) {
      //     if (!layers[node.data._rank!]) {
      //       layers[node.data._rank!] = {
      //         nodes: [],
      //         totalWidth: 0,
      //         maxSize: -Infinity,
      //       };
      //     }
      //     layers[node.data._rank!].nodes.push(node);
      //     layers[node.data._rank!].totalWidth += currentNodesep * 2 + node.data[sizeDim]!;
      //     if (
      //       layers[node.data._rank!].maxSize < Math.max(node.data.width!, node.data.height!)
      //     ) {
      //       layers[node.data._rank!].maxSize = Math.max(node.data.width!, node.data.height!);
      //     }
      //   } else {
      //     const diffLayer = node.data._rank! - focusLayer!;
      //     if (diffLayer === 0) {
      //       if (!layers[diffLayer]) {
      //         layers[diffLayer] = {
      //           nodes: [],
      //           totalWidth: 0,
      //           maxSize: -Infinity,
      //         };
      //       }
      //       layers[diffLayer].nodes.push(node);
      //       layers[diffLayer].totalWidth += currentNodesep * 2 + node.data[sizeDim]!;
      //       if (
      //         layers[diffLayer].maxSize < Math.max(node.data.width!, node.data.height!)
      //       ) {
      //         layers[diffLayer].maxSize = Math.max(node.data.width!, node.data.height!);
      //       }
      //     } else {
      //       const diffLayerAbs = Math.abs(diffLayer);
      //       if (!layers[diffLayerAbs]) {
      //         layers[diffLayerAbs] = {
      //           left: [],
      //           right: [],
      //           totalWidth: 0,
      //           maxSize: -Infinity,
      //         };
      //       }
      //       layers[diffLayerAbs].totalWidth +=
      //         currentNodesep * 2 + node.data[sizeDim]!;
      //       if (
      //         layers[diffLayerAbs].maxSize < Math.max(node.data.width!, node.data.height!)
      //       ) {
      //         layers[diffLayerAbs].maxSize = Math.max(
      //           node.data.width!,
      //           node.data.height!
      //         );
      //       }
      //       if (diffLayer < 0) {
      //         layers[diffLayerAbs].left.push(node);
      //       } else {
      //         layers[diffLayerAbs].right.push(node);
      //       }
      //     }
      //   }
      //   const leftPos = node.data[dim]! - node.data[sizeDim]! / 2 - currentNodesep;
      //   const rightPos = node.data[dim]! + node.data[sizeDim]! / 2 + currentNodesep;
      //   if (leftPos < min) min = leftPos;
      //   if (rightPos > max) max = rightPos;
      // });
      // // const padding = (max - min) * 0.1; // TODO
      // // 初始化为第一圈的半径，后面根据每层 ranksep 叠加
      // let radius = ranksep || 50; // TODO;
      // const radiusMap: any = {};
      // // 扩大最大最小值范围，以便为环上留出接缝处的空隙
      // const rangeLength = (max - min) / 0.9;
      // const range = [
      //   (min + max - rangeLength) * 0.5,
      //   (min + max + rangeLength) * 0.5,
      // ];
      // // 根据半径、分布比例，计算节点在环上的位置，并返回该组节点中最大的 ranksep 值
      // const processNodes = (
      //   layerNodes: any,
      //   radius: number,
      //   propsMaxRanksep = -Infinity,
      //   arcRange = [0, 1]
      // ) => {
      //   let maxRanksep = propsMaxRanksep;
      //   layerNodes.forEach((node: any) => {
      //     const coord = g.node(node);
      //     radiusMap[node] = radius;
      //     // 获取变形为 radial 后的直角坐标系坐标
      //     const { x: newX, y: newY } = getRadialPos(
      //       coord![dim]!,
      //       range,
      //       rangeLength,
      //       radius,
      //       arcRange
      //     );
      //     // 将新坐标写入源数据
      //     const i = nodes.findIndex((it) => it.id === node);
      //     if (!nodes[i]) return;
      //     nodes[i].x = newX + dBegin[0];
      //     nodes[i].y = newY + dBegin[1];
      //     // @ts-ignore: pass layer order to data for increment layout use
      //     nodes[i]._order = coord._order;
      //     // 找到本层最大的一个 ranksep，作为下一层与本层的间隙，叠加到下一层的半径上
      //     const currentNodeRanksep = ranksepfunc(nodes[i]);
      //     if (maxRanksep < currentNodeRanksep) maxRanksep = currentNodeRanksep;
      //   });
      //   return maxRanksep;
      // };
      // let isFirstLevel = true;
      // const lastLayerMaxNodeSize = 0;
      // layers.forEach((layerNodes) => {
      //   if (
      //     !layerNodes?.nodes?.length &&
      //     !layerNodes?.left?.length &&
      //     !layerNodes?.right?.length
      //   ) {
      //     return;
      //   }
      //   // 第一层只有一个节点，直接放在圆心，初始半径设定为 0
      //   if (isFirstLevel && layerNodes.nodes.length === 1) {
      //     // 将新坐标写入源数据
      //     const i = nodes.findIndex((it) => it.id === layerNodes.nodes[0]);
      //     if (i <= -1) return;
      //     nodes[i].x = dBegin[0];
      //     nodes[i].y = dBegin[1];
      //     radiusMap[layerNodes.nodes[0]] = 0;
      //     radius = ranksepfunc(nodes[i]);
      //     isFirstLevel = false;
      //     return;
      //   }
      //   // 为接缝留出空隙，半径也需要扩大
      //   radius = Math.max(radius, layerNodes.totalWidth / (2 * Math.PI)); // / 0.9;
      //   let maxRanksep = -Infinity;
      //   if (focusLayer === 0 || layerNodes.nodes?.length) {
      //     maxRanksep = processNodes(
      //       layerNodes.nodes,
      //       radius,
      //       maxRanksep,
      //       [0, 1]
      //     ); // 0.8
      //   } else {
      //     const leftRatio =
      //       layerNodes.left?.length /
      //       (layerNodes.left?.length + layerNodes.right?.length);
      //     maxRanksep = processNodes(layerNodes.left, radius, maxRanksep, [
      //       0,
      //       leftRatio,
      //     ]); // 接缝留出 0.05 的缝隙
      //     maxRanksep = processNodes(layerNodes.right, radius, maxRanksep, [
      //       leftRatio + 0.05,
      //       1,
      //     ]); // 接缝留出 0.05 的缝隙
      //   }
      //   radius += maxRanksep;
      //   isFirstLevel = false;
      //   lastLayerMaxNodeSize - layerNodes.maxSize;
      // });
      // g.edges().forEach((edge: any) => {
      //   const coord = g.edge(edge);
      //   const i = edges.findIndex((it) => {
      //     const source = getEdgeTerminal(it, "source");
      //     const target = getEdgeTerminal(it, "target");
      //     return source === edge.v && target === edge.w;
      //   });
      //   if (i <= -1) return;
      //   if (
      //     self.edgeLabelSpace &&
      //     self.controlPoints &&
      //     edges[i].type !== "loop"
      //   ) {
      //     const otherDim = dim === "x" ? "y" : "x";
      //     const controlPoints = coord?.points?.slice(
      //       1,
      //       coord.points.length - 1
      //     );
      //     const newControlPoints: Point[] = [];
      //     const sourceOtherDimValue = g.node(edge.v)?.[otherDim]!;
      //     const otherDimDist =
      //       sourceOtherDimValue - g.node(edge.w)?.[otherDim]!;
      //     const sourceRadius = radiusMap[edge.v];
      //     const radiusDist = sourceRadius - radiusMap[edge.w];
      //     controlPoints?.forEach((point: any) => {
      //       // 根据该边的起点、终点半径，及起点、终点、控制点位置关系，确定该控制点的半径
      //       const cRadius =
      //         ((point[otherDim] - sourceOtherDimValue) / otherDimDist) *
      //           radiusDist +
      //         sourceRadius;
      //       // 获取变形为 radial 后的直角坐标系坐标
      //       const newPos = getRadialPos(
      //         point[dim],
      //         range,
      //         rangeLength,
      //         cRadius
      //       );
      //       newControlPoints.push({
      //         x: newPos.x + dBegin[0],
      //         y: newPos.y + dBegin[1],
      //       });
      //     });
      //     edges[i].controlPoints = newControlPoints;
      //   }
      // });
    } else {
      const layerCoords: Set<number> = new Set();
      const isInvert = rankdir === 'BT' || rankdir === 'RL';
      const layerCoordSort = isInvert
        ? (a: number, b: number) => b - a
        : (a: number, b: number) => a - b;
      g.getAllNodes().forEach((node) => {
        // let ndata: any = this.nodeMap[node];
        // if (!ndata) {
        //   ndata = combos?.find((it) => it.id === node);
        // }
        // if (!ndata) return;
        // ndata.x = node.data.x! + dBegin[0];
        // ndata.y = node.data.y! + dBegin[1];
        // //  pass layer order to data for increment layout use
        // ndata._order = node.data._order;
        // layerCoords.add(isHorizontal ? ndata.x : ndata.y);

        node.data.x = node.data.x! + layoutTopLeft[0];
        node.data.y = node.data.y! + layoutTopLeft[1];
        layerCoords.add(isHorizontal ? node.data.x : node.data.y);
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

      g.getAllEdges().forEach((edge, i) => {
        // const i = edges.findIndex((it) => {
        //   return it.source === edge.source && it.target === edge.target;
        // });
        // if (i <= -1) return;
        if (edgeLabelSpace && controlPoints && edge.data.type !== 'loop') {
          edge.data.controlPoints = getControlPoints(
            edge.data.points?.map(({ x, y }) => ({
              x: x + layoutTopLeft[0],
              y: y + layoutTopLeft[1],
            })),
            g.getNode(edge.source),
            g.getNode(edge.target),
            layerCoordsArr,
            isHorizontal,
            isDifferentLayer,
            filterControlPointsOutOfBoundary
          );
        }
      });
    }

    // calculated nodes as temporary result
    let layoutNodes: OutNode[] = [];
    // layout according to the original order in the data.nodes
    layoutNodes = g
      .getAllNodes()
      .map((node) => cloneFormatData(node) as OutNode);
    const layoutEdges = g.getAllEdges();

    if (assign) {
      layoutNodes.forEach((node) => {
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        });
      });
      layoutEdges.forEach((edge) => {
        graph.mergeEdgeData(edge.id, {
          controlPoints: edge.data.controlPoints,
        });
      });
    }

    const result = {
      nodes: layoutNodes,
      edges: layoutEdges,
    };

    return result;
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
  sourceNode: Node,
  targetNode: Node,
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
    let { x: sourceX, y: sourceY } = sourceNode.data;
    let { x: targetX, y: targetY } = targetNode.data;
    if (isHorizontal) {
      sourceX = sourceNode.data.y;
      sourceY = sourceNode.data.x;
      targetX = targetNode.data.y;
      targetY = targetNode.data.x;
    }
    // 为跨层级的边增加第一个控制点。忽略垂直的/横向的边。
    // 新控制点 = {
    //   x: 终点x,
    //   y: (起点y + 下一层y) / 2,   #下一层y可能不等于终点y
    // }
    if (targetY !== sourceY && sourceX !== targetX) {
      const sourceLayer = layerCoordsArr.indexOf(sourceY!);
      const sourceNextLayerCoord = layerCoordsArr[sourceLayer + 1];
      if (sourceNextLayerCoord) {
        const firstControlPoint = controlPoints[0];
        const insertStartControlPoint = (
          isHorizontal
            ? {
                x: (sourceY! + sourceNextLayerCoord) / 2,
                y: firstControlPoint?.y || targetX,
              }
            : {
                x: firstControlPoint?.x || targetX,
                y: (sourceY! + sourceNextLayerCoord) / 2,
              }
        ) as Point;
        // 当新增的控制点不存在（!=当前第一个控制点）时添加
        if (
          !firstControlPoint ||
          isDifferentLayer(firstControlPoint, insertStartControlPoint)
        ) {
          controlPoints.unshift(insertStartControlPoint);
        }
      }

      const targetLayer = layerCoordsArr.indexOf(targetY!);
      const layerDiff = Math.abs(targetLayer - sourceLayer);
      if (layerDiff === 1) {
        controlPoints = filterControlPointsOutOfBoundary(
          controlPoints,
          sourceNode.data as Point,
          targetNode.data as Point
        );
        // one controlPoint at least
        if (!controlPoints.length) {
          controlPoints.push(
            (isHorizontal
              ? {
                  x: (sourceY! + targetY!) / 2,
                  y: sourceX,
                }
              : {
                  x: sourceX,
                  y: (sourceY! + targetY!) / 2,
                }) as Point
          );
        }
      } else if (layerDiff > 1) {
        const targetLastLayerCoord = layerCoordsArr[targetLayer - 1];
        if (targetLastLayerCoord) {
          const lastControlPoints = controlPoints[controlPoints.length - 1];
          const insertEndControlPoint = (
            isHorizontal
              ? {
                  x: (targetY! + targetLastLayerCoord) / 2,
                  y: lastControlPoints?.y || targetX,
                }
              : {
                  x: lastControlPoints?.x || sourceX,
                  y: (targetY! + targetLastLayerCoord) / 2,
                }
          ) as Point;
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
