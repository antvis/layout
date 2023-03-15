import { ID } from "@antv/graphlib";
import { Graph } from "../../types";

const barycenter = (g: Graph, movable: ID[]) => {
  return movable.map((v) => {
    const inV = g.getRelatedEdges(v, "in");
    if (!inV?.length) {
      return { v };
    }
    {
      const result = { sum: 0, weight: 0 };
      inV?.forEach((e) => {
        const nodeU = g.getNode(e.source)!;
        result.sum += e.data.weight! * (nodeU.data.order as number);
        result.weight += e.data.weight!;
      });
      return {
        v,
        barycenter: result.sum / result.weight,
        weight: result.weight,
      };
    }
  });
};

export default barycenter;
