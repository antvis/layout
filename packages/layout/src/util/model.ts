import { EdgeFieldMapping, NodeFieldMapping } from '../base-layout/types';
import type { EdgeData, GraphData, NodeData } from '../types/data';
import type { ID } from '../types/id';
import type { LayoutEdge, LayoutNode } from '../types/layout';
import { extractFieldValues } from './data';
import { clone, setNestedValue } from './object';

export interface LayoutModelOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  /** 节点字段映射 */
  nodeFields?: NodeFieldMapping;
  /** 边字段映射 */
  edgeFields?: EdgeFieldMapping;
}

const getEdgeId = (edge: EdgeData): string => {
  return edge.id || `$${edge.source}-$${edge.target}`;
};

export class LayoutModel<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  public readonly original: GraphData<N, E>;
  public readonly nodeMap: Map<ID, LayoutNode<N>>;
  public readonly edgeMap: Map<ID, LayoutEdge<E>>;

  protected config = {
    inputNodeAttrs: ['id', 'x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz'],
    outputNodeAttrs: ['x', 'y', 'z', 'vx', 'vy', 'vz'],
    inputEdgeAttrs: ['id', 'source', 'target', 'controlPoints'],
    outputEdgeAttrs: ['controlPoints'],
  };

  private degreeCache?: Map<ID, { in: number; out: number; both: number }>;

  private inAdjacencyCache?: Map<ID, Set<ID>>;
  private outAdjacencyCache?: Map<ID, Set<ID>>;
  private bothAdjacencyCache?: Map<ID, Set<ID>>;

  /** 缓存的结果对象，用于避免每次 tick 都创建新对象 */
  private resultCache?: GraphData<N, E>;

  private readonly options: Required<LayoutModelOptions<N, E>>;

  constructor(data: GraphData<N, E>, options: LayoutModelOptions<N, E> = {}) {
    this.options = {
      nodeFields: options.nodeFields || {},
      edgeFields: options.edgeFields || {},
    };

    const { nodes, edges } = extractFieldValues<N, E>(
      data,
      this.config.inputNodeAttrs as (keyof NodeFieldMapping)[],
      this.config.inputEdgeAttrs as (keyof EdgeFieldMapping)[],
      this.options.nodeFields,
      this.options.edgeFields,
    );

    this.original = data;
    this.nodeMap = nodes;
    this.edgeMap = edges;
  }

  public init(): void {
    this.nodeMap.forEach((node) => {
      if (node.x === undefined) node.x = Math.random();
      if (node.y === undefined) node.y = Math.random();
      if (node.z === undefined) node.z = 0;
    });
  }

  /**
   * 将布局计算结果（x, y, z, controlPoints）同步到原始数据中
   * @returns 原始数据对象（已修改）
   */
  public syncToGraphData(): GraphData<N, E> {
    this.syncPositions(this.original);
    return this.original;
  }

  /**
   * 获取当前布局结果，返回缓存的对象引用，不修改原始数据
   * @returns 缓存的结果对象（每次调用返回同一引用）
   */
  public getGraphData(): GraphData<N, E> {
    if (!this.resultCache) {
      if (typeof structuredClone === 'function') {
        this.resultCache = structuredClone(this.original);
      } else {
        this.resultCache = {
          nodes: this.original.nodes.map((node) => clone(node)),
          edges: this.original.edges?.map((edge) => clone(edge)),
        };
      }
    }

    this.syncPositions(this.resultCache);
    return this.resultCache;
  }

  /**
   * 将布局节点的位置信息同步到目标数据对象中
   */
  private syncPositions(target: GraphData<N, E>): void {
    const { nodes, edges } = target;
    const fields: Record<string, string> = {};

    [...this.config.outputNodeAttrs, ...this.config.outputEdgeAttrs].forEach(
      (attr) => {
        fields[attr] =
          this.options.nodeFields?.[attr as keyof NodeFieldMapping] ||
          `data.${attr}`;
      },
    );

    nodes.forEach((node) => {
      const layoutNode = this.nodeMap.get(node.id);
      if (!layoutNode) return;

      this.config.outputNodeAttrs.forEach((attr: string) => {
        const value = layoutNode[attr as keyof LayoutNode<N>];
        if (value === undefined) return;

        setNestedValue(node, fields?.[attr], value);
      });
    });

    if (edges) {
      edges.forEach((edge) => {
        const edgeId = getEdgeId(edge);
        const layoutEdge = this.edgeMap.get(edgeId);

        if (!layoutEdge) return;

        this.config.outputEdgeAttrs.forEach((attr: string) => {
          const value = layoutEdge[attr as keyof LayoutEdge<E>];
          if (value === undefined) return;

          setNestedValue(edge, fields?.[attr], value);
        });
      });
    }
  }

  public nodes(): LayoutNode<N>[] {
    return Array.from(this.nodeMap.values());
  }

  public node(id: ID): LayoutNode<N> | undefined {
    return this.nodeMap.get(id);
  }

  public originalNode(id: ID): N | undefined {
    const node = this.nodeMap.get(id);
    return node?._original;
  }

  public nodeCount(): number {
    return this.nodeMap.size;
  }

  public edges(): LayoutEdge<E>[] {
    return Array.from(this.edgeMap.values());
  }

  public edge(id: ID): LayoutEdge<E> | undefined {
    return this.edgeMap.get(id);
  }

  public originalEdge(id: ID): E | undefined {
    const edge = this.edgeMap.get(id);
    return edge?._original;
  }

  public edgeCount(): number {
    return this.edgeMap.size;
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

    return Array.from(new Set([...inSet, ...outSet]));
  }

  public successors(nodeId: ID): ID[] {
    return this.neighbors(nodeId, 'out');
  }

  public predecessors(nodeId: ID): ID[] {
    return this.neighbors(nodeId, 'in');
  }

  public clearCache(): void {
    this.degreeCache = undefined;
    this.inAdjacencyCache = undefined;
    this.outAdjacencyCache = undefined;
    this.bothAdjacencyCache = undefined;
    this.resultCache = undefined;
  }

  private buildDegreeCache(): void {
    this.degreeCache = new Map();

    // 初始化，确保孤立节点度数为 0
    for (const id of this.nodeMap.keys()) {
      this.degreeCache.set(id, { in: 0, out: 0, both: 0 });
    }

    for (const edge of this.edgeMap.values()) {
      if (edge.source === edge.target) {
        // 自环处理：通常算作 1 in + 1 out，度数贡献视具体定义而定
        // 这里保持简单累加
      }

      const sourceDeg = this.degreeCache.get(edge.source);
      if (sourceDeg) {
        sourceDeg.out++;
        sourceDeg.both++;
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
    // 不默认构建 bothAdjacencyCache，节省内存

    // 初始化 Set
    for (const id of this.nodeMap.keys()) {
      this.inAdjacencyCache.set(id, new Set());
      this.outAdjacencyCache.set(id, new Set());
    }

    for (const edge of this.edgeMap.values()) {
      // 过滤掉悬挂边（source 或 target 不在节点列表中）
      // 如果 extractFieldValues 保证了数据完整性，这里可以直接断言
      if (!this.nodeMap.has(edge.source) || !this.nodeMap.has(edge.target)) {
        continue;
      }

      this.outAdjacencyCache.get(edge.source)!.add(edge.target);
      this.inAdjacencyCache.get(edge.target)!.add(edge.source);
    }
  }

  public destroy(): void {
    this.clearCache();
    this.nodeMap.clear();
    this.edgeMap.clear();
  }
}
