var { Graph } = require("@antv/graphlib");

const graphology2antv = (graph) => {
  return new Graph({
    nodes: graph.nodes().map((id) => ({
      id,
      data: {
        x: graph.getNodeAttribute(id, "x"),
        y: graph.getNodeAttribute(id, "y"),
      },
    })),
    edges: graph.edges().map((id) => ({
      id,
      source: graph.source(id),
      target: graph.target(id),
      data: {
        weight: graph.getEdgeAttribute(id, "weight"),
      },
    })),
  });
};

const graphology2antv_wasm = (graph) => {
  const nodes = [];
  const masses = [];
  const edges = [];
  const weights = [];
  const nodeIdxMap = {};
  graph.nodes().forEach((id, i) => {
    nodeIdxMap[id] = i;
    nodes.push(
      graph.getNodeAttribute(id, "x"),
      graph.getNodeAttribute(id, "y")
    );
    masses.push(1);
  });
  graph.edges().forEach((id) => {
    const weight = graph.getEdgeAttribute(id, "weight");
    const source = nodeIdxMap[graph.source(id)];
    const target = nodeIdxMap[graph.target(id)];

    if (source !== undefined && target !== undefined) {
      // n1 <- n2
      edges.push([target, source]);
      weights.push(weight);
      // @see https://github.com/graphology/graphology/blob/master/src/layout-forceatlas2/helpers.js#L156-L158
      masses[source] += weight;
      masses[target] += weight;
    }
  });

  return {
    nodes,
    masses,
    edges,
    weights,
  };
};

module.exports = { graphology2antv, graphology2antv_wasm };
