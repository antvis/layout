import {
  cloneFormatData,
  AntVDagreLayoutOptions,
  Edge,
  Graph,
  Layout,
  LayoutMapping,
  OutNode,
  OutNodeData,
} from '@antv/layout';
import { isNumber } from '@antv/util';
import type { WASMLayoutOptions } from './interface';
import { graphlib2WASMInput } from './util';

const DEFAULTS_LAYOUT_OPTIONS: Partial<AntVDagreLayoutOptions> = {
  nodesep: 50,
  ranksep: 50,
  rankdir: 'tb',
};

interface WASMAntVDagreLayoutOptions
  extends AntVDagreLayoutOptions,
    WASMLayoutOptions {}

interface FormattedOptions extends WASMAntVDagreLayoutOptions {}

/**
 * Layout with dagre
 *
 * @example
 */
export class AntVDagreLayout implements Layout<WASMAntVDagreLayoutOptions> {
  id = 'dagreWASM';

  constructor(
    public options: WASMAntVDagreLayoutOptions = {} as WASMAntVDagreLayoutOptions,
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: AntVDagreLayoutOptions) {
    return this.genericFruchtermanLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: AntVDagreLayoutOptions) {
    this.genericFruchtermanLayout(true, graph, options);
  }

  private async genericFruchtermanLayout(
    assign: false,
    graph: Graph,
    options?: AntVDagreLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericFruchtermanLayout(
    assign: true,
    graph: Graph,
    options?: AntVDagreLayoutOptions,
  ): Promise<void>;
  private async genericFruchtermanLayout(
    assign: boolean,
    graph: Graph,
    options?: AntVDagreLayoutOptions,
  ): Promise<LayoutMapping | void> {
    const formattedOptions = this.formatOptions(options);
    const { threads, nodesep, ranksep, rankdir, align, begin } =
      formattedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!nodes?.length) {
      return { nodes: [], edges };
    }

    if (nodes.length === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: 0,
          y: 0,
        });
      }
      return {
        nodes: [
          {
            ...nodes[0],
            data: {
              ...nodes[0].data,
              x: 0,
              y: 0,
            },
          },
        ],
        edges,
      };
    }

    const layoutNodes: OutNode[] = nodes.map(
      (node) => cloneFormatData(node) as OutNode,
    );
    layoutNodes.forEach((node, i) => {
      if (!isNumber(node.data.x)) node.data.x = 0;
      if (!isNumber(node.data.y)) node.data.y = 0;
    });
    const layoutEdges: Edge[] = edges.map(
      (edge) => cloneFormatData(edge) as Edge,
    );

    const wasmInput = graphlib2WASMInput(layoutNodes, edges, 2, true);

    const { nodes: nodePositions, edges: edgePositions } = await threads.dagre({
      nodes: wasmInput.nodes,
      edges: wasmInput.edges,
      masses: wasmInput.masses,
      weights: wasmInput.weights,
      nodesep,
      edgesep: 20,
      marginx: 0,
      marginy: 0,
      rankdir: rankdir.toLowerCase() as 'lr' | 'rl' | 'tb' | 'bt',
      ranksep,
      align: align.toLowerCase() as 'ul' | 'ur' | 'dl' | 'dr',
    });

    layoutNodes.forEach((node, i) => {
      node.data.x = nodePositions[i].x;
      node.data.y = nodePositions[i].y;
    });
    layoutEdges.forEach((edge, i) => {
      edge.data.x = edgePositions[i].x;
      edge.data.y = edgePositions[i].y;
      const { points } = edgePositions[i];
      edge.data.controlPoints = [];
      for (let i = 0; i < points.length; i += 2) {
        edge.data.controlPoints.push({
          x: points[i],
          y: points[i + 1],
        });
      }
    });

    const layoutTopLeft = [0, 0];
    if (begin) {
      let minX = Infinity;
      let minY = Infinity;
      layoutNodes.forEach((node) => {
        if (minX > node.data.x!) minX = node.data.x!;
        if (minY > node.data.y!) minY = node.data.y!;
      });
      layoutEdges.forEach((edge) => {
        edge.data.controlPoints?.forEach((point) => {
          if (minX > point.x) minX = point.x;
          if (minY > point.y) minY = point.y;
        });
      });
      layoutTopLeft[0] = begin[0] - minX;
      layoutTopLeft[1] = begin[1] - minY;

      layoutNodes.forEach((node) => {
        node.data.x! += layoutTopLeft[0];
        node.data.y! += layoutTopLeft[1];
      });
      layoutEdges.forEach((edge) => {
        edge.data.controlPoints?.forEach((point) => {
          point.x += layoutTopLeft[0];
          point.y += layoutTopLeft[1];
        });
      });
    }

    if (assign) {
      layoutNodes.forEach(({ id, data }) => {
        const nodeData: OutNodeData = {
          x: data.x,
          y: data.y,
        };
        graph.mergeNodeData(id, nodeData);
      });
    }

    return { nodes: layoutNodes, edges: layoutEdges };
  }

  private formatOptions(options: AntVDagreLayoutOptions = {}): FormattedOptions {
    const mergedOptions = { ...this.options, ...options } as FormattedOptions;

    return mergedOptions;
  }
}
