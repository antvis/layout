import { isNil } from '@antv/util';
import type { DataOptions } from '../algorithm/types';
import type {
  EdgeData,
  Graph,
  GraphData,
  GraphEdge,
  GraphNode,
  ID,
  NodeData,
} from '../types';

export class GraphLib<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  public nodeMap: Map<ID, GraphNode<N>>;
  public edgeMap: Map<ID, GraphEdge<E>>;

  private degreeCache?: Map<ID, { in: number; out: number; both: number }>;

  private inAdjacencyCache?: Map<ID, Set<ID>>;
  private outAdjacencyCache?: Map<ID, Set<ID>>;
  private bothAdjacencyCache?: Map<ID, Set<ID>>;

  private nodeIndexCache?: Map<ID, number>;
  private indexNodeCache?: Map<number, ID>;

  private edgeIdCounter: Map<string, number> = new Map();

  constructor(data: GraphData<N, E>, options: DataOptions<N, E> = {}) {
    this.nodeMap = extractNodeData<N>(data.nodes, options.node);
    this.edgeMap = extractEdgeData<E>(
      data.edges || [],
      options.edge,
      this.getEdgeId.bind(this),
    );
  }

  public data(): Graph<N, E> {
    return { nodes: this.nodeMap, edges: this.edgeMap };
  }

  public replace(result: Graph<N, E>): void {
    this.nodeMap = result.nodes;
    this.edgeMap = result.edges;

    this.clearCache();
  }

  public nodes(): GraphNode<N>[] {
    return Array.from(this.nodeMap.values());
  }

  public node(id: ID): GraphNode<N> | undefined {
    return this.nodeMap.get(id);
  }

  public nodeAt(index: number): GraphNode<N> | undefined {
    if (!this.indexNodeCache) {
      this.buildNodeIndexCache();
    }
    const nodeId = this.indexNodeCache!.get(index);
    return nodeId ? this.nodeMap.get(nodeId) : undefined;
  }

  public nodeIndexOf(id: ID): number {
    if (!this.nodeIndexCache) {
      this.buildNodeIndexCache();
    }
    return this.nodeIndexCache!.get(id) ?? -1;
  }

  public firstNode(): GraphNode<N> | undefined {
    return this.nodeMap.values().next().value;
  }

  public forEachNode(
    callback: (node: GraphNode<N>, index: number) => void,
  ): void {
    let i = 0;
    this.nodeMap.forEach((node) => callback(node, i++));
  }

  public originalNode(id: ID): N | undefined {
    const node = this.nodeMap.get(id);
    return node?._original;
  }

  public nodeCount(): number {
    return this.nodeMap.size;
  }

  public edges(): GraphEdge<E>[] {
    return Array.from(this.edgeMap.values());
  }

  public edge(id: ID): GraphEdge<E> | undefined {
    return this.edgeMap.get(id);
  }

  public firstEdge(): GraphEdge<E> | undefined {
    return this.edgeMap.values().next().value;
  }

  public forEachEdge(
    callback: (edge: GraphEdge<E>, index: number) => void,
  ): void {
    let i = 0;
    this.edgeMap.forEach((edge) => callback(edge, i++));
  }

  public originalEdge(id: ID): E | undefined {
    const edge = this.edgeMap.get(id);
    return edge?._original;
  }

  public edgeCount(): number {
    return this.edgeMap.size;
  }

  public getEdgeId(edge: E): string {
    if (edge.id) return edge.id;

    const baseId = `${edge.source}-${edge.target}`;
    const count = this.edgeIdCounter.get(baseId) || 0;
    const id = count === 0 ? baseId : `${baseId}-${count}`;
    this.edgeIdCounter.set(baseId, count + 1);

    return id;
  }

  public degree(nodeId: ID, direction: 'in' | 'out' | 'both' = 'both'): number {
    if (!this.degreeCache) {
      this.buildDegreeCache();
    }

    const degree = this.degreeCache!.get(nodeId);
    if (!degree) return 0;

    return degree[direction];
  }

  public neighbors(
    nodeId: ID,
    direction: 'in' | 'out' | 'both' = 'both',
  ): ID[] {
    if (!this.outAdjacencyCache || !this.inAdjacencyCache) {
      this.buildAdjacencyCache();
    }

    if (direction === 'out') {
      return Array.from(this.outAdjacencyCache!.get(nodeId) || []);
    }

    if (direction === 'in') {
      return Array.from(this.inAdjacencyCache!.get(nodeId) || []);
    }

    if (this.bothAdjacencyCache) {
      return Array.from(this.bothAdjacencyCache.get(nodeId) || []);
    }

    const inSet = this.inAdjacencyCache!.get(nodeId);
    const outSet = this.outAdjacencyCache!.get(nodeId);

    if (!inSet && !outSet) return [];
    if (!inSet) return Array.from(outSet!);
    if (!outSet) return Array.from(inSet);

    const merged = new Set<ID>();
    inSet.forEach((id) => merged.add(id));
    outSet.forEach((id) => merged.add(id));
    return Array.from(merged);
  }

  public successors(nodeId: ID): ID[] {
    return this.neighbors(nodeId, 'out');
  }

  public predecessors(nodeId: ID): ID[] {
    return this.neighbors(nodeId, 'in');
  }

  public setNodeOrder(nodes: GraphNode<N>[]): void {
    const next = new Map<ID, GraphNode<N>>();
    for (const node of nodes) next.set(node.id, node);
    this.nodeMap = next;

    this.nodeIndexCache = undefined;
    this.indexNodeCache = undefined;
  }

  public clearCache(): void {
    this.degreeCache = undefined;
    this.inAdjacencyCache = undefined;
    this.outAdjacencyCache = undefined;
    this.bothAdjacencyCache = undefined;
    this.nodeIndexCache = undefined;
    this.indexNodeCache = undefined;
  }

  private buildDegreeCache(): void {
    this.degreeCache = new Map();

    for (const edge of this.edges()) {
      const { source, target } = edge;

      if (edge.source === edge.target) continue;

      if (!this.degreeCache.has(source)) {
        this.degreeCache.set(source, { in: 0, out: 0, both: 0 });
      }
      const sourceDeg = this.degreeCache.get(edge.source);
      if (sourceDeg) {
        sourceDeg.out++;
        sourceDeg.both++;
      }

      if (!this.degreeCache.has(target)) {
        this.degreeCache.set(target, { in: 0, out: 0, both: 0 });
      }
      const targetDeg = this.degreeCache.get(edge.target);
      if (targetDeg) {
        targetDeg.in++;
        targetDeg.both++;
      }
    }
  }

  private buildAdjacencyCache(): void {
    this.inAdjacencyCache = new Map();
    this.outAdjacencyCache = new Map();

    for (const edge of this.edges()) {
      if (!this.nodeMap.has(edge.source) || !this.nodeMap.has(edge.target))
        continue;

      if (!this.outAdjacencyCache!.has(edge.source)) {
        this.outAdjacencyCache!.set(edge.source, new Set());
      }
      this.outAdjacencyCache.get(edge.source)!.add(edge.target);

      if (!this.inAdjacencyCache!.has(edge.target)) {
        this.inAdjacencyCache!.set(edge.target, new Set());
      }
      this.inAdjacencyCache.get(edge.target)!.add(edge.source);
    }
  }

  private buildNodeIndexCache(): void {
    this.nodeIndexCache = new Map();
    this.indexNodeCache = new Map();

    let index = 0;
    this.nodeMap.forEach((_node, nodeId) => {
      this.nodeIndexCache!.set(nodeId, index);
      this.indexNodeCache!.set(index, nodeId);
      index++;
    });
  }

  public destroy(): void {
    this.clearCache();
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.edgeIdCounter.clear();
  }
}

