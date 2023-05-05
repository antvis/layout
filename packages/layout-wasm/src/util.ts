import { ID, Node, Edge } from "@antv/graphlib";
import { NodeData, EdgeData } from "@antv/layout";

export const graphlib2WASMInput = (
  inodes: Node<NodeData>[],
  iedges: Edge<EdgeData>[]
) => {
  const nodes: number[] = [];
  const masses: number[] = [];
  const edges: number[][] = [];
  const weights: number[] = [];
  const nodeIdxMap: Record<ID, number> = {};
  inodes.forEach((node, i) => {
    nodeIdxMap[node.id] = i;
    nodes.push(node.data.x, node.data.y);
    masses.push((node.data.mass as number) || 1);
  });
  iedges.forEach((edge) => {
    const weight = edge.data.weight;
    const sourceIdx = nodeIdxMap[edge.source];
    const targetIdx = nodeIdxMap[edge.target];

    if (sourceIdx !== undefined && targetIdx !== undefined) {
      // n1 <- n2
      edges.push([targetIdx, sourceIdx]);
      weights.push(weight);
      // @see https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/helpers.js#L156-L158
      masses[sourceIdx] += weight;
      masses[targetIdx] += weight;
    }
  });

  return {
    nodes,
    masses,
    edges,
    weights,
  };
};

export function distanceThresholdMode2Index(mode: string): number {
  return {
    mean: 0,
    min: 1,
    max: 2,
  }[mode];
}
