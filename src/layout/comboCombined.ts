/**
 * @fileOverview Combo force layout
 * @author shiwu.wyy@antfin.com
 */

import {
  Edge,
  Combo,
  OutNode,
  PointTuple,
  ComboTree,
  ComboCombinedLayoutOptions,
} from './types';
import { FORCE_LAYOUT_TYPE_MAP } from './constants';
import { Base } from './base';
import {
  isArray,
  isNumber,
  isFunction,
  traverseTreeUp,
  isObject,
  getLayoutBBox,
} from '../util';
import {
  CircularLayout,
  ConcentricLayout,
  GridLayout,
  RadialLayout,
  GForceLayout,
  MDSLayout,
} from '.';

type Node = OutNode & {
  depth?: number;
  itemType?: string;
  comboId?: string;
  fx?: number;
  fy?: number;
  mass?: number;
};

/**
 * combined two layouts (inner and outer) for graph with combos
 */
export class ComboCombinedLayout extends Base {
  /** 布局中心 */
  public center: PointTuple = [0, 0];

  /** 内部计算参数 */
  public nodes: Node[] = [];

  public edges: Edge[] = [];

  public combos: Combo[] = [];

  public comboEdges: Edge[] = [];

  /** 节点大小，用于防止节点之间的重叠 */
  public nodeSize: number | number[] | ((d?: unknown) => number) | undefined;

  /** 节点/combo最小间距，防止重叠时的间隙 */
  public spacing: ((d?: unknown) => number) | number | undefined;

  /** 最外层的布局算法，需要使用同步的布局算法，默认为 forceAtlas2 */
  public outerLayout: any;

  /** combo 内部的布局算法，默认为 concentric */
  public innerLayout:
    | ConcentricLayout
    | CircularLayout
    | GridLayout
    | RadialLayout;

  /** Combo 内部的 padding */
  public comboPadding:
    | ((d?: unknown) => number)
    | number
    | number[]
    | undefined = 10;

  public comboTrees: ComboTree[] = [];

  constructor(options?: ComboCombinedLayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {};
  }

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const nodes = self.nodes;
    const center = self.center;

