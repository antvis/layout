import { ID, Node } from '@antv/graphlib';
import { Graph, NodeData } from '../types';
import { addDummyNode } from './util';

export const addBorderSegments = (g: Graph) => {
  const dfs = (v: ID) => {
    const children = g.getChildren(v);
    const node = g.getNode(v)!;
    if (children?.length) {
      children.forEach((child) => dfs(child.id));
    }

    if (node.data.hasOwnProperty('minRank')) {
      node.data.borderLeft = [];
      node.data.borderRight = [];
      for (
        let rank = node.data.minRank!, maxRank = node.data.maxRank! + 1;
        rank < maxRank;
        rank += 1
      ) {
        addBorderNode(g, 'borderLeft', '_bl', v, node, rank);
        addBorderNode(g, 'borderRight', '_br', v, node, rank);
      }
    }
  };

  g.getRoots().forEach((child) => dfs(child.id));
};

const addBorderNode = (
  g: Graph,
  prop: string,
  prefix: string,
  sg: ID,
  sgNode: Node<NodeData>,
  rank: number
) => {
  const label: NodeData = { rank, borderType: prop, width: 0, height: 0 };
  // @ts-ignore
  const prev = sgNode.data[prop][rank - 1];
  const curr = addDummyNode(g, 'border', label, prefix);
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
