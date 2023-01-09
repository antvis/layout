import { Graph } from "@antv/graphlib";
import * as d3Force from 'd3-force';
import { Node, Edge, LayoutMapping, OutNode, D3ForceLayoutOptions, SyncLayout } from "../types";
import { isArray, isFunction, isNumber, isObject } from "../util";
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
}

/**
 * Layout the nodes' positions with d3's basic classic force
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new D3ForceLayout({ center: [100, 100] });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new D3ForceLayout({ center: [100, 100] });
 * const positions = layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { center: [100, 100] });
 */
export class D3ForceLayout implements SyncLayout<D3ForceLayoutOptions> {
  id = 'd3force'
  constructor(public options: D3ForceLayoutOptions = {} as D3ForceLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<Node, Edge>, options?: D3ForceLayoutOptions): LayoutMapping {
    return this.genericForceLayout(false, graph, options) as LayoutMapping;
  }
  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<Node, Edge>, options?: D3ForceLayoutOptions) {
    this.genericForceLayout(true, graph, options);
  }

  private ticking: boolean;

  private genericForceLayout(assign: boolean, graph: Graph<Node, Edge>, options?: D3ForceLayoutOptions): LayoutMapping | void {
    const mergedOptions = { ...this.options, ...options };
    const { layoutInvisibles } = mergedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();
    if (!layoutInvisibles) {
      nodes = nodes.filter(node => node.data.visible || node.data.visible === undefined);
      edges = edges.filter(edge => edge.data.visible || edge.data.visible === undefined);
    }
    const layoutNodes: CalcNode[] = nodes.map(node => ({
      ...node,
      x: node.data.x,
      y: node.data.y
    }));

    if (this.ticking) return;

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
      onLayoutEnd,
    } = mergedOptions;
    let { forceSimulation } = mergedOptions;
    if (!forceSimulation) {
      try {
        // 定义节点的力
        const nodeForce = d3Force.forceManyBody();
        if (nodeStrength) {
          nodeForce.strength(nodeStrength);
        }
        forceSimulation = d3Force.forceSimulation().nodes(layoutNodes as any);

        if (clustering) {
          const clusterForce = forceInBox() as any;
          clusterForce
            .centerX(center[0])
            .centerY(center[1])
            .template("force")
            .strength(clusterFociStrength);
          if (edges) {
            clusterForce.links(edges);
          }
          if (layoutNodes) {
            clusterForce.nodes(layoutNodes);
          }
          clusterForce
            .forceLinkDistance(clusterEdgeDistance)
            .forceLinkStrength(clusterEdgeStrength)
            .forceCharge(clusterNodeStrength)
            .forceNodeSize(clusterNodeSize);

          forceSimulation.force("group", clusterForce);
        }
        forceSimulation
          .force("center", d3Force.forceCenter(center[0], center[1]))
          .force("charge", nodeForce)
          .alpha(alpha)
          .alphaDecay(alphaDecay)
          .alphaMin(alphaMin);

        if (preventOverlap) {
          this.overlapProcess(forceSimulation, { nodeSize, nodeSpacing, collideStrength });
        }
        // 如果有边，定义边的力
        if (edges) {
          // d3 的 forceLayout 会重新生成边的数据模型，为了避免污染源数据
          const edgeForce = d3Force
            .forceLink()
            .id((d: any) => d.id)
            .links(edges);
          if (edgeStrength) {
            edgeForce.strength(edgeStrength);
          }
          if (linkDistance) {
            edgeForce.distance(linkDistance);
          }
          forceSimulation.force("link", edgeForce);
        }
        
        forceSimulation
        .on("tick", () => {
          onTick?.({
            nodes: formatOutNodes(layoutNodes),
            edges: graph.getAllEdges(),
          });
        })
        .on("end", () => {
          this.ticking = false;
          onLayoutEnd?.({
            nodes: formatOutNodes(layoutNodes),
            edges: graph.getAllEdges(),
          });
        });
        this.ticking = true;

      } catch (e) {
        this.ticking = false;
        console.warn(e);
      }
    } else {
      // forceSimulation is defined
      if (clustering) {
        const clusterForce = forceInBox() as any;
        clusterForce.nodes(layoutNodes);
        clusterForce.links(edges);
      }
      forceSimulation.nodes(layoutNodes);
      if (edges) {
        // d3 的 forceLayout 会重新生成边的数据模型，为了避免污染源数据
        const edgeForce = d3Force
          .forceLink()
          .id((d: any) => d.id)
          .links(edges);
        if (edgeStrength) {
          edgeForce.strength(edgeStrength);
        }
        if (linkDistance) {
          edgeForce.distance(linkDistance);
        }
        forceSimulation.force("link", edgeForce);
      }
      if (preventOverlap) {
        this.overlapProcess(forceSimulation, { nodeSize, nodeSpacing, collideStrength });
      }
      forceSimulation.alpha(alpha).restart();
      this.ticking = true;
    }
    
    // since d3 writes x and y as node's first level properties, format them into data
    const outNodes = formatOutNodes(layoutNodes);

    if (assign) {
      outNodes.forEach(node => graph.mergeNodeData(node.id, {
        x: node.data.x,
        y: node.data.y
      }))
    }

    onLayoutEnd?.();

    return {
      nodes: outNodes,
      edges: graph.getAllEdges()
    };
  }

  /**
  * 防止重叠
  * @param {object} simulation 力模拟模型
  */
  public overlapProcess(
    simulation: any,
    options: {
      nodeSize: number | number[] | ((d?: Node) => number) | undefined;
      nodeSpacing: number | number[] | ((d?: Node) => number) | undefined;
      collideStrength: number;
    }) {
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
          }  if (isObject(d.size)) {
            const res = d.size.width > d.size.height ? d.size.width : d.size.height;
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
      "collisionForce",
      d3Force.forceCollide(nodeSizeFunc).strength(collideStrength)
    );
  }
}

const formatOutNodes = (layoutNodes: CalcNode[]): OutNode[] => layoutNodes.map(node => {
  const { x, y, ...others } = node;
  return {
    ...others,
    data: {
      ...others.data,
      x,
      y,
    }
  }
});