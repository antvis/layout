import {
  Edge as IEdge,
  Graph as IGraph,
  GraphView as IGraphView,
  ID,
  Node as INode,
  PlainObject,
} from '@antv/graphlib';

export interface NodeData extends PlainObject {
  size?: number | number[];
  bboxSize?: number[];
  borderLeft?: ID | ID[];
  borderRight?: ID | ID[];
  x?: number;
  y?: number;
  z?: number;
  height?: number;
  width?: number;
  e?: IEdge<EdgeData>;
  selfEdges?: IEdge<EdgeData>[];
  rank?: number;
  _rank?: number;
  order?: number;
  fixorder?: number;
  minRank?: number;
  maxRank?: number;
  layout?: boolean;
  layer?: number;
  low?: number;
  lim?: number;
}

export interface OutNodeData extends NodeData {
  x: number;
  y: number;
  z?: number;
}

export interface EdgeData extends PlainObject {
  // temp edges e.g. the edge generated for releated collapsed combo
  virtual?: boolean;
  weight?: number;
  x?: number;
  y?: number;
  height?: number;
  width?: number;
  points?: Point[];
  controlPoints?: Point[];
  minlen?: number;
  cutvalue?: number;
  labeloffset?: number;
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
export type GraphView = IGraphView<NodeData, EdgeData>;

export type PointTuple = [number, number] | [number, number, number];
export type Point = { x: number; y: number; z?: number };
export type Matrix = number[];
export type LayoutMapping = { nodes: OutNode[]; edges: Edge[] };

export interface Layout<LayoutOptions> {
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: LayoutOptions): Promise<void>;
  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: LayoutOptions): Promise<LayoutMapping>;
  /**
   * Layout options, can be changed in runtime.
   */
  options: LayoutOptions;
  /**
   * Unique ID, it will get registered and used on the webworker-side.
   */
  id: string;
}

export function isLayoutWithIterations(
  layout: any,
): layout is LayoutWithIterations<any> {
  return !!layout.tick && !!layout.stop;
}

