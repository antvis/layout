import { Base } from "./base";

export interface Node {
  id: string;
}

export interface OutNode extends Node {
  x: number;
  y: number;
  comboId?: string;
  layer?: number; // dagre布局中指定的层级
  _order?: number; // dagre布局中层内排序结果，用于增量布局
  layout?: boolean;
  size?: number | number[] | undefined;
}

export interface Edge {
  source: string;
  target: string;
}

export interface Combo {
  id: string;
  parentId?: string;
  x?: number;
  y?: number;
  name?: string | number;
  cx?: number;
  cy?: number;
  count?: number;
  depth?: number;
  children?: any[];
  empty?: boolean;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  size?: number;
  r?: number;
  itemType?: string;
}

export interface Model {
  nodes?: Node[];
  edges?: Edge[];
  combos?: Combo[];
  comboEdges?: Edge[];
  hiddenNodes?: Node[];
  hiddenEdges?: Edge[];
  hiddenCombos?: Combo[];
}

export interface OutModel extends Model {
  nodes?: OutNode[];
}

export type PointTuple = [number, number];

export interface Size {
  width: number;
  height: number;
}

export type IndexMap = {
  [key: string]: number;
};

export type Matrix = number[];

export type Point = {
  x: number;
  y: number;
};

export interface ComboTree {
  id: string;
  children?: ComboTree[];
  depth?: number;
  parentId?: string;
  itemType?: "node" | "combo";
  [key: string]: unknown;
}
export interface ComboConfig {
  id: string;
  parentId?: string;
  children?: ComboTree[];
  depth?: number;
}

export interface CircularLayoutOptions {
  type: "circular";
  center?: PointTuple;
  width?: number;
  height?: number;
  radius?: number | null;
  startRadius?: number | null;
  endRadius?: number | null;
  clockwise?: boolean;
  divisions?: number;
  ordering?: "topology" | "topology-directed" | "degree" | null;
  angleRatio?: number;
  workerEnabled?: boolean;
  startAngle?: number;
  endAngle?: number;
  onLayoutEnd?: () => void;
}

export interface ComboForceLayoutOptions {
  type: "comboForce";
  center?: PointTuple;
  maxIteration?: number;
  linkDistance?: number | ((d?: unknown) => number);
  nodeStrength?: number | ((d?: unknown) => number);
  edgeStrength?: number | ((d?: unknown) => number);
  preventOverlap?: boolean;
  preventNodeOverlap?: boolean;
  preventComboOverlap?: boolean;
  collideStrength?: number | undefined;
  nodeCollideStrength?: number | undefined;
  comboCollideStrength?: number | undefined;
  nodeSize?: number | number[] | ((d?: unknown) => number) | undefined;
  nodeSpacing?: ((d?: unknown) => number) | number | undefined;
  comboSpacing?: ((d?: unknown) => number) | number | undefined;
  comboPadding?: ((d?: unknown) => number) | number | number[] | undefined;
  alpha?: number;
  alphaDecay?: number;
  alphaMin?: number;
  onTick?: () => void;
  onLayoutEnd?: () => void;
  gravity?: number;
  comboGravity?: number;
  optimizeRangeFactor?: number;
  depthAttractiveForceScale?: number;
  depthRepulsiveForceScale?: number;
  velocityDecay?: number;
  workerEnabled?: boolean;
}
export interface ComboCombinedLayoutOptions {
  type: "comboConcentricForce";
  center?: PointTuple;
  nodeSize?: number | number[] | ((d?: any) => number) | undefined;
  spacing?: number | number[] | ((d?: any) => number) | undefined;
  comboPadding?: ((d?: unknown) => number) | number | number[] | undefined;
  comboTrees?: ComboTree[];
  outerLayout?: Base;
  innerLayout?: Base;
}

export interface ConcentricLayoutOptions {
  type: "concentric";
  center?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | PointTuple;
  minNodeSpacing?: number;
  sweep?: number;
  equidistant?: boolean;
  startAngle?: number;
  clockwise?: boolean;
  maxLevelDiff?: number;
  sortBy?: string;
  workerEnabled?: boolean;
  width?: number;
  height?: number;
  onLayoutEnd?: () => void;
}

export interface DagreLayoutOptions {
  type: "dagre";
  rankdir?: "TB" | "BT" | "LR" | "RL";
  align?: "UL" | "UR" | "DL" | "DR";
  begin?: PointTuple;
  nodeSize?: number | number[] | undefined;
  nodesep?: number;
  ranksep?: number;
  controlPoints?: boolean;
  sortByCombo?: boolean;
  workerEnabled?: boolean;
  edgeLabelSpace?: boolean;
  nodeOrder?: string[];
  preset?: {
    nodes: OutNode[],
    edges: any[],
  };
  onLayoutEnd?: () => void;
  nodesepFunc?: ((d?: any) => number) | undefined;
  ranksepFunc?: ((d?: any) => number) | undefined;
}

export interface DagreCompoundLayoutOptions {
  type?: "dagreCompound";
  rankdir?: "TB" | "BT" | "LR" | "RL";
  align?: "UL" | "UR" | "DL" | "DR";
  begin?: PointTuple;
  nodeSize?: number | number[] | undefined;
  nodesep?: number;
  ranksep?: number;
  controlPoints?: boolean;
  anchorPoint?: boolean;
  settings?: any;
  onLayoutEnd?: () => void;
}

