export interface Node {
  id: string
}

export interface OutNode extends Node {
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

export interface OutModel extends Model{
  nodes?: OutNode[]
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