    if (!nodes || nodes.length === 0) {
      if (self.onLayoutEnd) self.onLayoutEnd();
      return;
    }
    if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      if (self.onLayoutEnd) self.onLayoutEnd();
      return;
    }

    self.initVals();

    // layout
    self.run();
    if (self.onLayoutEnd) self.onLayoutEnd();
  }

  public run() {
    const self = this;
    const { nodes, edges, combos, comboEdges, center } = self;

    const nodeMap: any = {};
    nodes.forEach((node) => {
      nodeMap[node.id] = node;
    });
    const comboMap: any = {};
    combos.forEach((combo) => {
      comboMap[combo.id] = combo;
    });

    const innerGraphs: any = self.getInnerGraphs(nodeMap);

    // 每个 innerGraph 作为一个节点，带有大小，参与 force 计算
    const outerNodeIds: string[] = [];
    const outerNodes: Node[] = [];
    const nodeAncestorIdMap: { [key: string]: string } = {};
    let allHaveNoPosition = true;
    this.comboTrees.forEach((cTree) => {
      const innerNode = innerGraphs[cTree.id];
      if (!innerNode) {
        return;
      }
      // 代表 combo 的节点
      const oNode: Node = {
        ...cTree,
        x: innerNode.x || comboMap[cTree.id].x,
        y: innerNode.y || comboMap[cTree.id].y,
        fx: innerNode.fx || comboMap[cTree.id].fx,
        fy: innerNode.fy || comboMap[cTree.id].fy,
        mass: innerNode.mass || comboMap[cTree.id].mass,
        size: innerNode.size,
      };
      outerNodes.push(oNode);
      if (
        !isNaN(oNode.x) &&
        oNode.x !== 0 &&
        !isNaN(oNode.y) &&
        oNode.y !== 0
      ) {
        allHaveNoPosition = false;
      } else {
        oNode.x = Math.random() * 100;
        oNode.y = Math.random() * 100;
      }
      outerNodeIds.push(cTree.id);
      traverseTreeUp<ComboTree>(cTree, (child) => {
        if (child.id !== cTree.id) nodeAncestorIdMap[child.id] = cTree.id;
        return true;
      });
    });
    nodes.forEach((node) => {
      if (node.comboId && comboMap[node.comboId]) return;
      // 代表节点的节点
      const oNode: Node = { ...node };
      outerNodes.push(oNode);
      if (
        !isNaN(oNode.x) &&
        oNode.x !== 0 &&
        !isNaN(oNode.y) &&
        oNode.y !== 0
      ) {
        allHaveNoPosition = false;
      } else {
        oNode.x = Math.random() * 100;
        oNode.y = Math.random() * 100;
      }
      outerNodeIds.push(node.id);
    });
    const outerEdges: any = [];
    edges.concat(comboEdges).forEach((edge) => {
      const sourceAncestorId = nodeAncestorIdMap[edge.source] || edge.source;
      const targetAncestorId = nodeAncestorIdMap[edge.target] || edge.target;
      // 若两个点的祖先都在力导图的节点中，且是不同的节点，创建一条链接两个祖先的边到力导图的边中
      if (
        sourceAncestorId !== targetAncestorId &&
        outerNodeIds.includes(sourceAncestorId) &&
        outerNodeIds.includes(targetAncestorId)
      ) {
        outerEdges.push({
          source: sourceAncestorId,
          target: targetAncestorId,
        });
      }
    });

    // 若有需要最外层的 combo 或节点，则对最外层执行力导向
    if (outerNodes?.length) {
      if (outerNodes.length === 1) {
        outerNodes[0].x = center[0];
        outerNodes[0].y = center[1];
      } else {
        const outerData = {
          nodes: outerNodes,
          edges: outerEdges,
        };

        // 需要使用一个同步的布局
        // @ts-ignore
        const outerLayout =
          this.outerLayout ||
          new GForceLayout({
            gravity: 1,
            factor: 4,
            linkDistance: (edge: any, source: any, target: any) => {
              const nodeSize =
                ((source.size?.[0] || 30) + (target.size?.[0] || 30)) / 2;
              return Math.min(nodeSize * 1.5, 700);
            },
          });
        const outerLayoutType = outerLayout.getType?.();
        outerLayout.updateCfg({
          center,
          kg: 5,
          preventOverlap: true,
          animate: false,
        });
        // 若所有 outerNodes 都没有位置，且 outerLayout 是力导家族的布局，则先执行 preset mds 或 grid
        if (allHaveNoPosition && FORCE_LAYOUT_TYPE_MAP[outerLayoutType]) {
          const outerLayoutPreset =
            outerNodes.length < 100 ? new MDSLayout() : new GridLayout();
          outerLayoutPreset.layout(outerData);
        }
        outerLayout.layout(outerData);
      }
      // 根据外部布局结果，平移 innerGraphs 中的节点（第一层）
      outerNodes.forEach((outerNode) => {
        const innerGraph = innerGraphs[outerNode.id];
        if (!innerGraph) {
          const node = nodeMap[outerNode.id];
          if (node) {
            node.x = outerNode.x;
            node.y = outerNode.y;
          }
          return;
        }
        innerGraph.visited = true;
        innerGraph.x = outerNode.x;
        innerGraph.y = outerNode.y;
        innerGraph.nodes.forEach((node: OutNode) => {
          node.x += outerNode.x;
          node.y += outerNode.y;
        });
      });
    }

    // 至上而下遍历树处理下面各层节点位置
    const innerGraphIds = Object.keys(innerGraphs);
    for (let i = innerGraphIds.length - 1; i >= 0; i--) {
      const id = innerGraphIds[i];
      const innerGraph = innerGraphs[id];
      if (!innerGraph) continue;
      innerGraph.nodes.forEach((node: OutNode) => {
        if (!innerGraph.visited) {
          node.x += innerGraph.x || 0;
          node.y += innerGraph.y || 0;
        }
        if (nodeMap[node.id]) {
          nodeMap[node.id].x = node.x;
          nodeMap[node.id].y = node.y;
        }
      });
      if (comboMap[id]) {
        comboMap[id].x = innerGraph.x;
        comboMap[id].y = innerGraph.y;
      }
    }
    return { nodes, edges, combos, comboEdges };
  }

  private getInnerGraphs(nodeMap: any) {
    const self = this;
    const { comboTrees, nodeSize, edges, comboPadding, spacing } = self;
    const innerGraphs: any = {};

    // @ts-ignore
    const innerGraphLayout: any =
      this.innerLayout ||
      new ConcentricLayout({ type: 'concentric', sortBy: 'id' });
    innerGraphLayout.center = [0, 0];
    innerGraphLayout.preventOverlap = true;
    innerGraphLayout.nodeSpacing = spacing;

    (comboTrees || []).forEach((ctree: any) => {
      traverseTreeUp<ComboTree>(ctree, (treeNode) => {
        // @ts-ignore
        let padding = comboPadding?.(treeNode) || 10; // 返回的最大值
        if (isArray(padding)) padding = Math.max(...padding);
        if (!treeNode.children?.length) {
          // 空 combo
          if (treeNode.itemType === 'combo') {
            const treeNodeSize = padding
              ? [padding * 2, padding * 2]
              : [30, 30];
            innerGraphs[treeNode.id] = {
              id: treeNode.id,
              nodes: [],
              size: treeNodeSize,
            };
          }
        } else {
          // 非空 combo
          const innerGraphNodes = treeNode.children.map((child) => {
            if (child.itemType === 'combo') return innerGraphs[child.id];
            const oriNode = nodeMap[child.id] || {};
            return { ...oriNode, ...child };
          });
          const innerGraphNodeIds = innerGraphNodes.map((node) => node.id);
          const innerGraphData = {
            nodes: innerGraphNodes,
            edges: edges.filter(
              (edge) =>
                innerGraphNodeIds.includes(edge.source) &&
                innerGraphNodeIds.includes(edge.target)
            ),
          };
          let minNodeSize = Infinity;
          innerGraphNodes.forEach((node) => {
            // @ts-ignore
            if (!node.size)
              node.size = innerGraphs[node.id]?.size ||
                (nodeSize as Function)?.(node) || [30, 30];
            if (isNumber(node.size)) node.size = [node.size, node.size];
            if (minNodeSize > node.size[0]) minNodeSize = node.size[0];
            if (minNodeSize > node.size[1]) minNodeSize = node.size[1];
          });

          // 根据节点数量、spacing，调整布局参数

          innerGraphLayout.layout(innerGraphData);
          const { minX, minY, maxX, maxY } = getLayoutBBox(innerGraphNodes);
          // move the innerGraph to [0, 0],for later controled by parent layout
          const center = { x: (maxX + minX) / 2, y: (maxY + minY) / 2 };
          innerGraphData.nodes.forEach((node) => {
            node.x -= center.x;
            node.y -= center.y;
          });
          const innerGraphWidth =
            Math.max(maxX - minX, minNodeSize) + padding * 2;
          const innerGraphHeight =
            Math.max(maxY - minY, minNodeSize) + padding * 2;
          innerGraphs[treeNode.id] = {
            id: treeNode.id,
            nodes: innerGraphNodes,
            size: [innerGraphWidth, innerGraphHeight],
          };
        }
        return true;
      });
    });
    return innerGraphs;
  }

  private initVals() {
    const self = this;

    const nodeSize = self.nodeSize;
    const spacing = self.spacing;
    let nodeSizeFunc: (d: any) => number;
    let spacingFunc: (d: any) => number;

    // nodeSpacing to function
    if (isNumber(spacing)) {
      spacingFunc = () => spacing as any;
    } else if (isFunction(spacing)) {
      spacingFunc = spacing;
    } else {
      spacingFunc = () => 0;
    }
    this.spacing = spacingFunc;

    // nodeSize to function
    if (!nodeSize) {
      nodeSizeFunc = (d) => {
        const spacing = spacingFunc(d);
        if (d.size) {
          if (isArray(d.size)) {
            const res = d.size[0] > d.size[1] ? d.size[0] : d.size[1];
            return (res + spacing) / 2;
          }
          if (isObject(d.size)) {
            const res =
              d.size.width > d.size.height ? d.size.width : d.size.height;
            return (res + spacing) / 2;
          }
          return (d.size + spacing) / 2;
        }
        return 10 + spacing / 2;
      };
    } else if (isFunction(nodeSize)) {
      nodeSizeFunc = (d) => {
        const size = nodeSize(d);
        const spacing = spacingFunc(d);
        if (isArray(d.size)) {
          const res = d.size[0] > d.size[1] ? d.size[0] : d.size[1];
          return (res + spacing) / 2;
        }
        return ((size || 10) + spacing) / 2;
      };
    } else if (isArray(nodeSize)) {
      const larger = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
      const radius = larger / 2;
      nodeSizeFunc = (d) => radius + spacingFunc(d) / 2;
    } else {
      // number type
      const radius = nodeSize / 2;
      nodeSizeFunc = (d) => radius + spacingFunc(d) / 2;
    }
    this.nodeSize = nodeSizeFunc;

    // comboPadding to function
    const comboPadding = self.comboPadding;
    let comboPaddingFunc: (d: any) => number;
    if (isNumber(comboPadding)) {
      comboPaddingFunc = () => comboPadding as any;
    } else if (isArray(comboPadding)) {
      comboPaddingFunc = () => Math.max.apply(null, comboPadding);
    } else if (isFunction(comboPadding)) {
      comboPaddingFunc = comboPadding;
    } else {
      // null type
      comboPaddingFunc = () => 0;
    }
    this.comboPadding = comboPaddingFunc;
  }
  public getType() {
    return 'comboCombined';
  }
}
