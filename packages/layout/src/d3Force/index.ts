import { isFunction, isNumber, isObject } from '@antv/util';
import * as d3Force from 'd3-force';
import {
  D3ForceLayoutOptions,
  Edge,
  Graph,
  LayoutMapping,
  LayoutWithIterations,
  Node,
  OutNode,
} from '../types';
import { cloneFormatData, isArray } from '../util';
import forceInBox from './forceInBox';

/**
 * D3 writes x and y as the first level properties
 */
interface CalcNode extends Node {
  x: number;
  y: number;
}

const DEFAULTS_LAYOUT_OPTIONS: Partial<D3ForceLayoutOptions> = {
  center: [0, 0],
  preventOverlap: false,
  nodeSize: undefined,
  nodeSpacing: undefined,
  linkDistance: 50,
  forceSimulation: null,
  alphaDecay: 0.028,
  alphaMin: 0.001,
  alpha: 0.3,
  collideStrength: 1,
  clustering: false,
  clusterNodeStrength: -1,
  clusterEdgeStrength: 0.1,
  clusterEdgeDistance: 100,
  clusterFociStrength: 0.8,
  clusterNodeSize: 10,
};

/**
 * Layout the nodes' positions with d3's basic classic force
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new D3ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new D3ForceLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class D3ForceLayout
  implements LayoutWithIterations<D3ForceLayoutOptions>
{
  id = 'd3force';

  private forceSimulation: d3Force.Simulation<any, any>;

  private lastLayoutNodes: CalcNode[];
  private lastLayoutEdges: Edge[];
  private lastAssign: boolean;
  private lastGraph: Graph;

  constructor(
    public options: D3ForceLayoutOptions = {} as D3ForceLayoutOptions,
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: D3ForceLayoutOptions) {
    return this.genericForceLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: D3ForceLayoutOptions) {
    this.genericForceLayout(true, graph, options);
  }

  /**
   * Stop simulation immediately.
   */
  stop() {
    this.forceSimulation?.stop();
  }

  /**
   * Manually steps the simulation by the specified number of iterations.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick(iterations = 1) {
    this.forceSimulation.tick(iterations);

    const result = {
      nodes: formatOutNodes(this.lastLayoutNodes),
      edges: formatOutEdges(this.lastLayoutEdges),
    };

    if (this.lastAssign) {
      result.nodes.forEach((node) =>
        this.lastGraph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        }),
      );
    }

    return result;
  }

  private async genericForceLayout(
    assign: false,
    graph: Graph,
    options?: D3ForceLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericForceLayout(
    assign: true,
    graph: Graph,
    options?: D3ForceLayoutOptions,
  ): Promise<void>;
  private async genericForceLayout(
    assign: boolean,
    graph: Graph,
    options?: D3ForceLayoutOptions,
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    const layoutNodes: CalcNode[] = nodes.map(
      (node) =>
        ({
          ...cloneFormatData(node),
          x: node.data?.x,
          y: node.data?.y,
        } as CalcNode),
    );
    const layoutEdges: Edge[] = edges.map((edge) => cloneFormatData(edge));

    // Use them later in `tick`.
    this.lastLayoutNodes = layoutNodes;
    this.lastLayoutEdges = layoutEdges;
    this.lastAssign = assign;
    this.lastGraph = graph;

    const {
      alphaMin,
      alphaDecay,
      alpha,
      nodeStrength,
      edgeStrength,
      linkDistance,
      clustering,
      clusterFociStrength,
      clusterEdgeDistance,
      clusterEdgeStrength,
      clusterNodeStrength,
      clusterNodeSize,
      collideStrength = 1,
      center = [0, 0],
      preventOverlap,
      nodeSize,
      nodeSpacing,
      onTick,
    } = mergedOptions;
    let { forceSimulation } = mergedOptions;

    return new Promise((resolve) => {
      if (!forceSimulation) {
        try {
          // 定义节点的力
          const nodeForce = d3Force.forceManyBody();
          if (nodeStrength) {
            nodeForce.strength(nodeStrength as any);
          }
          forceSimulation = d3Force.forceSimulation().nodes(layoutNodes as any);

          if (clustering) {
            const clusterForce = forceInBox() as any;
            clusterForce
              .centerX(center[0])
              .centerY(center[1])
              .template('force')
              .strength(clusterFociStrength);
            if (layoutEdges) {
              clusterForce.links(layoutEdges);
            }
            if (layoutNodes) {
              clusterForce.nodes(layoutNodes);
            }
            clusterForce
              .forceLinkDistance(clusterEdgeDistance)
              .forceLinkStrength(clusterEdgeStrength)
              .forceCharge(clusterNodeStrength)
              .forceNodeSize(clusterNodeSize);

            forceSimulation.force('group', clusterForce);
          }
          forceSimulation
            .force('center', d3Force.forceCenter(center[0], center[1]))
            .force('charge', nodeForce)
            .alpha(alpha)
            .alphaDecay(alphaDecay)
            .alphaMin(alphaMin);

          if (preventOverlap) {
            this.overlapProcess(forceSimulation, {
              nodeSize,
              nodeSpacing,
              collideStrength,
            });
          }
          // 如果有边，定义边的力
          if (layoutEdges) {
            // d3 的 forceLayout 会重新生成边的数据模型，为了避免污染源数据
            const edgeForce = d3Force
              .forceLink()
              .id((d: any) => d.id)
              .links(layoutEdges);
            if (edgeStrength) {
              edgeForce.strength(edgeStrength as any);
            }
            if (linkDistance) {
              edgeForce.distance(linkDistance as any);
            }
            forceSimulation.force('link', edgeForce);
          }

          forceSimulation
            .on('tick', () => {
              const outNodes = formatOutNodes(layoutNodes);
              onTick?.({
                nodes: outNodes,
                edges: formatOutEdges(layoutEdges),
              });

              if (assign) {
                outNodes.forEach((node) =>
                  graph.mergeNodeData(node.id, {
                    x: node.data.x,
                    y: node.data.y,
                  }),
                );
              }
            })
            .on('end', () => {
              const outNodes = formatOutNodes(layoutNodes);

              if (assign) {
                outNodes.forEach((node) =>
                  graph.mergeNodeData(node.id, {
                    x: node.data.x,
                    y: node.data.y,
                  }),
                );
              }

              resolve({
                nodes: outNodes,
                edges: formatOutEdges(layoutEdges),
              });
            });
        } catch (e) {
          console.warn(e);
        }
      } else {
        // forceSimulation is defined
        if (clustering) {
          const clusterForce = forceInBox() as any;
          clusterForce.nodes(layoutNodes);
          clusterForce.links(layoutEdges);
        }
        forceSimulation.nodes(layoutNodes);
        if (layoutEdges) {
          // d3 的 forceLayout 会重新生成边的数据模型，为了避免污染源数据
          const edgeForce = d3Force
            .forceLink()
            .id((d: any) => d.id)
            .links(layoutEdges);
          if (edgeStrength) {
            edgeForce.strength(edgeStrength as any);
          }
          if (linkDistance) {
            edgeForce.distance(linkDistance as any);
          }
          forceSimulation.force('link', edgeForce);
        }
        if (preventOverlap) {
          this.overlapProcess(forceSimulation, {
            nodeSize,
            nodeSpacing,
            collideStrength,
          });
        }
        forceSimulation.alpha(alpha).restart();

        // since d3 writes x and y as node's first level properties, format them into data
        const outNodes = formatOutNodes(layoutNodes);
        const outEdges = formatOutEdges(layoutEdges);

        if (assign) {
          outNodes.forEach((node) =>
            graph.mergeNodeData(node.id, {
              x: node.data.x,
              y: node.data.y,
            }),
          );
        }

        resolve({
          nodes: outNodes,
          edges: outEdges,
        });
      }

      this.forceSimulation = forceSimulation;
    });
  }

  /**
   * Prevent overlappings.
   * @param {object} simulation force simulation of d3
   */
  public overlapProcess(
    simulation: d3Force.Simulation<any, any>,
    options: {
      nodeSize: number | number[] | ((d?: Node) => number) | undefined;
      nodeSpacing: number | number[] | ((d?: Node) => number) | undefined;
      collideStrength: number;
    },
  ) {
    const { nodeSize, nodeSpacing, collideStrength } = options;
    let nodeSizeFunc: (d: any) => number;
    let nodeSpacingFunc: any;

    if (isNumber(nodeSpacing)) {
      nodeSpacingFunc = () => nodeSpacing;
    } else if (isFunction(nodeSpacing)) {
      nodeSpacingFunc = nodeSpacing;
    } else {
      nodeSpacingFunc = () => 0;
    }

    if (!nodeSize) {
      nodeSizeFunc = (d) => {
        if (d.size) {
          if (isArray(d.size)) {
            const res = d.size[0] > d.size[1] ? d.size[0] : d.size[1];
            return res / 2 + nodeSpacingFunc(d);
          }
          if (isObject(d.size)) {
            const res =
              d.size.width > d.size.height ? d.size.width : d.size.height;
            return res / 2 + nodeSpacingFunc(d);
          }
          return d.size / 2 + nodeSpacingFunc(d);
        }
        return 10 + nodeSpacingFunc(d);
      };
    } else if (isFunction(nodeSize)) {
      nodeSizeFunc = (d) => {
        const size = nodeSize(d);
        return size + nodeSpacingFunc(d);
      };
    } else if (isArray(nodeSize)) {
      const larger = nodeSize[0] > nodeSize[1] ? nodeSize[0] : nodeSize[1];
      const radius = larger / 2;
      nodeSizeFunc = (d) => radius + nodeSpacingFunc(d);
    } else if (isNumber(nodeSize)) {
      const radius = (nodeSize as number) / 2;
      nodeSizeFunc = (d) => radius + nodeSpacingFunc(d);
    } else {
      nodeSizeFunc = () => 10;
    }

    // forceCollide's parameter is a radius
    simulation.force(
      'collisionForce',
      d3Force.forceCollide(nodeSizeFunc).strength(collideStrength),
    );
  }
}

/**
 * Format the calculation nodes into output nodes.
 * Since d3 reads properties in plain node data object which is not compact to the OutNode
 * @param layoutNodes
 * @returns
 */
const formatOutNodes = (layoutNodes: CalcNode[]): OutNode[] =>
  layoutNodes.map((node) => {
    const { x, y, ...others } = node;
    return {
      ...others,
      data: {
        ...others.data,
        x,
        y,
      },
    };
  });

/**
 * d3 will modify `source` and `target` on edge object.
 */
const formatOutEdges = (edges: any[]): Edge[] =>
  edges.map((edge) => {
    const { source, target, ...rest } = edge;
    return {
      ...rest,
      source: source.id,
      target: target.id,
    };
  });
