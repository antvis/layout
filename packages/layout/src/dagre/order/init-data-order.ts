import { ID } from "@antv/graphlib";
import { Graph } from "../../types";

/**
 * 按照数据中的结果设置fixorder
 */
export const initDataOrder = (g: Graph, nodeOrder?: ID[]) => {
  const simpleNodes = g.getAllNodes().filter((v) => {
    return !g.getChildren(v.id)?.length;
  });
  const ranks = simpleNodes.map((v) => v.data.rank as number);
  const maxRank = Math.max(...ranks);
  const layers: ID[][] = [];
  for (let i = 0; i < maxRank + 1; i++) {
    layers[i] = [];
  }

  nodeOrder?.forEach((n) => {
    const node = g.getNode(n);
    // 只考虑原有节点，dummy节点需要按照后续算法排出
    if (!node || node?.data.dummy) {
      return;
    }
    if (!isNaN(node.data.rank as number)) {
      node.data.fixorder = layers[node.data.rank as number].length; // 设置fixorder为当层的顺序
      layers[node.data.rank as number].push(n);
    }
  });
};
