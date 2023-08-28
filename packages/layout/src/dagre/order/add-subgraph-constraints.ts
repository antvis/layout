import { ID } from '@antv/graphlib';
import { Graph } from '../../types';

export const addSubgraphConstraints = (g: Graph, cg: Graph, vs: ID[]) => {
  const prev: Record<ID, ID> = {};
  let rootPrev: ID;

  vs?.forEach((v) => {
    let child = g.getParent(v);
    let parent;
    let prevChild: ID;
    while (child) {
      parent = g.getParent(child.id);
      if (parent) {
        prevChild = prev[parent.id];
        prev[parent.id] = child.id;
      } else {
        prevChild = rootPrev;
        rootPrev = child.id;
      }
      if (prevChild && prevChild !== child.id) {
        if (!cg.hasNode(prevChild)) {
          cg.addNode({
            id: prevChild,
            data: {},
          });
        }
        if (!cg.hasNode(child.id)) {
          cg.addNode({
            id: child.id,
            data: {},
          });
        }
        if (!cg.hasEdge(`e${prevChild}-${child.id}`)) {
          cg.addEdge({
            id: `e${prevChild}-${child.id}`,
            source: prevChild,
            target: child.id,
            data: {},
          });
        }
        return;
      }
      child = parent;
    }
  });
};
