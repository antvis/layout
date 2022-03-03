/**
 * @fileOverview Combo force layout
 * @author shiwu.wyy@antfin.com
 */

import {
  Edge,
  OutNode,
  PointTuple,
  IndexMap,
  Combo,
  ComboTree,
  Point,
  ComboForceLayoutOptions
} from "./types";
import { Base } from "./base";
import { isArray, isNumber, isFunction, traverseTreeUp, isObject, getEdgeTerminal } from "../util";

type Node = OutNode & {
  depth: number;
  itemType?: string;
  comboId?: string;
};

type NodeMap = {
  [key: string]: Node;
};

type ComboMap = {
  [key: string]: Combo;
};

/**
 * force layout for graph with combos
 */
export class ComboForceLayout extends Base {
  /** 布局中心 */
  public center: PointTuple = [0, 0];

  /** 停止迭代的最大迭代数 */
  public maxIteration: number = 100;

  /** 重力大小，影响图的紧凑程度 */
  public gravity: number = 10;

  /** 群组中心力大小 */
  public comboGravity: number = 10;

  /** 默认边长度 */
  public linkDistance: number | ((d?: unknown) => number) = 10;

  /** 每次迭代位移的衰减相关参数 */
  public alpha: number = 1;

  public alphaMin: number = 0.001;

  public alphaDecay: number = 1 - this.alphaMin ** (1 / 300);

  public alphaTarget: number = 0;

  /** 节点运动速度衰减参数 */
  public velocityDecay: number = 0.6;

  /** 边引力大小 */
  public edgeStrength: number | ((d?: unknown) => number) = 0.6;

  /** 节点引力大小 */
  public nodeStrength: number | ((d?: unknown) => number) = 30;

  /** 是否开启防止重叠 */
  public preventOverlap: boolean = false;

  /** 是否开启节点之间的防止重叠 */
  public preventNodeOverlap: boolean = false;

  /** 是否开启 Combo 之间的防止重叠 */
  public preventComboOverlap: boolean = false;

  /** 防止重叠的碰撞力大小 */
  public collideStrength: number | undefined = undefined;

  /** 防止重叠的碰撞力大小 */
  public nodeCollideStrength: number | undefined = 0.5;

  /** 防止重叠的碰撞力大小 */
  public comboCollideStrength: number | undefined = 0.5;

  /** 节点大小，用于防止重叠 */
  public nodeSize: number | number[] | ((d?: unknown) => number) | undefined;

  /** 节点最小间距，防止重叠时的间隙 */
  public nodeSpacing: ((d?: unknown) => number) | number | undefined;

  /** Combo 最小间距，防止重叠时的间隙 */
  public comboSpacing: ((d?: unknown) => number) | number | undefined = 20;

  /** Combo 内部的 padding */
  public comboPadding:
    | ((d?: unknown) => number)
    | number
    | number[]
    | undefined = 10;

  /** 优化计算斥力的速度，两节点间距超过 optimizeRangeFactor * width 则不再计算斥力和重叠斥力 */
  public optimizeRangeFactor: number = 1;

  /** 每次迭代的回调函数 */
  public onTick: () => void = () => {};

  /** 迭代结束的回调函数 */
  public onLayoutEnd: () => void = () => {};

  /** 根据边两端节点层级差距的调整引力系数的因子，取值范围 [0, 1]。层级差距越大，引力越小 */
  public depthAttractiveForceScale: number = 1;

  /** 根据边两端节点层级差距的调整斥力系数的因子，取值范围 [1, Infinity]。层级差距越大，斥力越大 */
  public depthRepulsiveForceScale: number = 2;

  /** 内部计算参数 */
  public nodes: Node[] = [];

  public edges: Edge[] = [];

  public combos: Combo[] = [];

  private comboTrees: ComboTree[] = [];

  // add a virtual root to comboTrees
  private comboTree: ComboTree;

  private width: number = 300;

  private height: number = 300;

  private bias: number[] = [];

  private nodeMap: NodeMap = {};

