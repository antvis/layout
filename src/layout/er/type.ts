export interface INode {
  id: string;
  label: string;
  size: number[];
  dx?: number;
  dy?: number;
  x?: number;
  y?: number;
  sizeTemp?: number[];
}

export interface IMysqlNode {
  id: string;
  size: number[];
  x: number;
  y: number;
}

export interface IEdge {
  source: string;
  target: string;
}

export interface IEdgeInfo {
  source: INode;
  target: INode;
}

export interface ICell {
  dx?: number;
  dy?: number;
  x: number;
  y: number;
  occupied: boolean;
  node?: {
    id: string,
    size: number[],
  } | null;
}