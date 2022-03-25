import { Graph } from "../graph";
import { buildLayerMatrix } from "./util";

const debugOrdering = (g: Graph) => {
  const layerMatrix = buildLayerMatrix(g);

  const h = new Graph({ compound: true, multigraph: true }).setGraph({});

  g.nodes().forEach((v: string) => {
    h.setNode(v, { label: v });
    h.setParent(v, `layer${g.node(v)!.rank}`);
  });

  g.edges().forEach((e) => {
    h.setEdge(e.v, e.w, {}, e.name);
  });

  layerMatrix?.forEach((layer, i: number) => {
    const layerV = `layer${i}`;
    h.setNode(layerV, { rank: "same" as unknown as number });
    layer?.reduce((u: string, v: string) => {
      h.setEdge(u, v, { style: "invis" });
      return v;
    });
  });

  return h;
};

export default debugOrdering;
