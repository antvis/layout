import {
  GridLayout,
  RandomLayout,
  GForceLayout,
  ForceLayout,
  CircularLayout,
  DagreLayout,
  RadialLayout
} from './layout'

const map: Map<string, any> = new Map()

export const registLayout = (name: string, customClass: any) => {
  if (map.get(name)) {
    throw new Error('already have a layout with the same name')
  }
  map.set(name, customClass)
}

export const unRegistLayout = (name: string) => {
  if (map.has(name)) {
    map.delete(name)
  }
}

export const getLayoutByName = (name: string) => {
  if (map.has(name)) {
    return map.get(name)
  }
  return null
}

registLayout('grid', GridLayout)
registLayout('random', RandomLayout)
registLayout('gForce', GForceLayout)
registLayout('force', ForceLayout)
registLayout('circular', CircularLayout)
registLayout('dagre', DagreLayout)
registLayout('radial', RadialLayout)

export type LayoutOptions =
  | GridLayout.GridLayoutOptions
  | RandomLayout.RandomLayoutOptions
  | GForceLayout.GForceLayoutOptions
  | ForceLayout.ForceLayoutOptions
  | CircularLayout.CircularLayoutOptions
  | DagreLayout.DagreLayoutOptions
  | RadialLayout.RadialLayoutOptions
