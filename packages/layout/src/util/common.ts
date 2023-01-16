import { PointTuple, LayoutMapping, Graph } from "../types";

/**
 * Assign or only return the result for the graph who has no nodes or only one node.
 * @param graph original graph
 * @param assign whether assign result to original graph
 * @param center the layout center
 * @param onLayoutEnd callback for layout end
 * @returns 
 */
export const handleSingleNodeGraph = (
  graph: Graph,
  assign: boolean,
  center: PointTuple,
  onLayoutEnd?: (data: LayoutMapping) => void
) => {
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();
  if (!nodes?.length) {
    const result = { nodes: [], edges };
    onLayoutEnd?.(result);
    return result;
  }
  if (nodes.length === 1) {
    if (assign) {
      graph.mergeNodeData(nodes[0].id, {
        x: center[0],
        y: center[1],
      });
    }
    const result = {
      nodes: [
        {
          ...nodes[0],
          data: {
            ...nodes[0].data,
            x: center[0],
            y: center[1],
          }
        }
      ],
      edges,
    };
    onLayoutEnd?.(result);
    return result;
  }
}