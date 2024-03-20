import { CircularLayout } from './circular';
import { ComboCombinedLayout } from './comboCombined';
import { ConcentricLayout } from './concentric';
import { D3ForceLayout } from './d3Force';
import { DagreLayout } from './dagre';
import { ForceLayout } from './force';
import { ForceAtlas2Layout } from './forceAtlas2';
import { FruchtermanLayout } from './fruchterman';
import { GridLayout } from './grid';
import { MDSLayout } from './mds';
import { RadialLayout } from './radial';
import { RandomLayout } from './random';
import type { Layout } from './types';

export const registry: Record<string, new (...args: any) => Layout<any>> = {
  circular: CircularLayout,
  concentric: ConcentricLayout,
  mds: MDSLayout,
  random: RandomLayout,
  grid: GridLayout,
  radial: RadialLayout,
  force: ForceLayout,
  d3force: D3ForceLayout,
  fruchterman: FruchtermanLayout,
  forceAtlas2: ForceAtlas2Layout,
  dagre: DagreLayout,
  comboCombined: ComboCombinedLayout,
};
