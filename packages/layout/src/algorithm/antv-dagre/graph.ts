import type { EdgeData, ID, NodeData } from '../../types';

/**
 * <zh/> 图中的节点
 *
 * <en/> Node in the graph
 */
export interface GraphNode<N extends NodeData = NodeData> {
  id: ID;
  data: N;
}

/**
 * <zh/> 图中的边
 *
 * <en/> Edge in the graph
 */
export interface GraphEdge<E extends EdgeData = EdgeData> {
  id: ID;
  source: ID;
  target: ID;
  data: E;
}

/**
 * <zh/> 图数据结构配置
 *
 * <en/> Graph data structure configuration
 */
export interface GraphOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  tree?: string[] | (GraphNode<N> & { children?: GraphNode<N>[] })[];
  nodes?: GraphNode<N>[];
  edges?: GraphEdge<E>[];
}

/**
 * <zh/> 内部图数据结构，用于 antv-dagre 布局算法
 *
 * <en/> Internal graph data structure for antv-dagre layout algorithm
 */
export class DagreGraph<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  private nodes: Map<ID, GraphNode<N>> = new Map();
  private edges: Map<ID, GraphEdge<E>> = new Map();
  private inEdges: Map<ID, Set<ID>> = new Map();
  private outEdges: Map<ID, Set<ID>> = new Map();
  private parentMap: Map<string, Map<ID, ID | undefined>> = new Map(); // tree structure name -> node -> parent
  private childrenMap: Map<string, Map<ID, Set<ID>>> = new Map(); // tree structure name -> node -> children

  constructor(private options: GraphOptions<N, E> = {}) {
    // Initialize tree structures
    if (options.tree) {
      if (Array.isArray(options.tree) && options.tree.length > 0) {
        // Check if it's a tree name array or tree data array
        if (typeof options.tree[0] === 'string') {
          // It's a tree name array
          (options.tree as string[]).forEach((treeName) => {
            this.parentMap.set(treeName, new Map());
            this.childrenMap.set(treeName, new Map());
          });
        } else {
          // It's tree data, add it
          this.attachTreeStructure('default');
          this.addTree(options.tree as any);
        }
      }
    }

    // Add initial nodes and edges if provided
    if (options.nodes) {
      options.nodes.forEach((node) => this.addNode(node));
    }
    if (options.edges) {
      options.edges.forEach((edge) => this.addEdge(edge));
    }
  }

  /**
   * <zh/> 添加节点
   *
   * <en/> Add a node
   */
  addNode(node: GraphNode<N>): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.inEdges.set(node.id, new Set());
      this.outEdges.set(node.id, new Set());
    }
  }

  /**
   * <zh/> 批量添加节点
   *
   * <en/> Add multiple nodes
   */
  addNodes(nodes: GraphNode<N>[]): void {
    nodes.forEach((node) => this.addNode(node));
  }

  /**
   * <zh/> 获取节点
   *
   * <en/> Get a node
   */
  getNode(id: ID): GraphNode<N> {
    return this.nodes.get(id)!;
  }

  /**
   * <zh/> 检查节点是否存在
   *
   * <en/> Check if a node exists
   */
  hasNode(id: ID): boolean {
    return this.nodes.has(id);
  }

  /**
   * <zh/> 删除节点
   *
   * <en/> Remove a node
   */
  removeNode(id: ID): void {
    if (!this.nodes.has(id)) return;

    // Remove all edges connected to this node
    const inEdgeIds = Array.from(this.inEdges.get(id) || []);
    const outEdgeIds = Array.from(this.outEdges.get(id) || []);

    inEdgeIds.forEach((edgeId) => this.removeEdge(edgeId));
    outEdgeIds.forEach((edgeId) => this.removeEdge(edgeId));

    this.nodes.delete(id);
    this.inEdges.delete(id);
    this.outEdges.delete(id);

    // Remove from tree structures
    this.parentMap.forEach((treeParentMap) => {
      treeParentMap.delete(id);
    });
    this.childrenMap.forEach((treeChildrenMap) => {
      treeChildrenMap.delete(id);
    });
  }

  /**
   * <zh/> 获取所有节点
   *
   * <en/> Get all nodes
   */
  getAllNodes(): GraphNode<N>[] {
    return Array.from(this.nodes.values());
  }

  /**
   * <zh/> 添加边
   *
   * <en/> Add an edge
   */
  addEdge(edge: GraphEdge<E>): void {
    if (!this.nodes.has(edge.source) || !this.nodes.has(edge.target)) {
      throw new Error(
        `Cannot add edge ${edge.id}: source ${edge.source} or target ${edge.target} does not exist`,
      );
    }

    this.edges.set(edge.id, edge);
    this.outEdges.get(edge.source)!.add(edge.id);
    this.inEdges.get(edge.target)!.add(edge.id);
  }

  /**
   * <zh/> 批量添加边
   *
   * <en/> Add multiple edges
   */
  addEdges(edges: GraphEdge<E>[]): void {
    edges.forEach((edge) => this.addEdge(edge));
  }

  /**
   * <zh/> 获取边
   *
   * <en/> Get an edge
   */
  getEdge(id: ID): GraphEdge<E> {
    return this.edges.get(id)!;
  }

  /**
   * <zh/> 检查边是否存在
   *
   * <en/> Check if an edge exists
   */
  hasEdge(id: ID): boolean {
    return this.edges.has(id);
  }

  /**
   * <zh/> 删除边
   *
   * <en/> Remove an edge
   */
  removeEdge(id: ID): void {
    const edge = this.edges.get(id);
    if (!edge) return;

    this.edges.delete(id);
    this.outEdges.get(edge.source)?.delete(id);
    this.inEdges.get(edge.target)?.delete(id);
  }

  /**
   * <zh/> 获取所有边
   *
   * <en/> Get all edges
   */
  getAllEdges(): GraphEdge<E>[] {
    return Array.from(this.edges.values());
  }

  /**
   * <zh/> 更新边数据
   *
   * <en/> Update edge data
   */
  updateEdgeData(id: ID, data: Partial<E>): void {
    const edge = this.edges.get(id);
    if (edge) {
      Object.assign(edge.data, data);
    }
  }

  /**
   * <zh/> 更新节点数据
   *
   * <en/> Update node data
   */
  updateNodeData(id: ID, data: Partial<N>): void {
    const node = this.nodes.get(id);
    if (node) {
      Object.assign(node.data, data);
    }
  }

  /**
   * <zh/> 获取相关边
   *
   * <en/> Get related edges
   */
  getRelatedEdges(
    nodeId: ID,
    direction: 'in' | 'out' | 'both' = 'both',
  ): GraphEdge<E>[] {
    const result: GraphEdge<E>[] = [];

    if (direction === 'in' || direction === 'both') {
      const inEdgeIds = this.inEdges.get(nodeId);
      if (inEdgeIds) {
        inEdgeIds.forEach((edgeId) => {
          const edge = this.edges.get(edgeId);
          if (edge) result.push(edge);
        });
      }
    }

    if (direction === 'out' || direction === 'both') {
      const outEdgeIds = this.outEdges.get(nodeId);
      if (outEdgeIds) {
        outEdgeIds.forEach((edgeId) => {
          const edge = this.edges.get(edgeId);
          if (edge) result.push(edge);
        });
      }
    }

    return result;
  }

  /**
   * <zh/> 获取后继节点
   *
   * <en/> Get successor nodes
   */
  getSuccessors(nodeId: ID): GraphNode<N>[] {
    const outEdgeIds = this.outEdges.get(nodeId);
    if (!outEdgeIds || outEdgeIds.size === 0) return [];

    const successors: GraphNode<N>[] = [];
    outEdgeIds.forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const targetNode = this.nodes.get(edge.target);
        if (targetNode) successors.push(targetNode);
      }
    });

    return successors.length > 0 ? successors : [];
  }

  /**
   * <zh/> 获取前驱节点
   *
   * <en/> Get predecessor nodes
   */
  getPredecessors(nodeId: ID): GraphNode<N>[] {
    const inEdgeIds = this.inEdges.get(nodeId);
    if (!inEdgeIds || inEdgeIds.size === 0) return [];

    const predecessors: GraphNode<N>[] = [];
    inEdgeIds.forEach((edgeId) => {
      const edge = this.edges.get(edgeId);
      if (edge) {
        const sourceNode = this.nodes.get(edge.source);
        if (sourceNode) predecessors.push(sourceNode);
      }
    });

    return predecessors.length > 0 ? predecessors : [];
  }

  /**
   * <zh/> 获取邻居节点
   *
   * <en/> Get neighbor nodes
   */
  getNeighbors(nodeId: ID): GraphNode<N>[] {
    const successors = this.getSuccessors(nodeId) || [];
    const predecessors = this.getPredecessors(nodeId) || [];
    const neighbors = [...successors, ...predecessors];

    // Remove duplicates
    const uniqueNeighbors = Array.from(
      new Map(neighbors.map((n) => [n.id, n])).values(),
    );

    return uniqueNeighbors.length > 0 ? uniqueNeighbors : [];
  }

  /**
   * <zh/> 附加树结构
   *
   * <en/> Attach tree structure
   */
  attachTreeStructure(treeName: string): void {
    if (!this.parentMap.has(treeName)) {
      this.parentMap.set(treeName, new Map());
      this.childrenMap.set(treeName, new Map());
    }
  }

  /**
   * <zh/> 添加树结构（递归添加节点及其子节点）
   *
   * <en/> Add tree structure (recursively add nodes and their children)
   */
  addTree(
    tree:
      | (GraphNode<N> & { children?: GraphNode<N>[] })
      | (GraphNode<N> & { children?: GraphNode<N>[] })[],
    treeName?: string,
  ): void {
    const actualTreeName =
      treeName || ((this.options.tree?.[0] ?? 'default') as string);

    if (!this.hasTreeStructure(actualTreeName)) {
      this.attachTreeStructure(actualTreeName);
    }

    const trees = Array.isArray(tree) ? tree : [tree];

    const addTreeNode = (
      node: GraphNode<N> & { children?: GraphNode<N>[] },
      parentId?: ID,
    ) => {
      // Add the node itself
      this.addNode({ id: node.id, data: node.data });

      // Set parent relationship if parent exists
      if (parentId !== undefined) {
        this.setParent(node.id, parentId, actualTreeName);
      }

      // Recursively add children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          addTreeNode(child as any, node.id);
        });
      }
    };

    trees.forEach((t) => addTreeNode(t));
  }

  /**
   * <zh/> 检查是否有树结构
   *
   * <en/> Check if has tree structure
   */
  hasTreeStructure(treeName: string): boolean {
    return this.parentMap.has(treeName);
  }

  /**
   * <zh/> 设置父节点
   *
   * <en/> Set parent node
   */
  setParent(childId: ID, parentId: ID, treeName?: string): void {
    const actualTreeName =
      treeName || ((this.options.tree?.[0] ?? 'default') as string);

    if (!this.parentMap.has(actualTreeName)) {
      this.attachTreeStructure(actualTreeName);
    }

    const treeParentMap = this.parentMap.get(actualTreeName)!;
    const treeChildrenMap = this.childrenMap.get(actualTreeName)!;

    // Remove from old parent
    const oldParent = treeParentMap.get(childId);
    if (oldParent !== undefined) {
      treeChildrenMap.get(oldParent)?.delete(childId);
    }

    // Set new parent
    treeParentMap.set(childId, parentId);

    // Add to new parent's children
    if (!treeChildrenMap.has(parentId)) {
      treeChildrenMap.set(parentId, new Set());
    }
    treeChildrenMap.get(parentId)!.add(childId);
  }

  /**
   * <zh/> 获取父节点
   *
   * <en/> Get parent node
   */
  getParent(nodeId: ID, treeName?: string): GraphNode<N> | null | undefined {
    const actualTreeName =
      treeName || ((this.options.tree?.[0] ?? 'default') as string);

    // Ensure tree structure exists
    if (!this.parentMap.has(actualTreeName)) {
      this.attachTreeStructure(actualTreeName);
    }

    const treeParentMap = this.parentMap.get(actualTreeName);

    if (!treeParentMap) return undefined;

    const parentId = treeParentMap.get(nodeId);
    if (parentId === undefined) {
      // Node has no parent set
      return null;
    }
    return this.nodes.get(parentId);
  }

  /**
   * <zh/> 获取子节点
   *
   * <en/> Get children nodes
   */
  getChildren(nodeId: ID, treeName?: string): GraphNode<N>[] {
    const actualTreeName =
      treeName || ((this.options.tree?.[0] ?? 'default') as string);
    const treeChildrenMap = this.childrenMap.get(actualTreeName);

    if (!treeChildrenMap) return [];

    const childIds = treeChildrenMap.get(nodeId);
    if (!childIds) return [];

    return Array.from(childIds)
      .map((id) => this.nodes.get(id))
      .filter((node): node is GraphNode<N> => node !== undefined);
  }

  /**
   * <zh/> 获取根节点（没有父节点的节点）
   *
   * <en/> Get root nodes (nodes without parents)
   */
  getRoots(treeName?: string): GraphNode<N>[] {
    const actualTreeName =
      treeName || ((this.options.tree?.[0] ?? 'default') as string);
    const treeParentMap = this.parentMap.get(actualTreeName);

    const roots: GraphNode<N>[] = [];
    this.nodes.forEach((node) => {
      const hasParent =
        treeParentMap && treeParentMap.get(node.id) !== undefined;
      if (!hasParent) {
        roots.push(node);
      }
    });

    return roots;
  }

  dfsTree(startId: ID, visit: (node: GraphNode<N>) => boolean | void) {
    const stack: ID[] = [startId];
    const visited: Set<ID> = new Set();

    while (stack.length > 0) {
      const nodeId = stack.pop()!;
      if (visited.has(nodeId)) continue;

      const node = this.getNode(nodeId);
      if (node) {
        visited.add(nodeId);
        const shouldSkipChildren = visit(node);
        if (shouldSkipChildren === true) continue;

        const children = this.getChildren(nodeId);
        // Push children in reverse order so they are processed in the correct order
        for (let i = children.length - 1; i >= 0; i--) {
          if (!visited.has(children[i].id)) {
            stack.push(children[i].id);
          }
        }
      }
    }
  }
}