export interface LayoutWithIterations<LayoutOptions>
  extends Layout<LayoutOptions> {
  /**
   * Some layout algorithm has n iterations so that the simulation needs to be stopped at any time.
   * This method is useful for running the simulation manually.
   * @see https://github.com/d3/d3-force#simulation_stop
   */
  stop: () => void;

  /**
   * Manually steps the simulation by the specified number of iterations.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick: (iterations?: number) => LayoutMapping;
}

export interface LayoutConstructor<LayoutOptions> {
  new (options?: LayoutOptions): Layout<LayoutOptions>;
}

export interface LayoutSupervisor {
  execute(): Promise<LayoutMapping>;
  stop(): void;
  kill(): void;
  isRunning(): boolean;
}

export interface CircularLayoutOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  radius?: number | null;
  startRadius?: number | null;
  endRadius?: number | null;
  clockwise?: boolean;
  divisions?: number;
  ordering?: 'topology' | 'topology-directed' | 'degree' | null;
  angleRatio?: number;
  startAngle?: number;
  endAngle?: number;
  nodeSpacing?: ((node?: Node) => number) | number;
  nodeSize?: number | number[] | ((nodeData: Node) => number);
}

export interface GridLayoutOptions {
  width?: number;
  height?: number;
  begin?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | number[] | ((nodeData: Node) => number);
  preventOverlapPadding?: number;
  condense?: boolean;
  rows?: number;
  cols?: number;
  sortBy?: string;
  position?: (node?: Node) => { row?: number; col?: number };
  nodeSpacing?: ((node?: Node) => number) | number;
}

export interface RandomLayoutOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
}

export interface MDSLayoutOptions {
  center?: PointTuple;
  linkDistance?: number;
}

export interface ConcentricLayoutOptions {
  center?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | PointTuple | ((nodeData: Node) => number);
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

export interface RadialLayoutOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?: number;
  maxIteration?: number;
  focusNode?: string | Node | null;
  unitRadius?: number | null;
  preventOverlap?: boolean;
  nodeSize?: number | number[] | ((nodeData: Node) => number);
  nodeSpacing?: number | Function;
  maxPreventOverlapIteration?: number;
  strictRadial?: boolean;
  sortBy?: string;
  sortStrength?: number;
}

export type DagreRankdir =
  | 'TB'
  | 'BT'
  | 'LR'
  | 'RL'
  | 'tb'
  | 'lr'
  | 'rl'
  | 'bt';
export type DagreAlign = 'UL' | 'UR' | 'DL' | 'DR';

export interface DagreLayoutOptions {
  rankdir?: DagreRankdir;
  ranker?: 'network-simplex' | 'tight-tree' | 'longest-path';
  align?: DagreAlign;
  begin?: PointTuple;
  nodeSize?: number | number[] | ((nodeData: Node) => number);
  nodesep?: number;
  ranksep?: number;
  controlPoints?: boolean;
  sortByCombo?: boolean;
  edgeLabelSpace?: boolean;
  nodeOrder?: string[];
  radial?: boolean; // 是否基于 dagre 进行辐射布局
  focusNode?: ID | Node | null; // radial 为 true 时生效，关注的节点
  preset?: OutNode[];
  nodesepFunc?: (d?: Node) => number;
  ranksepFunc?: (d?: Node) => number;
}

export interface D3ForceLayoutOptions {
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
    height: number,
  ) => {
    x: number;
    y: number;
    z?: number;
    centerStrength?: number;
  };
}

export interface ComboCombinedLayoutOptions {
  center?: PointTuple;
  nodeSize?: number | number[] | ((d?: Node) => number);
  spacing?: number | ((d?: Node) => number);
  outerLayout?: Layout<any>;
  innerLayout?: Layout<any>;
  comboPadding?: ((d?: unknown) => number) | number | number[] | undefined;
  treeKey?: string;
}

interface CommonForceLayoutOptions {
  dimensions?: number;
  center?: PointTuple;
  minMovement?: number;
  maxIteration?: number;
  distanceThresholdMode?: 'mean' | 'max' | 'min';

  /**
   * If distance is specified, sets the maximum distance between nodes over which this force is considered.
   * If distance is not specified, returns the current maximum distance, which defaults to infinity.
   * Specifying a finite maximum distance improves performance and produces a more localized layout.
   */
  maxDistance?: number;
}

export interface ForceLayoutOptions extends CommonForceLayoutOptions {
  width?: number;
  height?: number;
  linkDistance?: number | ((edge?: Edge, source?: any, target?: any) => number);
  nodeStrength?: number | ((d?: Node) => number);
  edgeStrength?: number | ((d?: Edge) => number);
  preventOverlap?: boolean;
  nodeSize?: number | number[] | ((d?: Node) => number);
  nodeSpacing?: number | ((d?: Node) => number);
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
  onTick?: (data: LayoutMapping) => void;
  getMass?: (node?: Node) => number;
  getCenter?: (node?: Node, degree?: number) => number[];
  monitor?: (params: {
    energy: number;
    nodes: Node[];
    edges: Edge[];
    iterations: number;
  }) => void;
}

export interface ForceAtlas2LayoutOptions extends CommonForceLayoutOptions {
  width?: number;
  height?: number;
  kr?: number;
  kg?: number;
  ks?: number;
  ksmax?: number;
  tao?: number;
  mode?: 'normal' | 'linlog';
  preventOverlap?: boolean;
  dissuadeHubs?: boolean;
  barnesHut?: boolean;
  prune?: boolean;
  nodeSize?: number | number[] | ((node?: Node) => number);
  onTick?: (data: LayoutMapping) => void;
}
export interface FruchtermanLayoutOptions extends CommonForceLayoutOptions {
  width?: number;
  height?: number;
  gravity?: number;
  speed?: number;
  clustering?: boolean;
  clusterGravity?: number;
  nodeClusterBy?: string;
  onTick?: (data: LayoutMapping) => void;
}
