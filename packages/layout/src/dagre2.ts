import { parseSize, type Size } from './util/size';
import type { Graph, Layout, LayoutMapping, Node } from './types';
import { isFunction, isNumber } from '@antv/util';
import dagre, { graphlib } from '@dagrejs/dagre';

import type { EdgeConfig, GraphLabel, NodeConfig } from '@dagrejs/dagre';

/**
 * <zh/> Dagre2(@dagrejs/dagre) 布局
 * 
 * <en/> Dagre2(@dagrejs/dagre) layout
 */
export interface Dagre2LayoutOptions extends GraphLabel, NodeConfig, EdgeConfig {
  nodeSize?: Size | ((node: Node) => Size);
  preLayout?: boolean;
}

export class Dagre2Layout implements Layout<Dagre2LayoutOptions> {
  static defaultOptions: Partial<Dagre2LayoutOptions> = {};

  public id = 'dagre2';

  public options: Partial<Dagre2LayoutOptions> = {};

  constructor(options: Partial<Dagre2LayoutOptions>) {
    Object.assign(this.options, Dagre2Layout.defaultOptions, options);
  }

  async execute(graph: Graph, options?: Dagre2LayoutOptions): Promise<LayoutMapping> {
    return this.genericDagreLayout(false, graph, {
      ...this.options,
      ...options,
    });
  }

  async assign(graph: Graph, options?: Dagre2LayoutOptions): Promise<void> {
    await this.genericDagreLayout(true, graph, { ...this.options, ...options });
  }

  private async genericDagreLayout(assign: boolean, graph: Graph, options?: Dagre2LayoutOptions) {
    const { nodeSize } = options;
    const g = new graphlib.Graph({
      multigraph: true,
      compound: true,
    });
    g.setGraph(options);
    g.setDefaultEdgeLabel(() => ({}));

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    if ([...nodes, ...edges].some(({ id }) => isNumber(id))) {
      console.error('Dagre layout only support string id, it will convert number to string.');
    }

    nodes.forEach((node) => {
      const { id } = node;
      const data = { ...node.data };
      if (nodeSize !== undefined) {
        const [width, height] = parseSize(isFunction(nodeSize) ? nodeSize(node as Node) : nodeSize);
        Object.assign(data, { width, height });
      }
      g.setNode(id.toString(), data);
    });

    edges.forEach(({ id, source, target, data }) => {
      g.setEdge(source.toString(), target.toString(), { id });
    });

    dagre.layout(g);

    const mapping: LayoutMapping = { nodes: [], edges: [] };

    g.nodes().forEach((id) => {
      const data = g.node(id);
      mapping.nodes.push({ id, data });
      if (assign) graph.mergeNodeData(id, data);
    });

    g.edges().forEach((edge) => {
      const { id, ...data } = g.edge(edge);
      const { v: source, w: target } = edge;
      mapping.edges.push({ id, source, target, data });
      if (assign) graph.mergeEdgeData(id, data);
    });

    return mapping;
  }
}
