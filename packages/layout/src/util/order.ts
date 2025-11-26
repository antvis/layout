import { isNumber } from '@antv/util';
import type { Graph, Node } from '../types';
import { cloneFormatData } from './object';

/**
 * Order nodes by their degree (from small to large)
 */
export function orderByDegree<T extends Node = Node>(
  nodes: T[],
  graph: Graph,
): T[] {
  const orderedNodes = nodes.map((node) => cloneFormatData(node));

  orderedNodes.sort((nodeA, nodeB) => {
    const degreeA = graph.getDegree(nodeA.id, 'both');
    const degreeB = graph.getDegree(nodeB.id, 'both');
    return degreeA - degreeB;
  });

  return orderedNodes;
}

/**
 * Order nodes by their id (from small to large)
 */
export function orderById<T extends Node = Node>(nodes: T[]): T[] {
  const orderedNodes = nodes.map((node) => cloneFormatData(node));

  orderedNodes.sort((nodeA, nodeB) => {
    if (isNumber(nodeA.id) && isNumber(nodeB.id)) {
      return nodeA.id - nodeB.id;
    }
    return String(nodeA.id).localeCompare(String(nodeB.id));
  });

  return orderedNodes;
}

/**
 * Keep the original order of nodes
 */
export function orderByOriginal<T extends Node = Node>(nodes: T[]): T[] {
  return nodes.map((node) => cloneFormatData(node));
}

/**
 * Order nodes by a specified value in their data (from small to large)
 */
export function orderByValue<T extends Node = Node>(
  nodes: T[],
  valueKey: string,
): T[] {
  const orderedNodes = nodes.map((node) => cloneFormatData(node));

  orderedNodes.sort((nodeA, nodeB) => {
    const valueA = (nodeA.data as any)[valueKey];
    const valueB = (nodeB.data as any)[valueKey];
    return valueA - valueB;
  });

  return orderedNodes;
}