export interface FruchtermanLayoutOptions {
  type: "fruchterman";
  center?: PointTuple;
  maxIteration?: number;
  width?: number;
  height?: number;
  gravity?: number;
  speed?: number;
  clustering?: boolean;
  clusterGravity?: number;
  workerEnabled?: boolean;
  gpuEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface GForceLayoutOptions {
  type?: "gForce";
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?: number | ((edge?: any, source?: any, target?: any) => number) | undefined;
  nodeStrength?: number | ((d?: any) => number) | undefined;
  edgeStrength?: number | ((d?: any) => number) | undefined;
  preventOverlap?: boolean;
  nodeSize?: number | number[] | ((d?: any) => number) | undefined;
  nodeSpacing?: number | number[] | ((d?: any) => number) | undefined;
  minMovement?: number;
  maxIteration?: number;
  damping?: number;
  maxSpeed?: number;
  coulombDisScale?: number;
  getMass?: ((d?: any) => number) | undefined;
  getCenter?: ((d?: any, degree?: number) => number[]) | undefined;
  gravity?: number;
  factor?: number;
  tick?: () => void;
  onLayoutEnd?: () => void;
  workerEnabled?: boolean;
  gpuEnabled?: boolean;
}

type INode = OutNode & {
  degree: number;
  size: number | PointTuple;
};

export interface GridLayoutOptions {
  type: "grid";
  width?: number;
  height?: number;
  begin?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | number[];
  preventOverlapPadding?: number;
  condense?: boolean;
  rows?: number;
  cols?: number;
  sortBy?: string;
  workerEnabled?: boolean;
  position?: ((node: INode) => { row?: number; col?: number }) | undefined;
  onLayoutEnd?: () => void;
}

export interface MDSLayoutOptions {
  type: "mds";
  center?: PointTuple;
  linkDistance?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface RandomLayoutOptions {
  type: "random";
  center?: PointTuple;
  width?: number;
  height?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface ForceLayoutOptions {
  type: "force";
  center?: PointTuple;
  linkDistance?: number | ((d?: any) => number) | undefined;
  edgeStrength?: number | ((d?: any) => number) | undefined;
  nodeStrength?: number | ((d?: any) => number) | undefined;
  preventOverlap?: boolean;
  collideStrength?: number;
  nodeSize?: number | number[] | ((d?: any) => number) | undefined;
  nodeSpacing?: number | number[] | ((d?: any) => number) | undefined;
  alpha?: number;
  alphaDecay?: number;
  alphaMin?: number;
  clustering?: boolean;
  clusterNodeStrength?: number;
  clusterEdgeStrength?: number;
  clusterEdgeDistance?: number;
  clusterNodeSize?: number;
  clusterFociStrength?: number;
  forceSimulation?: any;
  tick?: () => void;
  onLayoutEnd?: () => void;
  workerEnabled?: boolean;
}

export interface RadialLayoutOptions {
  type: "radial";
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?: number;
  maxIteration?: number;
  focusNode?: string | Node | null;
  unitRadius?: number | null;
  preventOverlap?: boolean;
  nodeSize?: number | number[] | undefined;
  nodeSpacing?: number | Function | undefined;
  maxPreventOverlapIteration?: number;
  strictRadial?: boolean;
  sortBy?: string | undefined;
  sortStrength?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface FruchtermanGPULayoutOptions {
  type: "fruchterman-gpu";
  center?: PointTuple;
  width?: number;
  height?: number;
  maxIteration?: number;
  gravity?: number;
  speed?: number;
  clustering?: boolean;
  clusterGravity?: number;
  workerEnabled?: boolean;
  gpuEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface GForceGPULayoutOptions {
  type: "gForce-gpu";
  center?: PointTuple;
  linkDistance?: number | ((d?: any) => number) | undefined;
  nodeStrength?: number | ((d?: any) => number) | undefined;
  edgeStrength?: number | ((d?: any) => number) | undefined;
  minMovement?: number;
  maxIteration?: number;
  damping?: number;
  maxSpeed?: number;
  coulombDisScale?: number;
  getMass?: ((d?: any) => number) | undefined;
  getCenter?: ((d?: any, degree?: number) => number[]) | undefined;
  gravity?: number;
  onLayoutEnd?: () => void;
  workerEnabled?: boolean;
  gpuEnabled?: boolean;
}


export interface ForceAtlas2LayoutOptions {
  type: "forceAtlas2";
  center?: PointTuple;
  width?: number;
  height?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
  tick?: () => void;
  kr?: number;
  kg?: number;
  ks?: number;
  ksmax?: number;
  tao?: number;
  maxIteration?: number;
  mode?: 'normal' | 'linlog';
  preventOverlap?: boolean;
  dissuadeHubs?: boolean;
  barnesHut?: boolean;
  prune?: boolean;
}

export interface ERLayoutOptions {
  type: "er";
  width?: number;
  height?: number;
  nodeMinGap?: number;
}
export namespace ILayout {
  export type LayoutTypes =
    | "grid"
    | "random"
    | "force"
    | "circular"
    | "dagre"
    | "radial"
    | "concentric"
    | "mds"
    | "fruchterman"
    | "fruchterman-gpu"
    | "gForce"
    | "gForce-gpu"
    | "comboForce"
    | "forceAtlas2"
    | "er";

  export type LayoutOptions =
    | GridLayoutOptions
    | RandomLayoutOptions
    | ForceLayoutOptions
    | CircularLayoutOptions
    | DagreLayoutOptions
    | RadialLayoutOptions
    | ConcentricLayoutOptions
    | MDSLayoutOptions
    | FruchtermanLayoutOptions
    | FruchtermanGPULayoutOptions
    | GForceLayoutOptions
    | GForceGPULayoutOptions
    | ComboForceLayoutOptions
    | ComboCombinedLayoutOptions
    | ForceAtlas2LayoutOptions
    | ERLayoutOptions;
}
