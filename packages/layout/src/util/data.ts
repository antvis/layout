import type { EdgeData, NodeData } from '../types/data';
import { ID } from '../types/id';

export function getNodeId(node: NodeData): ID {
  return node.id;
}

export function getEdgeId(edge: EdgeData): ID {
  return edge.id || `${edge.source}-${edge.target}`;
}
