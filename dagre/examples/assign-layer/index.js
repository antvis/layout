const data = {
  nodes: [
    {
      id: "0",
      label: "0",
      x: 200,
      y: 500
    },
    {
      id: "1",
      label: "1"
    },
    {
      id: "2",
      label: "2",
      layer: 2,
    },
    {
      id: "3",
      label: "3"
    },
    {
      id: "4",
      label: "4"
    },
    {
      id: "5",
      label: "5"
    },
    {
      id: "6",
      label: "6"
    },
    {
      id: "7",
      label: "7"
    },
    {
      id: "8",
      label: "8"
    },
    {
      id: "9",
      label: "9"
    }
  ],
  edges: [
    {
      source: "0",
      target: "1"
    },
    {
      source: "0",
      target: "2"
    },
    {
      source: "1",
      target: "4"
    },
    {
      source: "0",
      target: "3"
    },
    {
      source: "3",
      target: "4"
    },
    {
      source: "4",
      target: "5"
    },
    {
      source: "4",
      target: "6"
    },
    {
      source: "5",
      target: "7"
    },
    {
      source: "5",
      target: "8"
    },
    {
      source: "8",
      target: "9"
    },
    {
      source: "2",
      target: "9"
    },
    {
      source: "3",
      target: "9"
    }
  ]
};

data.nodes.forEach((n) => {
  n.width = 20;
  n.height = 20;
});

const g = createGraph(data);

// Set an object for the graph label
g.setGraph({
  // ranker: "longest-path",
  // ranker: "tight-tree",
  ranker: "network-complex",
  rankdir: 'LR',
  align: 'UL'
});

dagre.layout(g, {
  edgeLabelSpace: true,
});

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
