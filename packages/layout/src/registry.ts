import { AntVDagreLayout } from './antv-dagre';
import { CircularLayout } from './circular';
import { ConcentricLayout } from './concentric';
import { D3ForceLayout } from './d3-force';
import { D3Force3DLayout } from './d3-force-3d';
import { DagreLayout } from './dagre';
import { ForceLayout } from './force';
import { ForceAtlas2Layout } from './force-atlas2';
import { FruchtermanLayout } from './fruchterman';
import { GridLayout } from './grid';
import { MDSLayout } from './mds';
import { RadialLayout } from './radial';
import { RandomLayout } from './random';

export const registry: Record<string, any> = {
  'd3-force-3d': D3Force3DLayout,
  antvDagre: AntVDagreLayout,
  circular: CircularLayout,
  concentric: ConcentricLayout,
  d3force: D3ForceLayout,
  dagre: DagreLayout,
  force: ForceLayout,
  forceAtlas2: ForceAtlas2Layout,
  fruchterman: FruchtermanLayout,
  grid: GridLayout,
  mds: MDSLayout,
  radial: RadialLayout,
  random: RandomLayout,
};
