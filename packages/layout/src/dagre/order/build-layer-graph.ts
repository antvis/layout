import { Graph } from "@antv/graphlib";
import { Graph as IGraph } from "../../types";

/*
 * Constructs a graph that can be used to sort a layer of nodes. The graph will
 * contain all base and subgraph nodes from the request layer in their original
 * hierarchy and any edges that are incident on these nodes and are of the type
 * requested by the "relationship" parameter.
 *
 * Nodes from the requested rank that do not have parents are assigned a root
 * node in the output graph, which is set in the root graph attribute. This
 * makes it easy to walk the hierarchy of movable nodes during ordering.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG
 *    2. Base nodes in the input graph have a rank attribute
 *    3. Subgraph nodes in the input graph has minRank and maxRank attributes
 *    4. Edges have an assigned weight
 *
 * Post-conditions:
 *
 *    1. Output graph has all nodes in the movable rank with preserved
 *       hierarchy.
 *    2. Root nodes in the movable layer are made children of the node
 *       indicated by the root attribute of the graph.
 *    3. Non-movable nodes incident on movable nodes, selected by the
 *       relationship parameter, are included in the graph (without hierarchy).
 *    4. Edges incident on movable nodes, selected by the relationship
 *       parameter, are added to the output graph.
 *    5. The weights for copied edges are aggregated as need, since the output
 *       graph is not a multi-graph.
 */
const buildLayerGraph = (g: IGraph, rank: number, direction: "in" | "out") => {
  const root = createRootNode(g);
  const result = new Graph({
    tree: [
      {
        id: root,
        children: [],
        data: {},
      },
    ],
  });

  g.getAllNodes().forEach((v) => {
    const parent = g.getParent(v.id);

    if (
      v.data.rank === rank ||
      ((v.data.minRank as number) <= rank && rank <= (v.data.maxRank as number))
    ) {
      result.addNode(v);
      result.setParent(v.id, parent?.id || root);

      // This assumes we have only short edges!
      g.getRelatedEdges(v.id, direction).forEach((e) => {
        const u = e.source === v.id ? e.target : e.source;
        if (!result.hasNode(u)) {
          result.addNode(g.getNode(u));
        }
        // const edge = result.edgeFromArgs(u, v);
        const edge = result
          .getRelatedEdges(u, "out")
          .find(({ target }) => target === v.id);
        const weight = edge !== undefined ? (edge.data.weight as number) : 0;

        result.addEdge({
          id: `e${u}-${v.id}-${Math.random()}`,
          source: u,
          target: v.id,
          data: {
            weight: e.data.weight! + weight!,
          },
        });
      });

      if ("minRank" in v.data) {
        result.updateNodeData(v.id, {
          ...v.data,
          // @ts-ignore
          borderLeft: v.data.borderLeft[rank],
          // @ts-ignore
          borderRight: v.data.borderRight[rank],
        });
      }
    }
  });

  return result;
};

const createRootNode = (g: IGraph) => {
  let v;
  while (g.hasNode((v = `_root${Math.random()}`)));
  return v;
};

export default buildLayerGraph;
