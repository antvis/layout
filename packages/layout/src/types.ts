import {
  ID,
  Edge as IEdge,
  Graph as IGraph,
  GraphView as IGraphView,
  Node as INode,
  PlainObject,
} from "@antv/graphlib";

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
  layout: any
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

/**
 * Interface for configuring a circular layout.
 */
export interface CircularLayoutOptions {
  /** The center coordinates of the circle. */
  center?: PointTuple;
  /** The width of the layout. */
  width?: number;
  /** The height of the layout. */
  height?: number;
  /** The radius of the circle. */
  radius?: number | null;
  /** The starting radius. */
  startRadius?: number | null;
  /** The ending radius. */
  endRadius?: number | null;
  /** Whether to arrange in a clockwise direction. */
  clockwise?: boolean;
  /** The number of divisions. */
  divisions?: number;
  /** The node ordering method, which can be 'topology', 'topology-directed', or 'degree'. */
  ordering?: "topology" | "topology-directed" | "degree" | null;
  /** The angle ratio. */
  angleRatio?: number;
  /** The starting angle. */
  startAngle?: number;
  /** The ending angle. */
  endAngle?: number;
  /** The spacing between nodes, which can be a function or a number. */
  nodeSpacing?: ((node?: Node) => number) | number;
  /** The size of the nodes, which can be a number, an array of numbers, or a function. */
  nodeSize?: number | number[] | ((nodeData: Node) => number);
}

/**
 * Interface for grid layout options
 */
export interface GridLayoutOptions {
  /**
   * Optional, width of the grid
   */
  width?: number;
  /**
   * Optional, height of the grid
   */
  height?: number;
  /**
   * Optional, starting point of the grid
   */
  begin?: PointTuple;
  /**
   * Optional, whether to prevent node overlap
   */
  preventOverlap?: boolean;
  /**
   * Optional, size of the node. Can be a number, an array of numbers or a function
   */
  nodeSize?: number | number[] | ((nodeData: Node) => number);
  /**
   * Optional, padding value when preventing overlap
   */
  preventOverlapPadding?: number;
  /**
   * Optional, whether to condense the grid
   */
  condense?: boolean;
  /**
   * Optional, number of rows in the grid
   */
  rows?: number;
  /**
   * Optional, number of columns in the grid
   */
  cols?: number;
  /**
   * Optional, basis for sorting
   */
  sortBy?: string;
  /**
   * Optional, function for node position
   */
  position?: (node?: Node) => { row?: number; col?: number };
  /**
   * Optional, spacing between nodes. Can be a number or a function
   */
  nodeSpacing?: ((node?: Node) => number) | number;
}

/**
 * RandomLayoutOptions interface
 * @property center - The center point of the layout
 * @property width - The width of the layout
 * @property height - The height of the layout
 */
export interface RandomLayoutOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
}

/**
 * MDSLayoutOptions interface
 * @property center - The center point of the layout
 * @property linkDistance - The distance between links in the layout
 */
export interface MDSLayoutOptions {
  center?: PointTuple;
  linkDistance?: number;
}

