import { AntVDagreLayout } from './algorithm/antv-dagre';
import { CircularLayout } from './algorithm/circular';
import { ConcentricLayout } from './algorithm/concentric';
import { D3ForceLayout } from './algorithm/d3-force';
import { D3Force3DLayout } from './algorithm/d3-force-3d';
import { DagreLayout } from './algorithm/dagre';
import { FishboneLayout } from './algorithm/fishbone';
import { ForceLayout } from './algorithm/force';
import { ForceAtlas2Layout } from './algorithm/force-atlas2';
import { FruchtermanLayout } from './algorithm/fruchterman';
import { GridLayout } from './algorithm/grid';
import { IndentedLayout } from './algorithm/indented';
import { MDSLayout } from './algorithm/mds';
import { MindmapLayout } from './algorithm/mindmap';
import { RadialLayout } from './algorithm/radial';
import { RandomLayout } from './algorithm/random';

export const registry: Record<string, any> = {
  'antv-dagre': AntVDagreLayout,
  'd3-force-3d': D3Force3DLayout,
  'd3-force': D3ForceLayout,
  'force-atlas2': ForceAtlas2Layout,
  circular: CircularLayout,
  concentric: ConcentricLayout,
  dagre: DagreLayout,
  fishbone: FishboneLayout,
  force: ForceLayout,
  fruchterman: FruchtermanLayout,
  grid: GridLayout,
  indented: IndentedLayout,
  mds: MDSLayout,
  mindmap: MindmapLayout,
  radial: RadialLayout,
  random: RandomLayout,
};
