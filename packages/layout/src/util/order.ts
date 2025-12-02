import type { PlainObject } from '../types/common';
import type { LayoutNode, NodeData } from '../types/data';
import type { LayoutModel } from './model';

export type SortComparator<N extends PlainObject = PlainObject> = (
  nodeA: LayoutNode<N>,
  nodeB: LayoutNode<N>,
  nodes: LayoutNode<N>[],
) => -1 | 0 | 1;

/**
 * 通用排序核心函数
 */
function sort<N extends PlainObject = PlainObject>(
  model: LayoutModel<N>,
  compareFn: (a: LayoutNode<N>, b: LayoutNode<N>) => number,
): LayoutModel<N> {
  const nodes = model.nodes();

  nodes.sort(compareFn);
  model.nodeMap.clear();

  nodes.forEach((node) => {
    model.nodeMap.set(node.id, node);
  });

  return model;
}

export function orderByDegree<N extends PlainObject = PlainObject>(
  model: LayoutModel<N>,
): LayoutModel<N> {
  return sort(model, (nodeA, nodeB) => {
    const degreeA = model.degree(nodeA.id);
    const degreeB = model.degree(nodeB.id);
    return degreeA - degreeB;
  });
}

/**
 * 按 ID 排序
 */
export function orderById<N = any>(model: LayoutModel<N>): LayoutModel<N> {
  return sort(model, (nodeA, nodeB) => {
    const idA = nodeA.id;
    const idB = nodeB.id;

    if (typeof idA === 'number' && typeof idB === 'number') {
      return idA - idB;
    }

    return String(idA).localeCompare(String(idB));
  });
}

/**
 * 按自定义比较函数排序
 */
export function orderBySorter<N = any>(
  model: LayoutModel<N>,
  sorter: (a: NodeData, b: NodeData) => -1 | 0 | 1,
): LayoutModel<N> {
  return sort(model, (nodeA, nodeB) => {
    const a = model.originalNode(nodeA.id);
    const b = model.originalNode(nodeB.id);
    return sorter(a!, b!);
  });
}
