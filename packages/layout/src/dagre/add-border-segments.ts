import { ID, Node } from "@antv/graphlib";
import { Graph, NodeData } from "../types";
import { addDummyNode } from "./util";

export const addBorderSegments = (g: Graph) => {
  g.getRoots().forEach((root) => {
    g.dfsTree(root.id, (node) => {
      if (node.data.hasOwnProperty("minRank")) {
        node.data.borderLeft = [];
        node.data.borderRight = [];
        for (
          let rank = node.data.minRank! as number,
            maxRank = (node.data.maxRank! as number) + 1;
          rank < maxRank;
          rank += 1
        ) {
          addBorderNode(g, "borderLeft", "_bl", node.id, node, rank);
          addBorderNode(g, "borderRight", "_br", node.id, node, rank);
        }
      }
    });
  });
};

const addBorderNode = (
  g: Graph,
  prop: string,
  prefix: string,
  sg: ID,
  sgNode: Node<NodeData>,
  rank: number
) => {
  const label = { rank, borderType: prop, width: 0, height: 0 };
  // @ts-ignore
  const prev = sgNode.data[prop][rank - 1];
  const curr = addDummyNode(g, "border", label, prefix);
  // @ts-ignore
  sgNode.data[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.addEdge({
      id: `e${Math.random()}`,
      source: prev,
      target: curr,
      data: { weight: 1 },
    });
  }
};
