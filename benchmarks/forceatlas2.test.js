var Benchmark = require("benchmark");
var suite = new Benchmark.Suite();

const NODE_NUM = 2000;
const EDGE_NUM = 2000;
const ITERATIONS = 100;
const CANVAS_SIZE = 800;
const kg = 1;
const kr = 1;
const speed = 1;

/**
 * Graphology
 */
var AntvGraph = require("@antv/graphlib");
var Graph = require("graphology");
var graphologyLayout = require("graphology-layout-forceatlas2");
var randomClusters = require("graphology-generators/random/clusters");
var seedrandom = require("seedrandom");
var rng = function () {
  return seedrandom("bench");
};
const { graphology2antv, graphology2antv_wasm } = require("./util");

var graph = randomClusters(Graph, {
  order: NODE_NUM,
  size: EDGE_NUM,
  clusters: 5,
  rng: rng(),
});
graph.edges().forEach(function (edge, i) {
  graph.setEdgeAttribute(edge, "weight", 1);
});
graph.nodes().forEach(function (node) {
  graph.setNodeAttribute(node, "x", Math.random() * CANVAS_SIZE);
  graph.setNodeAttribute(node, "y", Math.random() * CANVAS_SIZE);
});
const antvgraph = graphology2antv(graph);
const antvgraphWASM = graphology2antv_wasm(graph);

/**
 * @antv/layout
 */
var { ForceAtlas2Layout } = require("../packages/layout");
const antvForceAtlas2Layout = new ForceAtlas2Layout({
  kr,
  kg,
  ks: 0.1,
  speed,
  maxIteration: ITERATIONS,
  width: CANVAS_SIZE,
  height: CANVAS_SIZE,
  center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
});

const DEFAULT_LAYOUT_OPTIONS = {
  min_movement: 0.4,
  distance_threshold_mode: 0, // mean
  ka: 0,
  kg: 0,
  kr: 0,
  speed: 0,
  prevent_overlapping: false,
  kr_prime: 0,
  node_radius: 0,
  strong_gravity: false,
  lin_log: false,
  dissuade_hubs: false,
  edge_strength: 0,
  link_distance: 0,
  node_strength: 0,
  coulomb_dis_scale: 0,
  factor: 0,
  interval: 0,
  damping: 0,
  center: [0, 0],
  max_speed: 0,
};

/**
 * @antv/layout-wasm
 */
var antvLayoutWASM = require("../packages/layout-wasm/pkg-node/antv_layout_wasm.js");
antvLayoutWASM.start();

// add tests
suite
  .add("Graphology", async function () {
    graphologyLayout(graph, {
      settings: {
        barnesHutOptimize: false,
        strongGravityMode: false,
        gravity: kg,
        scalingRatio: kr,
        slowDown: 1,
      },
      iterations: ITERATIONS,
      getEdgeWeight: "weight",
    });
  })
  .add("@antv/layout", async function () {
    await antvForceAtlas2Layout.execute(antvgraph);
  })
  .add("@antv/layout-wasm", async function () {
    const { nodes, edges, masses, weights } = antvgraphWASM;
    antvLayoutWASM.force({
      ...DEFAULT_LAYOUT_OPTIONS,
      name: 0,
      nodes,
      edges,
      masses,
      weights,
      iterations: ITERATIONS,
      center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
      ka: 0.5,
      kg,
      kr,
      speed,
      prevent_overlapping: false,
      kr_prime: 0,
      node_radius: 1,
      strong_gravity: false,
      dissuade_hubs: false,
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
