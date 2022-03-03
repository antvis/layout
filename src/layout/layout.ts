import { Base } from "./base";
import { Model, ILayout } from "./types";
import { getLayoutByName } from "../registy";
import { GridLayout } from "./grid";
import { RandomLayout } from "./random";
import { GForceLayout } from "./gForce";
import { ForceLayout } from "./force";
import { CircularLayout } from "./circular";
import { DagreLayout } from "./dagre";
import { RadialLayout } from "./radial";
import { ConcentricLayout } from "./concentric";
import { MDSLayout } from "./mds";
import { FruchtermanLayout } from "./fruchterman";
import { FruchtermanGPULayout } from "./gpu/fruchterman";
import { GForceGPULayout } from "./gpu/gForce";
import { ComboForceLayout } from "./comboForce";
import { ComboCombinedLayout } from "./comboCombined";
import { ForceAtlas2Layout } from "./forceAtlas2";
import { ERLayout } from "./er";
import { DagreCompoundLayout } from "./dagreCompound";
export class Layout {
  public readonly layoutInstance: Base;

  constructor(options: ILayout.LayoutOptions) {
    const layoutClass = getLayoutByName(options.type as string);
    this.layoutInstance = new layoutClass(options);
  }

  layout(data: Model) {
    return this.layoutInstance.layout(data);
  }

  updateCfg(cfg: ILayout.LayoutOptions) {
    this.layoutInstance.updateCfg(cfg);
  }

  init(data: Model) {
    this.layoutInstance.init(data);
  }

  execute() {
    this.layoutInstance.execute();
  }

  getDefaultCfg() {
    return this.layoutInstance.getDefaultCfg();
  }

  destroy() {
    return this.layoutInstance.destroy();
  }
}

// FIXME
// FOR G6
// tslint:disable-next-line
export const Layouts: { [key: string]: any } = {
  force: ForceLayout,
  fruchterman: FruchtermanLayout,
  forceAtlas2: ForceAtlas2Layout,
  gForce: GForceLayout,
  dagre: DagreLayout,
  dagreCompound: DagreCompoundLayout,
  circular: CircularLayout,
  radial: RadialLayout,
  concentric: ConcentricLayout,
  grid: GridLayout,
  mds: MDSLayout,
  comboForce: ComboForceLayout,
  comboCombined: ComboCombinedLayout,
  random: RandomLayout,
  'gForce-gpu': GForceGPULayout,
  'fruchterman-gpu': FruchtermanGPULayout,
  er: ERLayout,
};
