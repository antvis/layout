import { Graph, Layout, LayoutMapping, EdgeData, NodeData, parseSize } from '@antv/layout';
import { Graphviz } from '@hpcc-js/wasm-graphviz';

import { Dot } from './dot';
import { Edge } from './edge';
import { Graph as GraphvizGraph } from './graph';
import { Mapping } from './mapping';
import { Node } from './node';
import type { TProcessData, GraphvizDotLayoutOptions } from './types';
import { parsePathToPoints } from '../util';
import { isFunction } from '@antv/util';

export class GraphvizDotLayout implements Layout<GraphvizDotLayoutOptions> {
  static defaultOptions: Partial<GraphvizDotLayoutOptions> = {};

  public gp: Promise<Graphviz> = Graphviz.load();

  public id = 'graphvizDotWASM';

  public options: Partial<GraphvizDotLayoutOptions> = {
    preLayout: true,
  };

  constructor(options: Partial<GraphvizDotLayoutOptions>) {
    Object.assign(this.options, GraphvizDotLayout.defaultOptions, options);
  }

  async execute(graph: Graph, options?: GraphvizDotLayoutOptions): Promise<LayoutMapping> {
    return this.generateLayout(false, graph, {
      ...this.options,
      ...options,
    });
  }

  async assign(graph: Graph, options?: GraphvizDotLayoutOptions): Promise<void> {
    await this.generateLayout(true, graph, { ...this.options, ...options });
  }

  private async generateLayout(assign: boolean, graph: Graph, options: GraphvizDotLayoutOptions) {
    const graphviz = await this.gp;

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    const processData = this.getProcessData(nodes, edges, options);

    const graphvizGraph = new GraphvizGraph(processData as any, options);
    const dot = new Dot(graphvizGraph).getOutput();
    // 只有 svg 中有完整布局信息位置
    const dotOutputStr = graphviz.layout(dot!.outputString, 'svg', 'dot');

    const _mapping = new Mapping(dotOutputStr, dot!.outputMap);

    const mapping: LayoutMapping = { nodes: [], edges: [] };

    _mapping.getLayoutMap().forEach((ele) => {
      if (ele instanceof Node) {
        mapping.nodes.push({
          id: ele.node.id,
          data: {
            ...ele.node.data,
            x: ele.layout.position?.x,
            y: ele.layout.position?.y,
            width: ele.layout.size?.width,
            height: ele.layout.size?.height,
          },
        });
      } else if (ele instanceof Edge) {
        mapping.edges.push({
          id: ele.edge.id,
          source: ele.edge.source,
          target: ele.edge.target,
          data: {
            points: parsePathToPoints(ele.layout.path),
            labelPosition: ele.layout.labelPosition,
            weight: ele.attrs.weight,
          },
        });
      }
    });

    return mapping;
  }
  private getProcessData(
    nodes: ReturnType<Graph['getAllNodes']>,
    edges: ReturnType<Graph['getAllEdges']>,
    options: GraphvizDotLayoutOptions
  ): TProcessData {
    const { nodeSize } = options;
    return {
      nodes: nodes.map((node) => {
        const data = { ...node.data };
        if (nodeSize !== undefined) {
          const [width, height] = parseSize(
            isFunction(nodeSize) ? nodeSize(node) : nodeSize,
          );
          Object.assign(data, { width, height });
        }
        return {
          id: String(node.id),
          data,
        };
      }) as NodeData[],
      edges: edges.map((edge) => ({
        id: String(edge.id),
        source: String(edge.source),
        target: String(edge.target),
        data: edge.data,
      })) as EdgeData[],
    };
  }
}