/** Export interface: Concentric Layout Options */
export interface ConcentricLayoutOptions {
  /** Center point */
  center?: PointTuple;
  /** Prevent overlap */
  preventOverlap?: boolean;
  /** Node size */
  nodeSize?: number | PointTuple | ((nodeData: Node) => number);
  /** Sweep angle */
  sweep?: number;
  /** Equidistant */
  equidistant?: boolean;
  /** Start angle */
  startAngle?: number;
  /** Clockwise or not */
  clockwise?: boolean;
  /** Maximum level difference */
  maxLevelDiff?: number;
  /** Sort by */
  sortBy?: string;
  /** Width */
  width?: number;
  /** Height */
  height?: number;
  /** Node spacing */
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
  | "TB"
  | "BT"
  | "LR"
  | "RL"
  | "tb"
  | "lr"
  | "rl"
  | "bt";
export type DagreAlign = "UL" | "UR" | "DL" | "DR";
/** Export interface: Dagre Layout Options */
export interface DagreLayoutOptions {
  /** Rank direction */
  rankdir?: DagreRankdir;
  /** Alignment */
  align?: DagreAlign;
  /** Begin point */
  begin?: PointTuple;
  /** Node size */
  nodeSize?: number | number[] | ((nodeData: Node) => number);
  /** Node separation */
  nodesep?: number;
  /** Rank separation */
  ranksep?: number;
  /** Control points */
  controlPoints?: boolean;
  /** Sort by combo */
  sortByCombo?: boolean;
  /** Edge label space */
  edgeLabelSpace?: boolean;
  /** Node order */
  nodeOrder?: string[];
  /** Radial layout based on dagre */
  radial?: boolean;
  /** Focus node for radial layout */
  focusNode?: ID | Node | null;
  /** Preset nodes and edges */
  preset?: {
    nodes: OutNode[];
    edges: Edge[];
  };
  /** Function for node separation */
  nodesepFunc?: (d?: Node) => number;
  /** Function for rank separation */
  ranksepFunc?: (d?: Node) => number;
}

/** Export interface: D3 Force Layout Options */
export interface D3ForceLayoutOptions {
  /** Center point */
  center?: PointTuple;
  /** Link distance */
  linkDistance?: number | ((edge?: Edge) => number);
  /** Edge strength */
  edgeStrength?: number | ((edge?: Edge) => number);
  /** Node strength */
  nodeStrength?: number | ((node?: Node) => number);
  /** Prevent overlap */
  preventOverlap?: boolean;
  /** Collide strength */
  collideStrength?: number;
  /** Node size */
  nodeSize?: number | number[] | ((node?: Node) => number);
  /** Node spacing */
  nodeSpacing?: number | number[] | ((node?: Node) => number);
  /** Alpha value */
  alpha?: number;
  /** Alpha decay rate */
  alphaDecay?: number;
  /** Minimum alpha value */
  alphaMin?: number;
  /** Clustering enabled or not */
  clustering?: boolean;
  /** Cluster node strength */
  clusterNodeStrength?: number;
  /** Cluster edge strength */
  clusterEdgeStrength?: number;
  /** Cluster edge distance */
  clusterEdgeDistance?: number;
  /** Cluster node size */
  clusterNodeSize?: number;
  /** Cluster foci strength */
  clusterFociStrength?: number;
  /** Force simulation object */
  forceSimulation?: any;
  /** On tick callback function*/
  onTick?: (data: LayoutMapping) => void;
}

export interface CentripetalOptions {
  /**
   * Force strength for leaf nodes.
   * This option specifies the strength of the centripetal force applied to leaf nodes.
   * It can be a number or a function that takes the current node, all nodes, and all edges as arguments and returns a number.
   */
  leaf?: number | ((node: Node, nodes: Node[], edges: Edge[]) => number);
  /**
   * Force strength for single nodes.
   * This option specifies the strength of the centripetal force applied to single nodes (nodes with no edges).
   * It can be a number or a function that takes the current node as an argument and returns a number.
   */
  single?: number | ((node: Node) => number);
  /**
   * Force strength for other nodes.
   * This option specifies the strength of the centripetal force applied to other nodes (nodes that are not leaf or single).
   * It can be a number or a function that takes the current node as an argument and returns a number.
   */
  others?: number | ((node: Node) => number);
  /**
   * Centri force's position and sterngth, points to the canvas center by default
   * This option specifies the position and strength of the centripetal force.
   * It can be a function that takes the current node, all nodes, all edges, canvas width, and canvas height as arguments and returns an object with x, y, z (optional), and centerStrength (optional) properties.
   */
  center?: (
    node: Node,
    nodes: Node[],
    edges: Edge[],
    width: number,
    height: number
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
  /** The number of dimensions for the force layout. */
  dimensions?: number;
  /** The center point of the force layout. */
  center?: PointTuple;
  /** The minimum movement required for the force layout to continue iterating. */
  minMovement?: number;
  /** The maximum number of iterations for the force layout. */
  maxIteration?: number;
  /** The mode for calculating the distance threshold for the force layout. */
  distanceThresholdMode?: "mean" | "max" | "min";

  /**
   * If distance is specified, sets the maximum distance between nodes over which this force is considered.
   * If distance is not specified, returns the current maximum distance, which defaults to infinity.
   * Specifying a finite maximum distance improves performance and produces a more localized layout.
   */
  maxDistance?: number;
}
export interface ForceLayoutOptions extends CommonForceLayoutOptions {
  /** The width of the force layout. */
  width?: number;
  /** The height of the force layout. */
  height?: number;
  /** The distance between linked nodes in the force layout. */
  linkDistance?: number | ((edge?: Edge, source?: any, target?: any) => number);
  /** The strength of the force applied to nodes in the force layout. */
  nodeStrength?: number | ((d?: Node) => number);
  /** The strength of the force applied to edges in the force layout. */
  edgeStrength?: number | ((d?: Edge) => number);
  /** Whether or not to prevent node overlap in the force layout. */
  preventOverlap?: boolean;
  /** The size of nodes in the force layout. */
  nodeSize?: number | number[] | ((d?: Node) => number);
  /** The spacing between nodes in the force layout. */
  nodeSpacing?: number | ((d?: Node) => number);
  /** The damping factor for the force layout. */
  damping?: number;
  /** The maximum speed for nodes in the force layout. */
  maxSpeed?: number;
  /** The scale factor for the Coulomb force in the force layout. */
  coulombDisScale?: number;
  /** The strength of the gravity force in the force layout. */
  gravity?: number;
  /** A factor used to adjust various parameters in the force layout. */
  factor?: number;
  /** The interval between iterations of the force layout. */
  interval?: number;
  /** Options for centripetal forces in the force layout. */
  centripetalOptions?: CentripetalOptions;
  /** Whether or not to use leaf clustering in the force layout. */
  leafCluster?: boolean;
  /** Whether or not to use clustering in the force layout. */
  clustering?: boolean;
  /** The property used to cluster nodes by in the force layout. */
  nodeClusterBy?: string;
  /** The strength of the cluster node forces in the force layout. */
  clusterNodeStrength?: number | ((node: Node) => number);
  /** The strength of collision forces in the force layout. */
  collideStrength?: number;
  /** A callback function called on each tick of the force layout. */
  onTick?: (data: LayoutMapping) => void;
  /** A function used to calculate the mass of nodes in the force layout. */
  getMass?: (node?: Node) => number;
  /** A function used to calculate the center point of nodes in the force layout. */
  getCenter?: (node?: Node, degree?: number) => number[];

