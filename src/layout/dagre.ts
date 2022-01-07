/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

import { Edge, OutNode, DagreLayoutOptions, PointTuple } from "./types";
import dagre from "./dagre/index";
import { graphlib as IGraphLib } from './dagre/graphlib';
import { isArray, isNumber, isObject, getEdgeTerminal, getFunc } from "../util";
import { Base } from "./base";

type DagreGraph = IGraphLib.Graph;

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
    const { nodes, nodeSize, rankdir, combos, begin } = self;
    if (!nodes) return;
    const edges = (self.edges as any[]) || [];
    const g = new dagre.graphlib.Graph({
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
    let horisep: Function = getFunc(self.nodesep, 50, self.nodesepFunc);
    let vertisep: Function = getFunc(self.ranksep, 50, self.ranksepFunc);

    if (rankdir === "LR" || rankdir === "RL") {
      horisep = getFunc(self.ranksep, 50, self.ranksepFunc);
      vertisep = getFunc(self.nodesep, 50, self.nodesepFunc);
    }
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(self);

    const comboMap: { [key: string]: boolean } = {};
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
      prevGraph = new dagre.graphlib.Graph({
        multigraph: true,
        compound: true,
      }) as any;
      self.preset.nodes.forEach((node) => {
        prevGraph?.setNode(node.id, node);
      });
    }

    dagre.layout(g as any, {
      prevGraph,
      edgeLabelSpace: self.edgeLabelSpace,
      keepNodeOrder: Boolean(!!self.nodeOrder),
      nodeOrder: self.nodeOrder,
    });

    const dBegin = [0, 0];
    if (begin) {
      let minX = Infinity;
      let minY = Infinity;
      g.nodes().forEach((node: any) => {
        const coord = g.node(node);
        if (minX > coord.x) minX = coord.x;
        if (minY > coord.y) minY = coord.y;
      });
      g.edges().forEach((edge: any) => {
        const coord = g.edge(edge);
        coord.points.forEach((point: any) => {
          if (minX > point.x) minX = point.x;
          if (minY > point.y) minY = point.y;
        });
      });
      dBegin[0] = begin[0] - minX;
      dBegin[1] = begin[1] - minY;
    }

    g.nodes().forEach((node: any) => {
      const coord = g.node(node);
      const i = nodes.findIndex((it) => it.id === node);
      if (!nodes[i]) return;
      nodes[i].x = coord.x + dBegin[0];
      nodes[i].y = coord.y + dBegin[1];
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
        edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1);
        edges[i].controlPoints.forEach((point: any) => {
          point.x += dBegin[0];
          point.y += dBegin[1];
        });
      }
    });

    if (self.onLayoutEnd) self.onLayoutEnd();

    return {
      nodes,
      edges,
    };
  }

  public getType() {
    return "dagre";
  }
}