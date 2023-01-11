import { CircularLayout } from "./circular";
import { ConcentricLayout } from "./concentric";
import { D3ForceLayout } from "./d3Force";
import { ForceLayout } from "./force";
import { GridLayout } from "./grid";
import { MDSLayout } from "./mds";
import { RadialLayout } from "./radial";
import { RandomLayout } from "./random";
import type { SyncLayoutConstructor } from "./types";

export const registry: Record<string, SyncLayoutConstructor<any>> = {
  circular: CircularLayout,
  concentric: ConcentricLayout,
  mds: MDSLayout,
  random: RandomLayout,
  grid: GridLayout,
  radial: RadialLayout,
  force: ForceLayout,
  d3force: D3ForceLayout,
};
export function registerLayout(id: string, layout: SyncLayoutConstructor<any>) {
  registry[id] = layout;
}
