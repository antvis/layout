import { Node, Edge, Combo, Model, PointTuple } from './types'

export class Base {
  public nodes: Node[] | null = []
  public edges: Edge[] | null = []
  public combos: Combo[] | null = []
  public positions: PointTuple[] | null = []
  public destroyed: boolean = false

  public layout(data: Model) {
    this.init(data)
    this.execute()
  }

  public init(data: Model) {
    this.nodes = data.nodes || []
    this.edges = data.edges || []
    this.combos = data.combos || []
  }

  public execute() {}
  public executeWithWorker() {}
  public getDefaultCfg() {
    return {}
  }

  public updateCfg(cfg: any) {
    Object.assign(this, cfg)
  }

  public destroy() {
    this.nodes = null
    this.edges = null
    this.combos = null
    this.positions = null
    this.destroyed = true
  }
}