  monitor?: (params: {
    energy: number;
    nodes: Node[];
    edges: Edge[];
    iterations: number;
  }) => void;
}
export interface ForceAtlas2LayoutOptions extends CommonForceLayoutOptions {
  /** The width of the force layout. */
  width?: number;
  /** The height of the force layout. */
  height?: number;
  /** The repulsion constant for the force layout. */
  kr?: number;
  /** The gravity constant for the force layout. */
  kg?: number;
  /** The scaling factor for the force layout. */
  ks?: number;
  /** The maximum scaling factor for the force layout. */
  ksmax?: number;
  /** The cooling factor for the force layout. */
  tao?: number;
  /** The mode for calculating forces in the force layout. */
  mode?: "normal" | "linlog";
  /** Whether or not to prevent node overlap in the force layout. */
  preventOverlap?: boolean;
  /** Whether or not to dissuade hubs in the force layout. */
  dissuadeHubs?: boolean;
  /** Whether or not to use the Barnes-Hut algorithm in the force layout. */
  barnesHut?: boolean;
  /** Whether or not to prune nodes in the force layout. */
  prune?: boolean;
  /** The size of nodes in the force layout. */
  nodeSize?: number | number[] | ((node?: Node) => number);

  /** A callback function called on each tick of the force layout. */
  onTick?: (data: LayoutMapping) => void;
}

export interface FruchtermanLayoutOptions extends CommonForceLayoutOptions {
  /** The width of the force layout. */
  width?: number;
  /** The height of the force layout. */
  height?: number;
  /** The strength of the gravity force in the force layout. */
  gravity?: number;
  /** The speed of the force layout. */
  speed?: number;
  /** Whether or not to use clustering in the force layout. */
  clustering?: boolean;
  /** The strength of the cluster gravity force in the force layout. */
  clusterGravity?: number;
  /** The property used to cluster nodes by in the force layout. */
  nodeClusterBy?: string;

  /** A callback function called on each tick of the force layout. */
  onTick?: (data: LayoutMapping) => void;
}
