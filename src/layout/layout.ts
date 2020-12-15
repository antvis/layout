import { Base } from './base'
import { Model } from './types'
import { GridLayout } from './grid'
import { RandomLayout } from './random'
import { GForceLayout } from './gForce'
import { ForceLayout } from './force'
import { CircularLayout } from './circular'
import { DagreLayout } from './dagre'
import { RadialLayout } from './radial'
import { registerLayout, getLayoutByName } from '../registy'
import { ConcentricLayout } from './concentric'
import { MDSLayout } from './mds'
import { FruchtermanLayout } from './fruchterman'
import { FruchtermanGPULayout } from './gpu/fruchterman'
import { GForceGPULayout } from './gpu/gForce'
import { ComboForceLayout } from './comboForce'

export class Layout {
  public readonly layoutInstance: Base

  constructor(options: ILayout.LayoutOptions) {
    const layoutClass = getLayoutByName(options.type)
    this.layoutInstance  = new layoutClass(options)
  }

  layout(data: Model) {
    return this.layoutInstance.layout(data)
  }

  updateCfg(cfg: ILayout.LayoutOptions) {
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
    registerLayout(propKey as string, value)
    return true
  }
})

export namespace ILayout {
  registerLayout('grid', GridLayout)
  registerLayout('random', RandomLayout)
  registerLayout('force', ForceLayout)
  registerLayout('circular', CircularLayout)
  registerLayout('dagre', DagreLayout)
  registerLayout('radial', RadialLayout)
  registerLayout('concentric', ConcentricLayout)
  registerLayout('mds', MDSLayout)
  registerLayout('fruchterman', FruchtermanLayout)
  registerLayout('fruchterman-gpu', FruchtermanGPULayout)
  registerLayout('gForce', GForceLayout)
  registerLayout('gForce-gpu', GForceGPULayout)
  registerLayout('comboForce', ComboForceLayout)

  export type LayoutTypes =
    | 'grid'
    | 'random'
    | 'force'
    | 'circular'
    | 'dagre'
    | 'radial'
    | 'concentric'
    | 'mds'
    | 'fruchterman'
    | 'fruchterman-gpu'
    | 'gForce'
    | 'gForce-gpu'
    | 'comboForce'

  export type LayoutOptions =
    | GridLayout.GridLayoutOptions
    | RandomLayout.RandomLayoutOptions
    | ForceLayout.ForceLayoutOptions
    | CircularLayout.CircularLayoutOptions
    | DagreLayout.DagreLayoutOptions
    | RadialLayout.RadialLayoutOptions
    | ConcentricLayout.ConcentricLayoutOptions
    | MDSLayout.MDSLayoutOptions
    | FruchtermanLayout.FruchtermanLayoutOptions
    | FruchtermanGPULayout.FruchtermanGPULayoutOptions
    | GForceLayout.GForceLayoutOptions
    | GForceGPULayout.GForceGPULayoutOptions
    | ComboForceLayout.ComboForceLayoutOptions
}