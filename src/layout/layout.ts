import { getLayoutByName } from '../registy';
import { SafeAny } from './any';
import { Base } from './base';
import { CircularLayout } from './circular';
import { ComboCombinedLayout } from './comboCombined';
import { ComboForceLayout } from './comboForce';
import { ConcentricLayout } from './concentric';
import { DagreLayout } from './dagre';
import { DagreCompoundLayout } from './dagreCompound';
import { ERLayout } from './er';
import { ForceLayout } from './force';
import { ForceAtlas2Layout } from './forceAtlas2';
import { FruchtermanLayout } from './fruchterman';
import { GForceLayout } from './gForce';
import { FruchtermanGPULayout } from './gpu/fruchterman';
import { GForceGPULayout } from './gpu/gForce';
import { GridLayout } from './grid';
import { MDSLayout } from './mds';
import { RadialLayout } from './radial';
import { RandomLayout } from './random';
import { ILayout, Model } from './types';
export class Layout {
  public readonly layoutInstance: Base;

  constructor(options: ILayout.LayoutOptions) {
    const layoutClass = getLayoutByName(options.type as string);
    this.layoutInstance = new layoutClass(options);
  }

  layout(data: Model): Model {
    return this.layoutInstance.layout(data);
  }

  updateCfg(cfg: ILayout.LayoutOptions): void {
    this.layoutInstance.updateCfg(cfg);
  }

  init(data: Model): void {
    this.layoutInstance.init(data);
  }

  execute(): SafeAny {
    this.layoutInstance.execute();
  }

  getDefaultCfg(): SafeAny {
    return this.layoutInstance.getDefaultCfg();
  }

  destroy(): void {
    return this.layoutInstance.destroy();
  }
}

// FIXME
// FOR G6
// tslint:disable-next-line
export const Layouts: { [key: string]: SafeAny } = {
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
  er: ERLayout
};
