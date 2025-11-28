import { Graph, LayoutMapping, PointTuple } from '../types';

/**
 * Assign or only return the result for the graph who has no nodes or only one node.
 * @param graph original graph
 * @param assign whether assign result to original graph
 * @param center the layout center
 * @returns
 */
export const handleSingleNodeGraph = (
  graph: Graph,
  assign: boolean,
  center: PointTuple,
) => {
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();
  if (!nodes?.length) {
    const result = { nodes: [] as any[], edges };
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
          },
        },
      ],
      edges,
    };
    return result;
  }
};

/**
 * Return the layout result for a graph with zero or one node.
 * @param graph original graph
 * @param center the layout center
 * @returns layout result
 */
export function applySingleNodeLayout(
  assign: boolean,
  graph: Graph,
  center: PointTuple,
  dimensions: 2 | 3 = 2,
): LayoutMapping | void {
  const nodes = graph.getAllNodes();
  const edges = graph.getAllEdges();

  if (!nodes?.length) {
    if (assign) return;
    return { nodes: [], edges };
  }

  if (assign) {
    graph.mergeNodeData(nodes[0].id, {
      x: center[0],
      y: center[1],
      ...(dimensions === 3 ? { z: center[2] } : {}),
    });
    return;
  }

  return {
    nodes: [
      {
        ...nodes[0],
        data: {
          ...nodes[0].data,
          x: center[0],
          y: center[1],
          ...(dimensions === 3 ? { z: center[2] } : {}),
        },
      },
    ],
    edges,
  };
}
