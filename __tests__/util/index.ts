import { ID } from '@antv/graphlib';
import { Graph as IGraph } from '../../packages/layout';

export function mathEqual(a: number, b: number) {
  return Math.abs(a - b) < 1;
}

export function numberEqual(a: number, b: number, gap?: number) {
  return Math.abs(a - b) <= (gap || 0.001);
}

/**
 * calculate the euclidean distance form p1 to p2
 * @param p1
 * @param p2
 * @returns
 */
export function getEuclideanDistance(p1: any, p2: any) {
  const { data: p1d } = p1;
  const { data: p2d } = p2;
  return Math.sqrt(
    (p1d.x - p2d.x) * (p1d.x - p2d.x) + (p1d.y - p2d.y) * (p1d.y - p2d.y),
  );
}

type Entry = {
  onStack: boolean;
  lowlink: number;
  index: number;
};
export const tarjan = (graph: IGraph) => {
  let index = 0;
  const stack: ID[] = [];
  const visited = new Map<ID, Entry>(); // node id -> { onStack, lowlink, index }
  const results: ID[][] = [];

  function dfs(v: ID) {
    const entry = {
      onStack: true,
      lowlink: index,
      index,
    };
    visited.set(v, entry);
    index += 1;
    stack.push(v);

    graph.getSuccessors(v)?.forEach(function (w) {
      // 如果 w 没有被访问过，则继续访问 w
      if (!visited.has(w.id)) {
        dfs(w.id);
        const wEntry = visited.get(w.id);
        entry.lowlink = Math.min(entry.lowlink, wEntry!.lowlink);
        // 如果 w 在栈顶，则说明 w 和 v 不是强连通的
      } else if (visited.get(w.id)?.onStack) {
        const wEntry = visited.get(w.id);
        // 如果 w 在栈中，则说明 w 在当前访问的路径上
        entry.lowlink = Math.min(entry.lowlink, wEntry!.index);
      }
    });

    // 如果 v 的 lowlink 不等于 v 的 index，则说明 v 和 v 的 lowlink 不是强连通的
    if (entry.lowlink === entry.index) {
      const cmpt: ID[] = [];
      let w: ID;
      do {
        // 将 w 出栈，并将 w 的所有邻接点加入强连通子图
        w = stack.pop()!;
        const wEntry = visited.get(w)!;
        wEntry.onStack = false;
        cmpt.push(w);
      } while (v !== w);
      results.push(cmpt);
    }
  }

  graph.getAllNodes().forEach(function (v) {
    if (!visited.has(v.id)) {
      dfs(v.id);
    }
  });

  return results;
};

export const findCycles = (graph: IGraph) => {
  return tarjan(graph).filter(
    (cmpt) =>
      cmpt.length > 1 ||
      (cmpt.length === 1 &&
        !!graph
          .getRelatedEdges(cmpt[0], 'out')
          .find((e) => e.target === cmpt[0])),
  );
};

export const components = (graph: IGraph) => {
  const visited = new Set();
  const resultComponents: ID[][] = [];
  const nodes = graph.getAllNodes();

  nodes.forEach((n) => {
    const componentsArr: ID[] = [];
    const waitingList = [n];

    while (waitingList.length > 0) {
      const node = waitingList.pop()!;
      if (!visited.has(node)) {
        visited.add(node);
        componentsArr.push(node.id);
        graph.getSuccessors(node.id).forEach((n) => waitingList.push(n));
        graph.getPredecessors(node.id).forEach((n) => waitingList.push(n));
      }
    }

    if (componentsArr.length) {
      resultComponents.push(componentsArr);
    }
  });

  return resultComponents;
};
