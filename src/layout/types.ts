export interface Node {
  id: string
  x: number
  y: number
}

export interface Edge {
  source: string
  target: string
}

export interface Combo {}

export interface Model {
  nodes?: Node[]
  edges?: Edge[]
  combos?: Combo[]
}

export type PointTuple = [number, number]

export type IndexMap = {
  [key: string]: number
}

export type Matrix = number[]

export type Point = {
  x: number;
  y: number;
}