  private oriComboMap: ComboMap = {};

  private indexMap: IndexMap = {};

  private comboMap: ComboMap = {};

  private previousLayouted: boolean = false;

  constructor(options?: ComboForceLayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {
      maxIteration: 100,
      center: [0, 0],
      gravity: 10,
      speed: 1,
      comboGravity: 30,
      preventOverlap: false,
      preventComboOverlap: true,
      preventNodeOverlap: true,
      nodeSpacing: undefined,
      collideStrength: undefined,
      nodeCollideStrength: 0.5,
      comboCollideStrength: 0.5,
      comboSpacing: 20,
      comboPadding: 10,
      edgeStrength: 0.6,
      nodeStrength: 30,
      linkDistance: 10
    };
  }

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const nodes = self.nodes;
    const center = self.center;
    self.comboTree = {
      id: "comboTreeRoot",
      depth: -1,
      children: self.comboTrees
    };

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
    const nodes = self.nodes;
    const maxIteration = self.previousLayouted
      ? self.maxIteration / 5
      : self.maxIteration;
    if (!self.width && typeof window !== "undefined") {
      self.width = window.innerWidth;
    }
    if (!self.height && typeof window !== "undefined") {
      self.height = window.innerHeight;
    }
    const center = self.center;
    const velocityDecay = self.velocityDecay;

    // init the positions to make the nodes with same combo gather around the combo
    const comboMap = self.comboMap;
    if (!self.previousLayouted) self.initPos(comboMap);

    // iterate
    for (let i = 0; i < maxIteration; i++) {
      const displacements: Point[] = [];
      nodes.forEach((_, j) => {
        displacements[j] = { x: 0, y: 0 };
      });
      self.applyCalculate(displacements);

      // gravity for combos
      self.applyComboCenterForce(displacements);

      // move
      nodes.forEach((n, j) => {
        if (!isNumber(n.x) || !isNumber(n.y)) return;
        n.x += displacements[j].x * velocityDecay;
        n.y += displacements[j].y * velocityDecay;
      });
      self.alpha += (self.alphaTarget - self.alpha) * self.alphaDecay;
      self.onTick();
    }

    // move to center
    const meanCenter = [0, 0];
    nodes.forEach((n) => {
      if (!isNumber(n.x) || !isNumber(n.y)) return;
      meanCenter[0] += n.x;
      meanCenter[1] += n.y;
    });
    meanCenter[0] /= nodes.length;
    meanCenter[1] /= nodes.length;
    const centerOffset = [center[0] - meanCenter[0], center[1] - meanCenter[1]];
    nodes.forEach((n, j) => {
      if (!isNumber(n.x) || !isNumber(n.y)) return;
      n.x += centerOffset[0];
      n.y += centerOffset[1];
    });

    // arrange the empty combo
    self.combos.forEach((combo) => {
      const mapped = comboMap[combo.id];
      if (mapped && mapped.empty) {
        combo.x = mapped.cx || combo.x;
        combo.y = mapped.cy || combo.y;
      }
    });

