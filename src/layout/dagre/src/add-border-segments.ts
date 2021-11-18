// var _ = require("./lodash");
// var util = require("./util");
import { Graph } from '../types';
import util from './util';

// module.exports = addBorderSegments;

const addBorderSegments = (g: Graph) => {
  const dfs = (v: string) => {
    const children = g.children(v);
    const node: any = g.node(v);
    if (children?.length) {
      children.forEach(child => dfs(child));
    }

    if (node.hasOwnProperty('minRank')) {
      node.borderLeft = [];
      node.borderRight = [];
      for (let rank = node.minRank, maxRank = node.maxRank + 1;
        rank < maxRank;
        ++rank) {
        addBorderNode(g, "borderLeft", "_bl", v, node, rank);
        addBorderNode(g, "borderRight", "_br", v, node, rank);
      }
    }
  }

  g.children()?.forEach(child => dfs(child));
}

const addBorderNode = (g: Graph, prop: string, prefix: string, sg: string, sgNode: any, rank: number) => {
  const label = { width: 0, height: 0, rank: rank, borderType: prop };
  const prev = sgNode[prop][rank - 1];
  const curr = util.addDummyNode(g, "border", label, prefix);
  sgNode[prop][rank] = curr;
  g.setParent(curr, sg);
  if (prev) {
    g.setEdge(prev, curr, { weight: 1 });
  }
}

export default addBorderSegments;