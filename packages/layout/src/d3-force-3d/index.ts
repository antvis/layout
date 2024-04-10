import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  forceX,
  forceY,
  forceZ,
} from 'd3-force-3d';
import { D3ForceLayout } from '../d3-force';
import type { LayoutWithIterations } from '../types';
import type { D3Force3DLayoutOptions } from './types';

export class D3Force3DLayout
  extends D3ForceLayout<D3Force3DLayoutOptions>
  implements LayoutWithIterations<D3Force3DLayoutOptions>
{
  public id = 'd3-force-3d';

  protected config = {
    inputNodeAttrs: ['x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz'],
    outputNodeAttrs: ['x', 'y', 'z', 'vx', 'vy', 'vz'],
    simulationAttrs: [
      'alpha',
      'alphaMin',
      'alphaDecay',
      'alphaTarget',
      'velocityDecay',
      'randomSource',
      'numDimensions',
    ],
  };

  protected forceMap = {
    link: forceLink,
    manyBody: forceManyBody,
    center: forceCenter,
    collide: forceCollide,
    radial: forceRadial,
    x: forceX,
    y: forceY,
    z: forceZ,
  };

  public options: Partial<D3Force3DLayoutOptions> = {
    numDimensions: 3,
    link: {
      id: (edge) => edge.id,
    },
    manyBody: {},
    center: {
      x: 0,
      y: 0,
      z: 0,
    },
  };

  protected initSimulation() {
    return forceSimulation();
  }
}
