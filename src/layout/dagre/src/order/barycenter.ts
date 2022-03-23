import { Graph } from "../../graph";

const barycenter = (g: Graph, movable: string[]) => {
  return movable.map((v) => {
    const inV = g.inEdges(v);
    if (!inV?.length) {
      return { v };
    }  {
      const result = { sum: 0, weight: 0 };
      inV?.forEach((e) => {
        const edge = g.edge(e)!;
        const nodeU = g.node(e.v)!;
        result.sum += (edge.weight! * (nodeU.order as number));
        result.weight += edge.weight!;
      });
      return {
        v,
        barycenter: result.sum / result.weight,
        weight: result.weight
      };
    }
  });
};

export default barycenter;

