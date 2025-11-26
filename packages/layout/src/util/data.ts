import { Graph } from '@antv/graphlib';
import { Graph as IGraph } from '../types';
import type { GraphData } from '../types/data';

/**
 * Convert GraphData to Graph instance to use `@antv/graphlib` functionalities
 */
export function toGraph(data: GraphData | IGraph): IGraph {
  if (data instanceof Graph) return data;

  validateData(data);

  data.nodes.forEach((n) => {
    if (!n.data) n.data = {};
  });

  data.edges?.forEach((e, i) => {
    if (!e.id) e.id = `edge-${i}`;
  });

  return new Graph(data as any);
}

/**
 * Make sure nodes and edges have required fields
 */
export function validateData(data: GraphData): void {
  if (!data.nodes || !Array.isArray(data.nodes)) {
    throw new Error('Invalid data: nodes array is required');
  }

  data.nodes.forEach((node, index) => {
    if (node.id === undefined || node.id === null) {
      throw new Error(`Invalid node at index ${index}: id is required`);
    }
  });

  if (data.edges) {
    data.edges.forEach((edge, index) => {
      if (!edge.source || !edge.target) {
        throw new Error(
          `Invalid edge at index ${index}: source and target are required`,
        );
      }
    });
  }
}
