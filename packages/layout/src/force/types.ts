
export interface CalcNode {
  id: string,
  data: {
    x: number,
    y: number,
    mass: number,
    nodeStrength: number,
    size: number
  }
}

export interface CalcEdge {
  source: string,
  target: string,
  data: {
    linkDistance: number,
    edgeStrength: number
  }
}