// var _ = require("./lodash");
// var util = require("./util");
// var Graph = require("./graphlib").Graph;

import util from './util';
import graphlib from './graphlib';
import { Graph as IGraph } from '../types'

const Graph = (graphlib as any).Graph;

/* istanbul ignore next */
const debugOrdering = (g: IGraph) => {
  const layerMatrix = util.buildLayerMatrix(g);

  const h = new Graph({ compound: true, multigraph: true }).setGraph({});

  g.nodes().forEach((v: string) => {
    h.setNode(v, { label: v });
    h.setParent(v, "layer" + g.node(v).rank);
  });

  g.edges().forEach(e => {
    h.setEdge(e.v, e.w, {}, e.name);
  });

  layerMatrix.forEach((layer: any, i: number) => {
    const layerV = "layer" + i;
    h.setNode(layerV, { rank: "same" });
    layer.reduce((u: string, v: string) => {
      h.setEdge(u, v, { style: "invis" });
      return v;
    });
  });

  return h;
}

export default debugOrdering;
