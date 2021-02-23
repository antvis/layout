/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

import { Edge, OutNode, DagreLayoutOptions } from "./types";
import dagre from "dagre";
import { isArray, isNumber } from "../util";
import { Base } from "./base";

/**
 * 层次布局
 */
export class DagreLayout extends Base {
  /** layout 方向, 可选 TB, BT, LR, RL */
  public rankdir: "TB" | "BT" | "LR" | "RL" = "TB";

  /** 节点对齐方式，可选 UL, UR, DL, DR */
  public align: undefined | "UL" | "UR" | "DL" | "DR";

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

  /** 每层节点是否根据节点数据中的 comboId 进行排序，以放置同层 combo 重叠 */
  public sortByCombo: boolean = false;

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

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const { nodes, nodeSize, rankdir } = self;
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
    let horisep: Function = getFunc(self.nodesepFunc, self.nodesep, 50);
    let vertisep: Function = getFunc(self.ranksepFunc, self.ranksep, 50);

    if (rankdir === "LR" || rankdir === "RL") {
      horisep = getFunc(self.ranksepFunc, self.ranksep, 50);
      vertisep = getFunc(self.nodesepFunc, self.nodesep, 50);
    }
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph(self);

    const comboMap: { [key: string]: boolean } = {};
    nodes.forEach((node) => {
      const size = nodeSizeFunc(node);
      const verti = vertisep(node);
      const hori = horisep(node);
      const width = size[0] + 2 * hori;
      const height = size[1] + 2 * verti;
      g.setNode(node.id, { width, height });

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
      g.setEdge(edge.source, edge.target, {
        weight: edge.weight || 1,
      });
    });
    dagre.layout(g);
    let coord;
    g.nodes().forEach((node: any) => {
      coord = g.node(node);
      const i = nodes.findIndex((it) => it.id === node);
      if (!nodes[i]) return;
      nodes[i].x = coord.x;
      nodes[i].y = coord.y;
    });
    g.edges().forEach((edge: any) => {
      coord = g.edge(edge);
      const i = edges.findIndex(
        (it) => it.source === edge.v && it.target === edge.w
      );
      if (self.controlPoints && edges[i].type !== "loop") {
        edges[i].controlPoints = coord.points.slice(1, coord.points.length - 1);
      }
    });

    if (self.sortByCombo) {
      self.sortLevel("comboId");
    }

    if (self.onLayoutEnd) self.onLayoutEnd();

    return {
      nodes,
      edges,
    };
  }

  public sortLevel(propertyName: string) {
    const self = this;
    const nodes = self.nodes as any[];

    const levels: any = {};
    nodes.forEach((node) => {
      if (!levels[node.y]) levels[node.y] = { y: node.y, nodes: [] };
      levels[node.y].nodes.push(node);
    });

    Object.keys(levels).forEach((key) => {
      const levelNodes: any = levels[key].nodes;
      const nodesNum = levelNodes.length;
      const comboCenters: any = {};
      levelNodes.forEach((lnode: any) => {
        const lnodeCombo = lnode.comboId;
        if (!comboCenters[lnodeCombo])
          comboCenters[lnodeCombo] = { x: 0, y: 0, count: 0 };
        comboCenters[lnodeCombo].x += lnode.x;
        comboCenters[lnodeCombo].y += lnode.y;
        comboCenters[lnodeCombo].count++;
      });
      Object.keys(comboCenters).forEach((ckey) => {
        comboCenters[ckey].x /= comboCenters[ckey].count;
        comboCenters[ckey].y /= comboCenters[ckey].count;
      });

      if (nodesNum === 1) {
        if (self.onLayoutEnd) self.onLayoutEnd();
        return;
      }
      const sortedByX = levelNodes.sort((a: any, b: any) => {
        return a.x - b.x;
      });
      const minX = sortedByX[0].x;
      const maxX = sortedByX[nodesNum - 1].x;
      const gap = (maxX - minX) / (nodesNum - 1);

      const sortedByCombo = levelNodes.sort((a: any, b: any) => {
        const aValue = a[propertyName] || "undefined";
        const bValue = b[propertyName] || "undefined";
        if (aValue < bValue) {
          return -1;
        }
        if (aValue > bValue) {
          return 1;
        }
        return 0;
      });
      sortedByCombo.forEach((node: any, i: number) => {
        node.x = minX + i * gap;
      });
    });
  }

  public getType() {
    return "dagre";
  }
}

function getFunc(
  func: ((d?: any) => number) | undefined,
  value: number,
  defaultValue: number
): Function {
  let resultFunc;
  if (func) {
    resultFunc = func;
  } else if (isNumber(value)) {
    resultFunc = () => value;
  } else {
    resultFunc = () => defaultValue;
  }
  return resultFunc;
}
