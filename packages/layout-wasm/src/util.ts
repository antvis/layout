import { Edge, ID, Node } from '@antv/graphlib';
import type { EdgeData, NodeData } from '@antv/layout';

export const graphlib2WASMInput = (
  inodes: Node<NodeData>[],
  iedges: Edge<EdgeData>[],
  dimensions: number,
  useWidthHeight = false,
) => {
  const nodes: number[] = [];
  const masses: number[] = [];
  const edges: number[][] = [];
  const weights: number[] = [];
  const nodeIdxMap: Record<ID, number> = {};
  inodes.forEach((node, i) => {
    nodeIdxMap[node.id] = i;
    if (useWidthHeight) {
      nodes.push(node.data.width || 10, node.data.height || 10);
    } else {
      nodes.push(node.data.x, node.data.y);
    }
    if (dimensions === 3) {
      nodes.push(node.data.z);
    }
    masses.push((node.data.mass as number) || 1);
  });
  iedges.forEach((edge) => {
    const weight = edge.data.weight || 1;
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

export function distanceThresholdMode2Index(
  mode: 'mean' | 'min' | 'max',
): number {
  return {
    mean: 0,
    min: 1,
    max: 2,
  }[mode];
}


export function parsePathToPoints(pathStr: string): { x: number; y: number }[] {
  // 步骤1：提取所有数字（包括负号和小数点）
  const numbers = pathStr.match(/[-+]?\d+\.\d+|\d+\.\d+|[-+]?\d+/g);
  const points = [];

  // 步骤2：每两个数字组成一个点对象
  for (let i = 0; i < numbers.length; i += 2) {
    if (i + 1 >= numbers.length) break; // 防止最后一个孤立的数字
    points.push({
      x: parseFloat(numbers[i]),
      y: parseFloat(numbers[i + 1]),
    });
  }
  return points;
}

export function px2Inch(px: number): number {
  return parseFloat((px / 72).toFixed(2));
}