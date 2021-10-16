const Graph = dagre.graphlib.Graph;
var g = new Graph();
g.setDefaultEdgeLabel(function () {
  return {};
});
g.setGraph({
  ranker: 'tight-tree',
});
g.setNode("a", { id: "a", width: 20, height: 20 })
  .setNode("b", { id: "b", width: 20, height: 20, layer: 2 })
  .setNode("c", { id: "c", width: 20, height: 20 })
  // .setNode("d", { width: 20, height: 20 })
  .setEdge("a", "b", { minlen: 1 })
  .setEdge("a", "c", { minlen: 1 });
// .setEdge("b", "d");

// feasibleTree(g);
dagre.layout(g);

g.nodes().forEach(function (v) {
  console.log("Node " + v + ": " + JSON.stringify(g.node(v)));
});
g.edges().forEach(function (e) {
  console.log("Edge " + e.v + " -> " + e.w + ": " + JSON.stringify(g.edge(e)));
});

const div = document.createElement("div");
document.body.appendChild(div);
drawGraph(g, div);

function createGraph(data) {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(function () {
    return {};
  });

  // Add nodes to the graph. The first argument is the node id. The second is
  // metadata about the node. In this case we're going to add labels to each of
  // our nodes.
  data.nodes.forEach((n) => {
    g.setNode(n.id, n);
  });

  // Add edges to the graph.
  data.edges.forEach((e) => {
    g.setEdge(e.source, e.target);
  });

  return g;
}

function drawGraph(g, container) {
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", 1800)
    .attr("height", 2400);
  const nodes = g.nodes().map((n) => g.node(n));
  const edges = g.edges().map((e) => {
    const res = g.edge(e);
    res.source = g.node(e.v);
    res.target = g.node(e.w);
    return res;
  });

  svg
    .selectAll(".edge")
    .data(edges)
    .enter()
    .append("polyline")
    .attr("class", "edge")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("points", (d) => {
      return `${d.source.x}, ${d.source.y} ${d.points
        .map((p) => `${p.x},${p.y}`)
        .join(" ")} ${d.target.x}, ${d.target.y}`;
    });

  const node = svg
    .selectAll(".node")
    .data(nodes)
    .enter()
    .append("rect")
    .style("fill", "#aaaaaa")
    .attr("class", "node")
    .attr("x", (d) => d.x - (d.width ?? 20) / 2)
    .attr("y", (d) => d.y - (d.height ?? 20) / 2)
    .attr("width", (d) => d.width ?? 20)
    .attr("height", (d) => d.height ?? 20);

  /*
  const label = svg
    .selectAll(".label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("transform", (d) => `translate(${d.x},${d.y}) rotate(20) `)
    // .attr("x", (d) => d.x)
    // .attr("y", (d) => d.y)
    .text((d) => d.id);
    */

  node.append("title").text((d) => d.id);
}
