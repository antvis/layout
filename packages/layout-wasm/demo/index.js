const draw = (context, nodes) => {
  // Draw the layout.
  for (let i = 0; i < nodes.length; i += 2) {
    context.beginPath();
    context.arc(
      nodes[i] + centerX,
      nodes[i + 1] + centerY,
      NODE_RADIUS,
      0,
      2 * Math.PI,
      false
    );
    context.fillStyle = "red";
    context.fill();
    context.stroke();
  }
};

const canvas1 = document.getElementById("canvas1");
canvas1.width = window.innerWidth;
canvas1.height = window.innerHeight;
const context1 = canvas1.getContext("2d");
const canvas2 = document.getElementById("canvas2");
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;
const context2 = canvas2.getContext("2d");
const canvas3 = document.getElementById("canvas3");
canvas3.width = window.innerWidth;
canvas3.height = window.innerHeight;
const context3 = canvas3.getContext("2d");

const centerX = canvas1.width / 2;
const centerY = canvas1.height / 2;

const NODE_RADIUS = 5;
const lineWidth = 2;

const NODES = 100;
const EDGES = 800;
const ITERATIONS = 100;

/**
 * Initialize graph model.
 */
const graph = window.graphologyGenerators.random.clusters(
  window.graphology.Graph,
  {
    order: NODES,
    size: EDGES,
    clusters: 5,
  }
);
graph.nodes().forEach(function (node) {
  graph.setNodeAttribute(node, "x", Math.random() * canvas1.width);
  graph.setNodeAttribute(node, "y", Math.random() * canvas1.height);
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
 * Graphology layout
 */
(async () => {
  console.time("Layout Graphology");
  window.graphologyLayoutForceatlas2.assign(graph, {
    settings: {
      barnesHutOptimize: false,
      linLogMode: false,
      gravity: 25,
    },
    iterations: ITERATIONS,
  });
  console.timeEnd("Layout Graphology");
  const nodes2 = [];
  graph.nodes().forEach((id) => {
    nodes2.push(graph.getNodeAttribute(id, "x"));
    nodes2.push(graph.getNodeAttribute(id, "y"));
  });
  // draw(context1, nodes2);
})();

/**
 * WASM layout
 */
(async () => {
  console.time("Layout WASM singlethread");
  const { forceAtlas2 } = await window.layout.initThreads(false);
  const { positions } = await forceAtlas2({
    nodes: NODES,
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

  console.timeEnd("Layout WASM singlethread");
  // draw(context2, positions);
})();
(async () => {
  console.time("Layout WASM multithread");
  const { forceAtlas2 } = await window.layout.initThreads(true);
  const { positions } = await forceAtlas2({
    nodes: NODES,
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
  console.timeEnd("Layout WASM multithread");
  // draw(context3, positions);
})();
