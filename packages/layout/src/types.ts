import {
  Graph as IGraph,
  Node as INode,
  Edge as IEdge,
  PlainObject,
} from "@antv/graphlib";

export interface NodeData extends PlainObject {
  visible?: boolean;
  size?: number | number[];
  bboxSize?: number[];
}

export interface OutNodeData extends NodeData {
  x: number;
  y: number;
}

export interface EdgeData extends PlainObject {
  visible?: boolean;
  // temp edges e.g. the edge generated for releated collapsed combo
  virtual?: boolean;
}

/** input node */
export type Node = INode<NodeData>;
/** output node */
export type OutNode = INode<OutNodeData>;
/** input and output edge */
export type Edge = IEdge<EdgeData>;

export type Degree = {
  in: number;
  out: number;
  all: number;
};

// maps node's id and its index in the nodes array
export type IndexMap = {
  [nodeId: string]: number;
};

export type Graph = IGraph<NodeData, EdgeData>;

export type PointTuple = [number, number];
export type Point = { x: number; y: number };
export type Matrix = number[];
export type LayoutMapping = { nodes: OutNode[]; edges: Edge[] };

export interface SyncLayout<LayoutOptions> {
  assign(graph: Graph, options?: LayoutOptions): void;
  execute(graph: Graph, options?: LayoutOptions): LayoutMapping;
  options: LayoutOptions;
  id: string;
}

export interface SyncLayoutConstructor<LayoutOptions> {
  new (options?: LayoutOptions): SyncLayout<LayoutOptions>;
}

export interface LayoutSupervisor {
  start(): void;
  stop(): void;
  kill(): void;
  isRunning(): boolean;
}

// most layout options extends CommonOptions
interface CommonOptions {
  // whether take the invisible nodes and edges into calculation, false by default
  layoutInvisibles?: boolean;
  onLayoutEnd?: (data: LayoutMapping) => void;
}

export interface CircularLayoutOptions extends CommonOptions {
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
  startAngle?: number;
  endAngle?: number;
  nodeSpacing?: ((node?: Node) => number) | number;
  nodeSize?: number | number[];
}

export interface GridLayoutOptions extends CommonOptions {
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
  position?: (node?: Node) => { row?: number; col?: number };
  nodeSpacing?: ((node?: Node) => number) | number;
}

export interface RandomLayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
}

export interface MDSLayoutOptions extends CommonOptions {
  center?: PointTuple;
  linkDistance?: number;
}

export interface ConcentricLayoutOptions extends CommonOptions {
  center?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | PointTuple;
  sweep?: number;
  equidistant?: boolean;
  startAngle?: number;
  clockwise?: boolean;
  maxLevelDiff?: number;
  sortBy?: string;
  width?: number;
  height?: number;
  nodeSpacing?: number | number[] | ((node?: Node) => number);
}

export interface RadialLayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?: number;
  maxIteration?: number;
  focusNode?: string | Node | null;
  unitRadius?: number | null;
  preventOverlap?: boolean;
  nodeSize?: number | number[];
  nodeSpacing?: number | Function;
  maxPreventOverlapIteration?: number;
  strictRadial?: boolean;
  sortBy?: string;
  sortStrength?: number;
}

export interface DagreLayoutOptions extends CommonOptions {
  rankdir?: "TB" | "BT" | "LR" | "RL";
  align?: "UL" | "UR" | "DL" | "DR";
  begin?: PointTuple;
  nodeSize?: number | number[];
  nodesep?: number;
  ranksep?: number;
  controlPoints?: boolean;
  sortByCombo?: boolean;
  edgeLabelSpace?: boolean;
  nodeOrder?: string[];
  radial?: boolean; // 是否基于 dagre 进行辐射布局
  focusNode: string | Node | null; // radial 为 true 时生效，关注的节点
  preset?: {
    nodes: OutNode[];
    edges: Edge[];
  };
  nodesepFunc?: ((d?: Node) => number);
  ranksepFunc?: ((d?: Node) => number);
}

export interface D3ForceLayoutOptions extends CommonOptions {
  center?: PointTuple;
  linkDistance?: number | ((edge?: Edge) => number);
  edgeStrength?: number | ((edge?: Edge) => number);
  nodeStrength?: number | ((node?: Node) => number);
  preventOverlap?: boolean;
  collideStrength?: number;
  nodeSize?: number | number[] | ((node?: Node) => number);
  nodeSpacing?: number | number[] | ((node?: Node) => number);
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
  onTick?: (data: LayoutMapping) => void;
}

export interface CentripetalOptions {
  /** Force strength for leaf nodes. */
  leaf?: number | ((node: Node, nodes: Node[], edges: Edge[]) => number);
  /** Force strength for single nodes. */
  single?: number | ((node: Node) => number);
  /** Force strength for other nodes. */
  others?: number | ((node: Node) => number);
  /** Centri force's position and sterngth, points to the canvas center by default */
  center?: (
    node: Node,
    nodes: Node[],
    edges: Edge[],
    width: number,
    height: number
  ) => {
    x: number;
    y: number;
    centerStrength?: number;
  };
}
export interface ForceLayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?:
    | number
    | ((edge?: Edge, source?: any, target?: any) => number);
  nodeStrength?: number | ((d?: Node) => number);
  edgeStrength?: number | ((d?: Edge) => number);
  preventOverlap?: boolean;
  nodeSize?: number | number[] | ((d?: Node) => number);
  nodeSpacing?: number | ((d?: Node) => number);
  minMovement?: number;
  maxIteration?: number;
  damping?: number;
  maxSpeed?: number;
  coulombDisScale?: number;
  gravity?: number;
  factor?: number;
  interval?: number;
  centripetalOptions?: CentripetalOptions;
  leafCluster?: boolean;
  clustering?: boolean;
  nodeClusterBy?: string;
  clusterNodeStrength?: number | ((node: Node) => number);
  collideStrength?: number;
  distanceThresholdMode?: "mean" | "max" | "min";
  animate?: boolean; // TODO: comfirm the tick way with worker
  onTick?: (data: LayoutMapping) => void;
  getMass?: ((node?: Node) => number);
  getCenter?: ((node?: Node, degree?: number) => number[]);
  monitor?: (params: {
    energy: number;
    nodes: Node[];
    edges: Edge[];
    iterations: number;
  }) => void;
}

export interface ForceAtlas2LayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
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
  nodeSize?: number | number[] | ((node?: Node) => number);
  onTick?: (data: LayoutMapping) => void;
}