import { Edge, Graph, Node } from "../graph";
import { addDummyNode } from "./util";

/*
 * Breaks any long edges in the graph into short segments that span 1 layer
 * each. This operation is undoable with the denormalize function.
 *
 * Pre-conditions:
 *
 *    1. The input graph is a DAG.
 *    2. Each node in the graph has a "rank" property.
 *
 * Post-condition:
 *
 *    1. All edges in the graph have a length of 1.
 *    2. Dummy nodes are added where edges have been split into segments.
 *    3. The graph is augmented with a "dummyChains" attribute which contains
 *       the first dummy in each chain of dummy nodes produced.
 */
const run = (g: Graph) => {
  g.graph().dummyChains = [];
  g.edges().forEach((edge) => normalizeEdge(g, edge));
};

const normalizeEdge = (g: Graph, e: Edge) => {
  let v = e.v;
  let vRank = g.node(v)!.rank as number;
  const w = e.w;
  const wRank = g.node(w)!.rank as number;
  const name = e.name;
  const edgeLabel = g.edge(e)!;
  const labelRank = edgeLabel.labelRank;

  if (wRank === vRank + 1) return;

  g.removeEdgeObj(e);

  const graph = g.graph();

  let dummy: string;
  let attrs: Node<Record<string, any>>;
  let i;
  for (i = 0, ++vRank; vRank < wRank; ++i, ++vRank) {
    edgeLabel.points = [];
    attrs = {
      edgeLabel,
      width: 0,
      height: 0,
      edgeObj: e,
      rank: vRank,
    };
    dummy = addDummyNode(g, "edge", attrs, "_d");
    if (vRank === labelRank) {
      attrs.width = edgeLabel.width!;
      attrs.height = edgeLabel.height!;
      attrs.dummy = "edge-label";
      attrs.labelpos = edgeLabel.labelpos;
    }
    g.setEdge(v, dummy, { weight: edgeLabel.weight }, name);
    if (i === 0) {
      if (!graph.dummyChains) graph.dummyChains = [];
      graph.dummyChains!.push(dummy);
    }
    v = dummy;
  }

  g.setEdge(v, w, { weight: edgeLabel.weight }, name);
};

const undo = (g: Graph) => {
  g.graph().dummyChains?.forEach((v) => {
    let node = g.node(v)!;
    const origLabel = node.edgeLabel;
    let w;
    if (node.edgeObj) {
      g.setEdgeObj(node.edgeObj, origLabel);
    }

    let currentV  = v;
    while (node.dummy) {
      w = g.successors(currentV)![0];
      g.removeNode(currentV);
      origLabel.points.push({ x: node.x, y: node.y });
      if (node.dummy === "edge-label") {
        origLabel.x = node.x;
        origLabel.y = node.y;
        origLabel.width = node.width;
        origLabel.height = node.height;
      }
      currentV = w;
      node = g.node(currentV)!;
    }
  });
};

export default { run, undo };
