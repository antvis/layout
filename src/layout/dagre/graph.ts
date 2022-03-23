import { Graph as RawGraph } from "@antv/graphlib";

export class Graph extends RawGraph<
  string,
  Node<Record<string, any>> & NodeConfig,
  Partial<EdgeConfig & Edge & GraphEdge>,
  Partial<GraphLabel>
> {}

export interface GraphLabel {
  width?: number | undefined;
  height?: number | undefined;
  compound?: boolean | undefined;
  rankdir?: string | undefined;
  align?: string | undefined;
  nodesep?: number | undefined;
  edgesep?: number | undefined;
  ranksep?: number | undefined;
  marginx?: number | undefined;
  marginy?: number | undefined;
  acyclicer?: string | undefined;
  ranker?: string | undefined;
  maxRank?: number;
  nestingRoot?: string;
  nodeRankFactor?: number;
  dummyChains?: string[];
  root?: string;
}

export interface NodeConfig {
  width?: number | undefined;
  height?: number | undefined;
}

export interface EdgeConfig {
  minlen?: number | undefined;
  weight?: number | undefined;
  width?: number | undefined;
  height?: number | undefined;
  lablepos?: "l" | "c" | "r" | undefined;
  labeloffest?: number | undefined;
}

export interface CustomConfig {
  edgeLabelSpace?: boolean | undefined;
  keepNodeOrder?: boolean | undefined;
  nodeOrder?: string[] | undefined;
  prevGraph?: Graph | undefined;
}

export type layout = (
  graph: Graph,
  layout?: GraphLabel & NodeConfig & EdgeConfig & CustomConfig
) => void;

export interface Edge {
  v: string;
  w: string;
  name?: string | undefined;
  label?: any;
  e?: any;
}

export interface GraphEdge {
  points: { x: number; y: number }[];
  [key: string]: any;
}

export type Node<T = {}> = T & {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  class?: string | undefined;
  label?: any;
  padding?: number | undefined;
  paddingX?: number | undefined;
  paddingY?: number | undefined;
  rx?: number | undefined;
  ry?: number | undefined;
  shape?: string | undefined;
  order?: number;
  rank?: number;
  in?: number;
  out?: number;
  fixorder?: number;
  _order?: number;
  _rank?: number;
  dummy?: string;
  selfEdges?: any;
  borderTop?: any;
  borderBottom?: any;
  borderLeft?: any;
  borderRight?: any;
  minRank?: number;
  maxRank?: number;
  layer?: number;
  edgeLabel?: any;
  edgeObj?: Edge;
  borderType?: string;
  labelpos?: string;
  parent?: string;
  lim?: number;
};