    self.previousLayouted = true;
  }

  private initVals() {
    const self = this;
    const edges = self.edges;
    const nodes = self.nodes;
    const combos = self.combos;
    const count: any = {};

    const nodeMap: NodeMap = {};
    const indexMap: IndexMap = {};
    nodes.forEach((node, i) => {
      nodeMap[node.id] = node;
      indexMap[node.id] = i;
    });
    self.nodeMap = nodeMap;
    self.indexMap = indexMap;

    const oriComboMap: ComboMap = {};
    combos.forEach((combo) => {
      oriComboMap[combo.id] = combo;
    });
    self.oriComboMap = oriComboMap;
    self.comboMap = self.getComboMap();

    const preventOverlap = self.preventOverlap;
    self.preventComboOverlap = self.preventComboOverlap || preventOverlap;
    self.preventNodeOverlap = self.preventNodeOverlap || preventOverlap;

    const collideStrength = self.collideStrength;
    if (collideStrength) {
      self.comboCollideStrength = collideStrength;
      self.nodeCollideStrength = collideStrength;
    }
    self.comboCollideStrength = self.comboCollideStrength
      ? self.comboCollideStrength
      : 0;
    self.nodeCollideStrength = self.nodeCollideStrength
      ? self.nodeCollideStrength
      : 0;

    // get edge bias
    for (let i = 0; i < edges.length; ++i) {
      const source = getEdgeTerminal(edges[i], 'source');
      const target = getEdgeTerminal(edges[i], 'target');
      if (count[source]) count[source]++;
      else count[source] = 1;
      if (count[target]) count[target]++;
      else count[target] = 1;
    }
    const bias = [];
    for (let i = 0; i < edges.length; ++i) {
      const source = getEdgeTerminal(edges[i], 'source');
      const target = getEdgeTerminal(edges[i], 'target');
      bias[i] = count[source] / (count[source] + count[target]);
    }
    this.bias = bias;

    const nodeSize = self.nodeSize;
    const nodeSpacing = self.nodeSpacing;
    let nodeSizeFunc: (d: any) => number;
    let nodeSpacingFunc: (d: any) => number;

    // nodeSpacing to function
    if (isNumber(nodeSpacing)) {
      nodeSpacingFunc = () => nodeSpacing as any;
    } else if (isFunction(nodeSpacing)) {
      nodeSpacingFunc = nodeSpacing;
    } else {
      nodeSpacingFunc = () => 0;
    }
    this.nodeSpacing = nodeSpacingFunc;

    // nodeSize to function
    if (!nodeSize) {
      nodeSizeFunc = (d) => {
        if (d.size) {
          if (isArray(d.size)) {
            const res = d.size[0] > d.size[1] ? d.size[0] : d.size[1];
            return res / 2;
          }  if (isObject(d.size)) {
            const res = d.size.width > d.size.height ? d.size.width : d.size.height;
            return res / 2;
          }
          return d.size / 2;
        }
        return 10;
      };
    } else if (isFunction(nodeSize)) {
      nodeSizeFunc = (d) => {
        return nodeSize(d);
      };
    } else if (isArray(nodeSize)) {
      const larger = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
      const radius = larger / 2;
      nodeSizeFunc = (d) => radius;
    } else {
      // number type
      const radius = nodeSize / 2;
      nodeSizeFunc = (d) => radius;
    }
    this.nodeSize = nodeSizeFunc;

    // comboSpacing to function
    const comboSpacing = self.comboSpacing;
    let comboSpacingFunc: (d: any) => number;
    if (isNumber(comboSpacing)) {
      comboSpacingFunc = () => comboSpacing as any;
    } else if (isFunction(comboSpacing)) {
      comboSpacingFunc = comboSpacing;
    } else {
      // null type
      comboSpacingFunc = () => 0;
    }
    this.comboSpacing = comboSpacingFunc;

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

    // linkDistance to function
    let linkDistance = this.linkDistance;
    let linkDistanceFunc;
    if (!linkDistance) {
      linkDistance = 10;
    }
    if (isNumber(linkDistance)) {
      linkDistanceFunc = (d: any) => {
        return linkDistance;
      };
    } else {
      linkDistanceFunc = linkDistance;
    }
    this.linkDistance = linkDistanceFunc as ((d?: unknown) => number);

    // linkStrength to function
    let edgeStrength = this.edgeStrength;
    let edgeStrengthFunc;
    if (!edgeStrength) {
      edgeStrength = 1;
    }
    if (isNumber(edgeStrength)) {
      edgeStrengthFunc = (d: any) => {
        return edgeStrength;
      };
    } else {
      edgeStrengthFunc = edgeStrength;
    }
    this.edgeStrength = edgeStrengthFunc as ((d?: unknown) => number);

    // nodeStrength to function
    let nodeStrength = this.nodeStrength;
    let nodeStrengthFunc;
    if (!nodeStrength) {
      nodeStrength = 30;
    }
    if (isNumber(nodeStrength)) {
      nodeStrengthFunc = (d: any) => {
        return nodeStrength;
      };
    } else {
      nodeStrengthFunc = nodeStrength;
    }
    this.nodeStrength = nodeStrengthFunc as ((d?: unknown) => number);
  }

  private initPos(comboMap: ComboMap) {
    const self = this;
    const nodes = self.nodes;
    nodes.forEach((node, i) => {
      const comboId = (node as any).comboId;
      const combo: any = comboMap[comboId];
      if (comboId && combo) {
        node.x = combo.cx + 100 / (i + 1);
        node.y = combo.cy + 100 / (i + 1);
      } else {
        node.x = 100 / (i + 1);
        node.y = 100 / (i + 1);
      }
    });
  }

  private getComboMap() {
    const self = this;
    const nodeMap = self.nodeMap;
    const comboTrees = self.comboTrees;
    const oriComboMap = self.oriComboMap;
    const comboMap: ComboMap = {};

    (comboTrees || []).forEach((ctree: any) => {
      const treeChildren: Combo[] | Node[] = [];
      traverseTreeUp<ComboTree>(ctree, (treeNode) => {
        if (treeNode.itemType === "node") return true; // skip it
        if (!oriComboMap[treeNode.id]) return true; // means it is hidden, skip it
        if (comboMap[treeNode.id] === undefined) {
          const combo = {
            id: treeNode.id,
            name: treeNode.id,
            cx: 0,
            cy: 0,
            count: 0,
            depth: self.oriComboMap[treeNode.id].depth as number || 0,
            children: [] as any
          };
          comboMap[treeNode.id] = combo;
        }
        const children = treeNode.children;
        if (children) {
          children.forEach((child: any) => {
            if (!comboMap[child.id] && !nodeMap[child.id]) return true; // means it is hidden
            treeChildren.push(child);
          });
        }
        const c: any = comboMap[treeNode.id];
        c.cx = 0;
        c.cy = 0;

        if (treeChildren.length === 0) {
          c.empty = true;
          const oriCombo = oriComboMap[treeNode.id];
          c.cx = oriCombo.x as number;
          c.cy = oriCombo.y as number;
        }

        treeChildren.forEach((child: Combo | Node) => {
          (c.count as number)++;
          if (child.itemType !== "node") {
            const childCombo = comboMap[child.id];
            if (isNumber(childCombo.cx)) c.cx += childCombo.cx;
            if (isNumber(childCombo.cy)) c.cy += childCombo.cy;
            return;
          }
          const node = nodeMap[child.id];
          // means the node is hidden, skip it
          if (!node) return;

          if (isNumber(node.x)) {
            c.cx += node.x;
          }
          if (isNumber(node.y)) {
            c.cy += node.y;
          }
        });
        c.cx /= (c.count || 1) as number;
        c.cy /= (c.count || 1) as number;

        c.children = treeChildren as any;

        return true;
      });
    });

    return comboMap;
  }

  private applyComboCenterForce(displacements: Point[]) {
    const self = this;
    const gravity = self.gravity;
    const comboGravity = self.comboGravity || gravity;
    const alpha = this.alpha;
    const comboTrees = self.comboTrees;
    const indexMap = self.indexMap;
    const nodeMap = self.nodeMap;
    const comboMap = self.comboMap;

    (comboTrees || []).forEach((ctree) => {
      traverseTreeUp<ComboTree>(ctree, (treeNode) => {
        if (treeNode.itemType === "node") return true; // skip it
        const combo = comboMap[treeNode.id];
        // means the combo is hidden, skip it
        if (!combo) return true;
        const c: any = comboMap[treeNode.id];

        // higher depth the combo, larger the gravity
        const gravityScale = (((c.depth as number) + 1) / 10) * 0.5;
        // apply combo center force for all the descend nodes in this combo
        // and update the center position and count for this combo
        const comboX = c.cx;
        const comboY = c.cy;
        c.cx = 0;
        c.cy = 0;
        c.children!.forEach((child: any) => {
          if (child.itemType !== "node") {
            const childCombo = comboMap[child.id];
            if (childCombo && isNumber(childCombo.cx)) c.cx += childCombo.cx;
            if (childCombo && isNumber(childCombo.cy)) c.cy += childCombo.cy;
            return;
          }
          const node = nodeMap[child.id];
          const vecX = (node.x - comboX) || 0.005;
          const vecY = (node.y - comboY) || 0.005;
          const l = Math.sqrt(vecX * vecX + vecY * vecY);
          const childIdx = indexMap[node.id];
          const params = ((comboGravity * alpha) / l) * gravityScale;
          displacements[childIdx].x -= vecX * params;
          displacements[childIdx].y -= vecY * params;

          if (isNumber(node.x)) c.cx += node.x;
          if (isNumber(node.y)) c.cy += node.y;
        });
        c.cx /= (c.count || 1) as number;
        c.cy /= (c.count || 1) as number;
        return true;
      });
    });
  }

  private applyCalculate(displacements: Point[]) {
    const self = this;
    const comboMap = self.comboMap;
    const nodes = self.nodes;
    // store the vx, vy, and distance to reduce dulplicate calculation
    const vecMap: any = {};
    nodes.forEach((v, i) => {
      nodes.forEach((u, j) => {
        if (i < j) return;
        const vx = (v.x - u.x) || 0.005;
        const vy = (v.y - u.y) || 0.005;
        let vl2 = vx * vx + vy * vy;
        const vl = Math.sqrt(vl2);
        if (vl2 < 1) vl2 = vl;
        vecMap[`${v.id}-${u.id}`] = { vx, vy, vl2, vl };
        vecMap[`${u.id}-${v.id}`] = { vl2, vl, vx: -vx, vy: -vy };
      });
    });
    // get the sizes of the combos
    self.updateComboSizes(comboMap);
    self.calRepulsive(displacements, vecMap);
    self.calAttractive(displacements, vecMap);

    const preventComboOverlap = self.preventComboOverlap;
    if (preventComboOverlap) self.comboNonOverlapping(displacements, comboMap);
  }

  /**
   * Update the sizes of the combos according to their children
   * Used for combos nonoverlap, but not re-render the combo shapes
   */
  private updateComboSizes(comboMap: ComboMap) {
    const self = this;
    const comboTrees = self.comboTrees;
    const nodeMap = self.nodeMap;
    const nodeSize = self.nodeSize as ((d?: unknown) => number);
    const comboSpacing = self.comboSpacing as ((d?: unknown) => number);
    const comboPadding = self.comboPadding as ((d?: unknown) => number);
    (comboTrees || []).forEach((ctree) => {
      const treeChildren: Combo[] | Node[] = [];
      traverseTreeUp<ComboTree>(ctree, (treeNode: ComboTree) => {
        if (treeNode.itemType === "node") return true; // skip it
        const c = comboMap[treeNode.id];
        // means the combo is hidden, skip it
        if (!c) return false;
        const children = treeNode.children;
        if (children) {
          children.forEach((child: any) => {
            // means the combo is hidden.
            if (!comboMap[child.id] && !nodeMap[child.id]) return;
            treeChildren.push(child);
          });
        }

        c.minX = Infinity;
        c.minY = Infinity;
        c.maxX = -Infinity;
        c.maxY = -Infinity;
        treeChildren.forEach((child: any) => {
          if (child.itemType !== "node") return true; // skip it
          const node = nodeMap[child.id];
          if (!node) return true; // means it is hidden
          const r = nodeSize(node);
          const nodeMinX = node.x - r;
          const nodeMinY = node.y - r;
          const nodeMaxX = node.x + r;
          const nodeMaxY = node.y + r;
          if (c.minX! > nodeMinX) c.minX = nodeMinX;
          if (c.minY! > nodeMinY) c.minY = nodeMinY;
          if (c.maxX! < nodeMaxX) c.maxX = nodeMaxX;
          if (c.maxY! < nodeMaxY) c.maxY = nodeMaxY;
        });
        let minSize = self.oriComboMap[treeNode.id].size || 10;
        if (isArray(minSize)) minSize = minSize[0];
        const maxLength = Math.max(
          c.maxX - c.minX,
          c.maxY - c.minY,
          minSize as number
        );
        c.r = maxLength / 2 + comboSpacing(c) / 2 + comboPadding(c);

        return true;
      });
    });
  }

  /**
   * prevent the overlappings among combos
   */
  private comboNonOverlapping(displacements: Point[], comboMap: ComboMap) {
    const self = this;
    const comboTree = self.comboTree;
    const comboCollideStrength = self.comboCollideStrength as number;
    const indexMap = self.indexMap;
    const nodeMap = self.nodeMap;

    traverseTreeUp<ComboTree>(comboTree, (treeNode) => {
      if (
        !comboMap[treeNode.id] &&
        !nodeMap[treeNode.id] &&
        treeNode.id !== "comboTreeRoot"
      ) {
        return false;
      } // means it is hidden
      const children = treeNode.children;
      // 同个子树下的子 combo 间两两对比
      if (children && children.length > 1) {
        children.forEach((v, i) => {
          if (v.itemType === "node") return false; // skip it
          const cv: any = comboMap[v.id];
          if (!cv) return; // means it is hidden, skip it
          children.forEach((u, j) => {
            if (i <= j) return false;
            if (u.itemType === "node") return false; // skip it
            const cu: any = comboMap[u.id];
            if (!cu) return false; // means it is hidden, skip it
            const vx = (cv.cx - cu.cx) || 0.005;
            const vy = (cv.cy - cu.cy) || 0.005;
            const l = vx * vx + vy * vy;
            const rv = cv.r as number || 1;
            const ru = cu.r as number || 1;
            const r = rv + ru;
            const ru2 = ru * ru;
            const rv2 = rv * rv;
            // overlapping
            if (l < r * r) {
              const vnodes = v.children;
              if (!vnodes || vnodes.length === 0) return false; // skip it
              const unodes = u.children;
              if (!unodes || unodes.length === 0) return false; // skip it
              const sqrtl = Math.sqrt(l);
              const ll = ((r - sqrtl) / sqrtl) * comboCollideStrength;
              const xl = vx * ll;
              const yl = vy * ll;
              const rratio = ru2 / (rv2 + ru2);
              const irratio = 1 - rratio;
              // 两兄弟 combo 的子节点上施加斥力
              vnodes.forEach((vn) => {
                if (vn.itemType !== "node") return false; // skip it
                if (!nodeMap[vn.id]) return; // means it is hidden, skip it
                const vindex = indexMap[vn.id];
                unodes.forEach((un) => {
                  if (un.itemType !== "node") return false;
                  if (!nodeMap[un.id]) return false; // means it is hidden, skip it
                  const uindex = indexMap[un.id];
                  displacements[vindex].x += xl * rratio;
                  displacements[vindex].y += yl * rratio;
                  displacements[uindex].x -= xl * irratio;
                  displacements[uindex].y -= yl * irratio;
                });
              });
            }
          });
        });
      }
      return true;
    });
  }

  /**
   * Calculate the repulsive force between each node pair
   * @param displacements The array stores the displacements for nodes
   * @param vecMap The map stores vector between each node pair
   */
  private calRepulsive(displacements: Point[], vecMap: any) {
    const self = this;
    const nodes = self.nodes;
    const max = self.width * self.optimizeRangeFactor;
    const nodeStrength = self.nodeStrength as (d?: unknown) => number;
    const alpha = self.alpha;
    const nodeCollideStrength = self.nodeCollideStrength as number;
    const preventNodeOverlap = self.preventNodeOverlap;
    const nodeSizeFunc = self.nodeSize as ((d?: unknown) => number);
    const nodeSpacingFunc = self.nodeSpacing as ((d?: unknown) => number);
    const scale = self.depthRepulsiveForceScale;
    const center = self.center;
    nodes.forEach((v, i) => {
      if (!v.x || !v.y) return;

      // center gravity
      if (center) {
        const gravity = self.gravity;
        const vecX = (v.x - center[0]) || 0.005;
        const vecY = (v.y - center[1]) || 0.005;
        const l = Math.sqrt(vecX * vecX + vecY * vecY);
        displacements[i].x -= (vecX * gravity * alpha) / l;
        displacements[i].y -= (vecY * gravity * alpha) / l;
      }

      nodes.forEach((u, j) => {
        if (i === j) {
          return;
        }
        if (!u.x || !u.y) return;
        const { vl2, vl } = vecMap[`${v.id}-${u.id}`];
        if (vl > max) return;

        const { vx, vy } = vecMap[`${v.id}-${u.id}`];

        let depthDiff = Math.log(Math.abs(u.depth - v.depth) / 10) + 1 || 1;
        depthDiff = depthDiff < 1 ? 1 : depthDiff;
        if (u.comboId !== v.comboId) depthDiff += 1;
        const depthParam = depthDiff ? scale ** depthDiff : 1;

        const params = ((nodeStrength(u) * alpha) / vl2) * depthParam;
        displacements[i].x += vx * params;
        displacements[i].y += vy * params;

        // prevent node overlappings
        if (i < j && preventNodeOverlap) {
          const ri = (nodeSizeFunc(v) + nodeSpacingFunc(v)) || 1;
          const rj = (nodeSizeFunc(u) + nodeSpacingFunc(u)) || 1;
          const r = ri + rj;
          if (vl2 < r * r) {
            const ll = ((r - vl) / vl) * nodeCollideStrength;
            const rj2 = rj * rj;
            let rratio = rj2 / (ri * ri + rj2);
            const xl = vx * ll;
            const yl = vy * ll;
            displacements[i].x += xl * rratio;
            displacements[i].y += yl * rratio;
            rratio = 1 - rratio;
            displacements[j].x -= xl * rratio;
            displacements[j].y -= yl * rratio;
          }
        }
      });
    });
  }

  /**
   * Calculate the attractive force between the node pair with edge
   * @param displacements The array stores the displacements for nodes
   * @param vecMap The map stores vector between each node pair
   */
  private calAttractive(displacements: Point[], vecMap: any) {
    const self = this;
    const edges = self.edges;
    const linkDistance = self.linkDistance as (d?: unknown) => number;
    const alpha = self.alpha;
    const edgeStrength = self.edgeStrength as (d?: unknown) => number;
    const bias = self.bias;
    const scale = self.depthAttractiveForceScale;
    edges.forEach((e, i) => {
      const source = getEdgeTerminal(e, 'source');
      const target = getEdgeTerminal(e, 'target');
      if (!source || !target || source === target) return;
      const uIndex = self.indexMap[source];
      const vIndex = self.indexMap[target];
      const u: Node = self.nodeMap[source];
      const v: Node = self.nodeMap[target];
      if (!u || !v) return;

      let depthDiff = u.depth === v.depth ? 0 : Math.log(Math.abs(u.depth - v.depth) / 10);
      if (u.comboId === v.comboId) {
        depthDiff = depthDiff / 2;
      }
      let depthParam = depthDiff ? scale ** depthDiff : 1;
      if (u.comboId !== v.comboId && depthParam === 1) {
        depthParam = scale / 2;
      } else if (u.comboId === v.comboId) {
        depthParam = 2;
      }

      if (!isNumber(v.x) || !isNumber(u.x) || !isNumber(v.y) || !isNumber(u.y)) {
        return;
      }
      const { vl, vx, vy } = vecMap[`${target}-${source}`];
      const l =
        ((vl - linkDistance(e)) / vl) * alpha * edgeStrength(e) * depthParam;
      const vecX = vx * l;
      const vecY = vy * l;

      const b = bias[i];
      displacements[vIndex].x -= vecX * b;
      displacements[vIndex].y -= vecY * b;
      displacements[uIndex].x += vecX * (1 - b);
      displacements[uIndex].y += vecY * (1 - b);
    });
  }

  public getType() {
    return "comboForce";
  }
}
