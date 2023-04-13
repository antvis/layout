var Benchmark = require("benchmark");
var suite = new Benchmark.Suite();

const NODE_NUM = 2000;
const EDGE_NUM = 2000;
const ITERATIONS = 100;

/**
 * Graphology
 */
var Graph = require("graphology");
var graphologyLayout = require("graphology-layout-forceatlas2");
var randomClusters = require("graphology-generators/random/clusters");
var seedrandom = require("seedrandom");
var rng = function () {
  return seedrandom("bench");
};
var graph = randomClusters(Graph, {
  order: NODE_NUM,
  size: EDGE_NUM,
  clusters: 5,
  rng: rng(),
});
graph.nodes().forEach(function (node) {
  graph.setNodeAttribute(node, "x", Math.random());
  graph.setNodeAttribute(node, "y", Math.random());
});

/**
 * @antv/layout
 */
var { ForceAtlas2Layout } = require("@antv/layout");
const antvForceAtlas2Layout = new ForceAtlas2Layout({
  type: "forceAtlas2",
  maxIteration: ITERATIONS,
  barnesHut: true,
  mode: "normal",
});
const graphModel = {
  nodes: graph.nodes().map((id) => ({
    id: id,
    x: graph.getNodeAttribute(id, "x"),
    y: graph.getNodeAttribute(id, "y"),
  })),
  edges: graph.edges().map((id) => ({
    source: graph.source(id),
    target: graph.target(id),
  })),
};
const edges = [];
graph.edges().forEach((id) => {
  edges.push([Number(graph.source(id)), Number(graph.target(id))]);
});

/**
 * @antv/layout-wasm
 */
var antvLayoutWASM = require("../pkg-node/antv_layout_wasm.js");
antvLayoutWASM.start();

// add tests
suite
  .add("Graphology", function () {
    graphologyLayout(graph, {
      settings: {
        barnesHutOptimize: true,
        linLogMode: false,
      },
      iterations: ITERATIONS,
    });
  })
  .add("@antv/layout", function () {
    antvForceAtlas2Layout.layout(graphModel);
  })
  .add("@antv/layout-wasm", function () {
    antvLayoutWASM.forceAtlas2({
      nodes: NODE_NUM,
      edges,
      iterations: ITERATIONS,
      ka: 0.5,
      kg: 1.0,
      kr: 0.1,
      speed: 1.0,
      prevent_overlapping: false,
      node_radius: 1,
      strong_gravity: false,
      lin_log: false,
    });
  })
  // add listeners
  .on("cycle", function (event) {
    console.log(String(event.target));
  })
  .on("complete", function () {
    console.log("Fastest is " + this.filter("fastest").map("name"));
  })
  .run({ async: true });

// logs:
// Graphology x 5.86 ops/sec ±2.28% (19 runs sampled)
// @antv/layout x 0.36 ops/sec ±2.26% (5 runs sampled)
// @antv/layout-wasm x 21.52 ops/sec ±0.68% (40 runs sampled)
// Fastest is @antv/layout-wasm
