import { Simulation } from 'd3-force';
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
import { apply, D3ForceLayout } from '../d3-force';
import type { D3Force3DLayoutOptions, EdgeDatum, NodeDatum } from './types';

export type { D3Force3DLayoutOptions };

export class D3Force3DLayout extends D3ForceLayout<
  D3Force3DLayoutOptions,
  NodeDatum,
  EdgeDatum
> {
  public id = 'd3-force-3d';

  protected config = {
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

  protected getDefaultOptions(): Partial<D3Force3DLayoutOptions> {
    return {
      numDimensions: 3,
      link: {
        id: (edge) => edge.id!,
      },
      manyBody: {},
      center: {
        x: 0,
        y: 0,
        z: 0,
      },
    };
  }

  protected initSimulation() {
    return forceSimulation() as any as Simulation<NodeDatum, EdgeDatum>;
  }

  protected setupForces(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: D3Force3DLayoutOptions,
  ): void {
    Object.entries(this.forceMap).forEach(([name, Ctor]) => {
      const forceName = name;
      if (options[name as keyof D3Force3DLayoutOptions]) {
        let force = simulation.force(forceName) as any;
        if (!force) {
          force = Ctor();
          simulation.force(forceName, force);
        }
        apply(
          force,
          Object.entries(
            options[forceName as keyof D3Force3DLayoutOptions] as object,
          ),
        );
      } else simulation.force(forceName, null);
    });
  }
}
