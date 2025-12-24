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
  'antv-dagre': AntVDagreLayout,
  'd3-force-3d': D3Force3DLayout,
  'd3-force': D3ForceLayout,
  'force-atlas2': ForceAtlas2Layout,
  circular: CircularLayout,
  concentric: ConcentricLayout,
  dagre: DagreLayout,
  force: ForceLayout,
  fruchterman: FruchtermanLayout,
  grid: GridLayout,
  mds: MDSLayout,
  radial: RadialLayout,
  random: RandomLayout,
};
