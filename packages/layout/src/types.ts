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

export interface Layout<LayoutOptions> {
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph, options?: LayoutOptions): void;
  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph, options?: LayoutOptions): LayoutMapping;
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
  layout: any
): layout is LayoutWithIterations<any> {
  return !!layout.tick && !!layout.stop && !!layout.restart;
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
   * Restarts the simulation’s internal timer and returns the simulation.
   * @see https://github.com/d3/d3-force#simulation_restart
   */
  restart: () => void;

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
  position?: ((node?: Node) => { row?: number; col?: number }) | undefined;
  nodeSpacing?: ((node?: Node) => number) | number | undefined;
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
  minNodeSpacing?: number;
  sweep?: number;
  equidistant?: boolean;
  startAngle?: number;
  clockwise?: boolean;
  maxLevelDiff?: number;
  sortBy?: string;
  width?: number;
  height?: number;
  nodeSpacing?: number | number[] | ((node?: Node) => number) | undefined;
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
  nodeSize?: number | number[] | undefined;
  nodeSpacing?: number | Function | undefined;
  maxPreventOverlapIteration?: number;
  strictRadial?: boolean;
  sortBy?: string | undefined;
  sortStrength?: number;
}

export interface DagreLayoutOptions extends CommonOptions {
  rankdir?: "TB" | "BT" | "LR" | "RL";
  align?: "UL" | "UR" | "DL" | "DR";
  begin?: PointTuple;
  nodeSize?: number | number[] | undefined;
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
  nodesepFunc?: ((d?: Node) => number) | undefined;
  ranksepFunc?: ((d?: Node) => number) | undefined;
}

export interface D3ForceLayoutOptions extends CommonOptions {
  center?: PointTuple;
  linkDistance?: number | ((edge?: Edge) => number) | undefined;
  edgeStrength?: number | ((edge?: Edge) => number) | undefined;
  nodeStrength?:
    | number
    | ((node: Node, i: number, nodes: Node[]) => number)
    | undefined;
  preventOverlap?: boolean;
  collideStrength?: number;
  nodeSize?: number | number[] | ((node?: Node) => number) | undefined;
  nodeSpacing?: number | number[] | ((node?: Node) => number) | undefined;
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
    | ((edge?: Edge, source?: any, target?: any) => number)
    | undefined;
  nodeStrength?: number | ((d?: Node) => number) | undefined;
  edgeStrength?: number | ((d?: Edge) => number) | undefined;
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
  onTick?: (data: LayoutMapping) => void;
  getMass?: ((d: Node) => number) | undefined;
  getCenter?: ((d?: Node, degree?: number) => number[]) | undefined;
  monitor?: (params: {
    energy: number;
    nodes: Node[];
    edges: Edge[];
    iterations: number;
  }) => void;
}

export interface FruchtermanLayoutOptions extends CommonOptions {
  center?: PointTuple;
  maxIteration?: number;
  width?: number;
  height?: number;
  gravity?: number;
  speed?: number;
  clustering?: boolean;
  clusterGravity?: number;
  nodeClusterBy?: string;
  onTick?: (data: LayoutMapping) => void;
}