const nodeFields = [
  'id',
  'x',
  'y',
  'z',
  'vx',
  'vy',
  'vz',
  'fx',
  'fy',
  'fz',
  'parentId',
];

const edgeFields = ['id', 'source', 'target', 'points'];

function extractNodeData<N extends NodeData = NodeData>(
  nodes: N[],
  node?: (datum: N) => Partial<GraphNode>,
): Map<ID, GraphNode<N>> {
  if (!nodes) {
    throw new Error('Data.nodes is required');
  }

  const result = new Map<ID, GraphNode<N>>();

  for (const datum of nodes) {
    const nodeData: GraphNode<N> = { _original: datum } as GraphNode<N>;

    for (const field of nodeFields) {
      const value = datum[field];
      if (isNil(value)) continue;
      nodeData[field] = value;
    }

    if (node) {
      const customFields = node(datum);
      for (const key in customFields) {
        const value = customFields[key];
        if (isNil(value)) continue;
        nodeData[key] = value;
      }
    }

    if (isNil(nodeData.id)) {
      throw new Error(`Node is missing id field`);
    }

    result.set(nodeData.id, nodeData);
  }

  return result;
}

function extractEdgeData<E extends EdgeData = EdgeData>(
  edges: E[],
  edge?: (datum: E) => Partial<GraphEdge>,
  getEdgeId?: (datum: E) => ID,
): Map<ID, GraphEdge<E>> {
  const result = new Map<ID, GraphEdge<E>>();

  for (const datum of edges) {
    const edgeData: GraphEdge<E> = { _original: datum } as GraphEdge<E>;

    for (const field of edgeFields) {
      const value = datum[field];
      if (isNil(value)) continue;
      edgeData[field] = value;
    }

    if (edge) {
      const customFields = edge(datum);
      for (const key in customFields) {
        const value = customFields[key];
        if (isNil(value)) continue;
        edgeData[key] = value;
      }
    }

    if (isNil(edgeData.source) || isNil(edgeData.target)) {
      throw new Error(`Edge is missing source or target field`);
    }

    if (isNil(edgeData.id)) {
      edgeData.id = getEdgeId?.(datum) as ID;
    }

    result.set(edgeData.id, edgeData);
  }

  return result;
}

export function initNodePosition<N extends NodeData = NodeData>(
  model: GraphLib<N>,
  width: number,
  height: number,
  dimensions: 2 | 3 = 2,
): void {
  model.forEachNode((node) => {
    if (isNil(node.x)) {
      node.x = Math.random() * width;
    }
    if (isNil(node.y)) {
      node.y = Math.random() * height;
    }
    if (dimensions === 3 && isNil(node.z)) {
      node.z = Math.random() * Math.min(width, height);
    }
  });
}
