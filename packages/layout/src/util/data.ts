import { Graph } from '@antv/graphlib';
import { isNil } from '@antv/util';
import { EdgeFieldMapping, NodeFieldMapping } from '../base-layout/types';
import { Graph as IGraph } from '../types';
import type { EdgeData, GraphData, NodeData } from '../types/data';
import { ID } from '../types/id';
import { LayoutData, LayoutEdge, LayoutNode } from '../types/layout';
import { getNestedValue } from './object';

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

export function extractFieldValues<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
>(
  data: GraphData<N, E>,
  nodeFields: (keyof NodeFieldMapping)[],
  edgeFields: (keyof EdgeFieldMapping)[],
  nodeFieldMapping?: NodeFieldMapping,
  edgeFieldMapping?: EdgeFieldMapping,
): LayoutData<N, E> {
  const nodes = new Map<ID, LayoutNode<N>>();

  data.nodes.forEach((node) => {
    const nodeData = toNodeData<N>(node, nodeFields, nodeFieldMapping);
    nodes.set(nodeData.id, nodeData);
  });

  const edges = new Map<ID, any>();

  data.edges?.forEach((edge) => {
    const edgeData = toEdgeData<E>(edge, edgeFields, edgeFieldMapping);
    edges.set(edgeData.id, edgeData);
  });

  return { nodes, edges };
}

/** 转换单个节点，提取 id/x/y/z，如果没有坐标会保留 _original */
function toNodeData<N extends NodeData>(
  node: N,
  nodeFields: (keyof NodeFieldMapping)[],
  nodeFieldMapping?: NodeFieldMapping,
): LayoutNode<N> {
  const idField = nodeFieldMapping?.id || 'id';
  const id = getNestedValue(node, idField);

  if (id === undefined || id === null) {
    throw new Error(`Node is missing id field "${idField}"`);
  }

  const result: LayoutNode<N> = { id, _original: node } as LayoutNode<N>;

  nodeFields.forEach((field) => {
    if (field === 'id') {
      return;
    }
    const fieldPath = nodeFieldMapping?.[field] || 'data.' + field;

    const value = getNestedValue(node, fieldPath);
    if (value !== undefined) {
      result[field] = value;
    }
  });
  return result;
}

function toEdgeData<E extends EdgeData>(
  edge: E,
  edgeFields: (keyof EdgeFieldMapping)[],
  edgeFieldMapping: EdgeFieldMapping = {},
): LayoutEdge<E> {
  const sourceField = edgeFieldMapping?.source || 'source';
  const targetField = edgeFieldMapping?.target || 'target';

  const source = getNestedValue(edge, sourceField);
  const target = getNestedValue(edge, targetField);

  if (isNil(source) || isNil(target)) {
    throw new Error(
      `Edge is missing source or target field "${sourceField}" or "${targetField}"`,
    );
  }

  const id = getNestedValue(edge, 'id');

  const result = {
    source,
    target,
    id: id || getEdgeId({ source, target }),
    _original: edge,
  } as LayoutEdge<E>;

  edgeFields.forEach((field) => {
    if (field === 'source' || field === 'target' || field === 'id') {
      return;
    }
    const fieldPath = edgeFieldMapping?.[field] || 'data.' + field;
    const value = getNestedValue(edge, fieldPath);
    if (value !== undefined) {
      result[field] = value;
    }
  });

  return result;
}

export function getNodeId(node: NodeData): ID {
  return node.id;
}

export function getEdgeId(edge: EdgeData): ID {
  return edge.id || `${edge.source}-${edge.target}`;
}
