import { Graph, Node } from "../graph";
import { addDummyNode } from "./util";

const addBorderSegments = (g: Graph) => {
  const dfs = (v: string) => {
    const children = g.children(v);
    const node = g.node(v)!;
    if (children?.length) {
      children.forEach((child) => dfs(child));
    }

    if (node.hasOwnProperty("minRank")) {
      node.borderLeft = [];
      node.borderRight = [];
      for (
        let rank = node.minRank!, maxRank = node.maxRank! + 1;
        rank < maxRank;
        rank += 1
      ) {
        addBorderNode(g, "borderLeft", "_bl", v, node, rank);
        addBorderNode(g, "borderRight", "_br", v, node, rank);
      }
    }
  };

  g.children()?.forEach((child) => dfs(child));
};

const addBorderNode = (
  g: Graph,
  prop: string,
  prefix: string,
  sg: string,
  sgNode: Node<Record<string, any>>,
  rank: number
) => {
  const label = { rank, borderType: prop, width: 0, height: 0 };
  const prev = sgNode[prop][rank - 1];
  const curr = addDummyNode(g, "border", label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, { weight: 1 });
  }
};

export default addBorderSegments;
