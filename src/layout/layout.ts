import { Base } from './base'
import { Model } from './types'
import { GridLayout } from './grid'
import { RandomLayout } from './random'
import { GForceLayout } from './g-force'
import { ForceLayout } from './force'
import { CircularLayout } from './circular'
import { DagreLayout } from './dagre'
import { RadialLayout } from './radial'
import { registLayout, getLayoutByName } from '../registy'

export class Layout {
  public readonly layoutInstance: Base

  constructor(options: Layout.LayoutOptions) {
    const layoutClass = getLayoutByName(options.type)
    this.layoutInstance  = new layoutClass(options)
  }

  layout(data: Model) {
    return this.layoutInstance.layout(data)
  }

  updateCfg(cfg: Layout.LayoutOptions) {
    this.layoutInstance.updateCfg(cfg)
  }

  init(data: Model) {
    this.layoutInstance.init(data)
  }

  execute() {
    this.layoutInstance.execute()
  }

  getDefaultCfg() {
    return this.layoutInstance.getDefaultCfg()
  }

  destroy() {
    return this.layoutInstance.destroy()
  }
}

// FIXME
// FOR G6
export const Layouts: {[key: string]: any} = new Proxy({}, { // tslint:disable-line
  get: (target, propKey) => {
    return getLayoutByName(propKey as string)
  },
  set: (target, propKey, value) => {
    registLayout(propKey as string, value)
    return true
  }
})

export namespace Layout {
  registLayout('grid', GridLayout)
  registLayout('random', RandomLayout)
  registLayout('gForce', GForceLayout)
  registLayout('force', ForceLayout)
  registLayout('circular', CircularLayout)
  registLayout('dagre', DagreLayout)
  registLayout('radial', RadialLayout)

  export type LayoutTypes =
    | 'grid'
    | 'random'
    | 'gForce'
    | 'force'
    | 'circular'
    | 'dagre'
    | 'radial'

  export type LayoutOptions =
    | GridLayout.GridLayoutOptions
    | RandomLayout.RandomLayoutOptions
    | GForceLayout.GForceLayoutOptions
    | ForceLayout.ForceLayoutOptions
    | CircularLayout.CircularLayoutOptions
    | DagreLayout.DagreLayoutOptions
    | RadialLayout.RadialLayoutOptions
}