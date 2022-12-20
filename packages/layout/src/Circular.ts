import type { Graph } from "@antv/graphlib";
import type { CircularLayoutOptions, SyncLayout, LayoutMapping, PointTuple } from "./types";

const DEFAULTS_LAYOUT_OPTIONS: Partial<CircularLayoutOptions> = {
  radius: null,
  startRadius: null,
  endRadius: null,
  startAngle: 0,
  endAngle: 2 * Math.PI,
  clockwise: true,
  divisions: 1,
  ordering: null,
  angleRatio: 1
}

/**
 * Layout arranging the nodes in a circle.
 * 
 * @example
 * // Assign layout options when initialization.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = layout.execute(graph); // { nodes: [], edges: [] }
 * 
 * // Or use different options later.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = layout.execute(graph, { radius: 20 }); // { nodes: [], edges: [] }
 * 
 * // If you want to assign the positions directly to the nodes, use assign method.
 * layout.assign(graph, { radius: 20 });
 */
export class CircularLayout implements SyncLayout<CircularLayoutOptions> {
  constructor(private options: CircularLayoutOptions = {} as CircularLayoutOptions) {
    Object.assign(this.options, DEFAULTS_LAYOUT_OPTIONS, options);
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  execute(graph: Graph<any, any>, options?: CircularLayoutOptions): LayoutMapping {
    return this.genericCircularLayout(false, graph, options) as LayoutMapping;
  }

  /**
   * To directly assign the positions to the nodes.
   */
  assign(graph: Graph<{ x: number; y: number; }, any>, options?: CircularLayoutOptions) {
    this.genericCircularLayout(true, graph, options);
  }

  private genericCircularLayout(assign: boolean, graph: Graph<any, any>, options?: CircularLayoutOptions): LayoutMapping | void {
    const { width, height, center, radius, startRadius, endRadius, divisions, startAngle, endAngle, angleRatio, ordering, clockwise, nodeSpacing: paramNodeSpacing, nodeSize: paramNodeSize, onLayoutEnd } = { ...this.options, ...options };

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    const n = nodes.length;

    // Need no layout if there is no node.
    if (n === 0) {
      if (onLayoutEnd) {
        onLayoutEnd();
      }
      return {
        nodes: [],
        edges: [],
      };
    }

    // Calculate center according to `window` if not provided.
    const calculatedCenter = this.calculateCenter(width, height, center);

    // Layout easily if there is only one node.
    if (n === 1) {
      if (assign) {
        graph.updateNodeProperty(nodes[0].id, "x", calculatedCenter[0]);
        graph.updateNodeProperty(nodes[0].id, "y", calculatedCenter[1]);
      }
      
      if (onLayoutEnd) {
        onLayoutEnd();
      }
      return {
        nodes: [
          {
            id: `${nodes[0].id}`,
            x: calculatedCenter[0],
            y: calculatedCenter[1],
          }
        ],
        edges: [],
      };
    }

    // TODO
    // const angleStep = (endAngle - startAngle) / n;
    // // layout
    // const nodeMap: IndexMap = {};
    // nodes.forEach((node, i) => {
    //   nodeMap[node.id] = i;
    // });
  }
  
  private calculateCenter(width: number | undefined, height: number | undefined, center: PointTuple | undefined) {
    let calculatedWidth = width;
    let calculatedHeight = height;
    let calculatedCenter = center;
    if (!calculatedWidth && typeof window !== "undefined") {
      calculatedWidth = window.innerWidth;
    }
    if (!calculatedHeight && typeof window !== "undefined") {
      calculatedHeight = window.innerHeight;
    }
    if (!calculatedCenter) {
      calculatedCenter = [calculatedWidth! / 2, calculatedHeight! / 2];
    }
    return calculatedCenter;
  }
}
