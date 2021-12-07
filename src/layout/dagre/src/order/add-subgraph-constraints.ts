// const _ = require("../lodash");

import { Graph } from "../../types";

const addSubgraphConstraints = (g: Graph, cg: Graph, vs: string[]) => {
  let prev: any = {}, rootPrev: any;

    vs.forEach((v) => {
    let child = g.parent(v),
      parent,
      prevChild;
    while (child) {
      parent = g.parent(child);
      if (parent) {
        prevChild = prev[parent];
        prev[parent] = child;
      } else {
        prevChild = rootPrev;
        rootPrev = child;
      }
      if (prevChild && prevChild !== child) {
        cg.setEdge(prevChild, child);
        return;
      }
      child = parent;
    }
  });

  /*
  function dfs(v) {
    const children = v ? g.children(v) : g.children();
    if (children.length) {
      const min = Number.POSITIVE_INFINITY,
          subgraphs = [];
      _.each(children, function(child) {
        const childMin = dfs(child);
        if (g.children(child).length) {
          subgraphs.push({ v: child, order: childMin });
        }
        min = Math.min(min, childMin);
      });
      _.reduce(_.sortBy(subgraphs, "order"), function(prev, curr) {
        cg.setEdge(prev.v, curr.v);
        return curr;
      });
      return min;
    }
    return g.node(v).order;
  }
  dfs(undefined);
  */
}


export default addSubgraphConstraints;