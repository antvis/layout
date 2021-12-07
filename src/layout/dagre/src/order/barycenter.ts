// const _ = require("../lodash");

import { Graph } from "../../types";

const barycenter = (g: Graph, movable: string[]) => {
  return movable.map((v) => {
    const inV = g.inEdges(v);
    if (!inV?.length) {
      return { v };
    } else {
      const result = { sum: 0, weight: 0 };
      inV.forEach(e => {
        const edge = g.edge(e),
          nodeU = g.node(e.v);
        result.sum += (edge.weight * (nodeU.order as number));
        result.weight += edge.weight;
      });
      // const result = _.reduce(inV, function(acc, e) {
      //   const edge = g.edge(e),
      //     nodeU = g.node(e.v);
      //   return {
      //     sum: acc.sum + (edge.weight * nodeU.order),
      //     weight: acc.weight + edge.weight
      //   };
      // }, { sum: 0, weight: 0 });

      return {
        v,
        barycenter: result.sum / result.weight,
        weight: result.weight
      };
    }
  });
}

export default barycenter;

