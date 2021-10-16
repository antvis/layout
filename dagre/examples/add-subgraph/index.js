const simpleGraph1 = {
  nodes: [
    {
      id: "0",
      width: 30,
      height: 20,
      color: "#a6cee3",
    },
    {
      id: "1",
      width: 30,
      height: 20,
      color: "#1f78b4",
    },
    {
      id: "2",
      width: 30,
      height: 20,
      color: "#b2df8a",
    },
    {
      id: "3",
      width: 30,
      height: 20,
      color: "#33a02c",
    },
    {
      id: "4",
      width: 30,
      height: 20,
      color: "#fb9a99",
    },
    {
      id: "5",
      width: 30,
      height: 20,
      color: "#ff7f00",
    },
    {
      id: "6",
      width: 30,
      height: 20,
      color: "#6a3d9a",
    },
  ],
  edges: [
    {
      source: "0",
      target: "1",
    },
    {
      source: "0",
      target: "2",
    },
    {
      source: "0",
      target: "3",
    },
    {
      source: "1",
      target: "4",
    },
    {
      source: "2",
      target: "5",
    },
    {
      source: "3",
      target: "6",
    },
  ],
};

const simpleGraph2 = {
  nodes: [
    {
      id: "7",
      width: 30,
      height: 20,
      color: "#e31a1c",
    },
  ],
  edges: [
    {
      source: "0",
      target: "7",
    },
    {
      source: "7",
      target: "4",
    },
    {
      source: "7",
      target: "6",
    },
  ],
};

const issueGraph1 = {
  nodes: [
    {
      id: "k79zNA0TkCwQPQWw4yn",
      label: "ETL数据流",
      color: "#a6cee3",
    },
    {
      id: "GWMF0chbHRKDkENg1hS",
      label: "ETL数据流2",
      color: "#1f78b4",
    },
    {
      id: "xCzXirgILRm9fF7gjeb",
      label: "报告",
      color: "#b2df8a",
    },
    {
      id: "GxZeEGkky88xKxq1r22",
      label: "工厂输出表",
      color: "#33a02c",
    },
    {
      id: "a",
      label: "a",
      color: "#fb9a99",
    },
    {
      id: "b",
      label: "b",
      color: "#ff7f00",
    },
    {
      id: "c",
      label: "c",
      color: "#6a3d9a",
    },
    {
      id: "AKl8iaVQamqiMaMCF7E",
      label: "csv数据源",
      color: "#2a9d9a",
    },
  ],
  edges: [
    // {
    //   source: "9RQmLGueOikkikLvHVO",
    //   target: "I2Msu7qhDMQPmGLOduP",
    // },
    {
      source: "k79zNA0TkCwQPQWw4yn",
      target: "GxZeEGkky88xKxq1r22",
    },
    // {
    //   source: "I2Msu7qhDMQPmGLOduP",
    //   target: "k79zNA0TkCwQPQWw4yn",
    // },
    // {
    //   source: "QUCo43VpL9LaPT4QVx0",
    //   target: "k79zNA0TkCwQPQWw4yn",
    // },
    {
      source: "GxZeEGkky88xKxq1r22",
      target: "xCzXirgILRm9fF7gjeb",
    },
    {
      source: "xCzXirgILRm9fF7gjeb",
      target: "b",
    },
    {
      source: "xCzXirgILRm9fF7gjeb",
      target: "c",
    },
    {
      source: "AKl8iaVQamqiMaMCF7E",
      target: "xCzXirgILRm9fF7gjeb",
    },
    {
      source: "GxZeEGkky88xKxq1r22",
      target: "GWMF0chbHRKDkENg1hS",
    },
    {
      source: "GWMF0chbHRKDkENg1hS",
      target: "a",
    },
  ],
};

const issueGraph2 = {
  nodes: [
    {
      id: "vm1234",
      label: "新增报告",
    },
  ],
  edges: [
    {
      source: "a",
      target: "vm1234",
    },
  ],
};

// const data1 = simpleGraph1;
// const data2 = simpleGraph2;
const data1 = issueGraph1;
const data2 = issueGraph2;

const data1Copy = JSON.parse(JSON.stringify(data1));
const data2Copy = JSON.parse(JSON.stringify(data2));

const div = document.createElement("div");
document.body.appendChild(div);
const svg1 = d3
  .select(div)
  .append("svg")
  .style("margin", 40)
  .style("overflow", "visible")
  .attr("width", 500)
  .attr("height", 300);

const svg2 = d3
  .select(div)
  .append("svg")
  .style("margin", 40)
  .style("overflow", "visible")
  .attr("width", 500)
  .attr("height", 300);

const originGraph = createGraph(data1);
originGraph.setGraph({
  rankdir: "LR",
});
dagre.layout(originGraph, {
  edgeLabelSpace: true,
});
console.log(originGraph);
const originGraphCopy = createGraph(data1Copy);
originGraphCopy.setGraph({
  rankdir: "LR",
});
dagre.layout(originGraphCopy, {
  edgeLabelSpace: true,
});

drawGraph(originGraph, svg1);
drawGraph(originGraphCopy, svg2);

const g1 = createGraph({
  nodes: [...data1.nodes, ...data2.nodes],
  edges: [...data1.edges, ...data2.edges],
});

g1.setGraph({
  rankdir: "LR",
});

dagre.layout(g1, {
  edgeLabelSpace: true,
});

const g2 = createGraph({
  nodes: [...data1Copy.nodes, ...data2Copy.nodes],
  edges: [...data1Copy.edges, ...data2Copy.edges],
});
g2.setGraph({
  rankdir: "LR",
});
dagre.layout(
  g2,
  {
    edgeLabelSpace: true,
    prevGraph: originGraphCopy
  }
);

function addSubGraph() {
  drawGraph(g1, svg1);
  drawGraph(g2, svg2);
}

d3.select("body")
  .append("button")
  .text("添加子图")
  .on("click", () => {
    addSubGraph();
  });

function createGraph(data) {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set an object for the graph label
  g.setGraph({
    // ranker: "longest-path",
    ranker: "tight-tree",
    // ranker: "network-complex",
  });

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

function drawGraph(g, svg) {
  const nodes = g.nodes().map((n) => g.node(n));
  const edges = g.edges().map((e) => {
    const res = g.edge(e);
    res.source = g.node(e.v);
    res.target = g.node(e.w);
    return res;
  });

  const link = svg.selectAll(".edge").data(edges);

  const easeFunc = d3.easeElasticOut.amplitude(1).period(0.9);

  link
    .enter()
    .append("line")
    .transition()
    .duration(1000)
    .ease(easeFunc)
    .attr("class", "edge")
    .attr("stroke", "black")
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
  // .append("polyline")
  // .attr("class", "edge")
  // .attr("fill", "none")
  // .attr("stroke", "black")
  // .attr("points", (d) => {
  //   return `${d.source.x}, ${d.source.y} ${d.points
  //     .map((p) => `${p.x},${p.y}`)
  //     .join(" ")} ${d.target.x}, ${d.target.y}`;
  // });

  link
    .transition()
    .duration(1000)
    .ease(easeFunc)
    .attr("x1", (d) => d.source.x)
    .attr("y1", (d) => d.source.y)
    .attr("x2", (d) => d.target.x)
    .attr("y2", (d) => d.target.y);
  // .attr("points", (d) => {
  //   return `${d.source.x}, ${d.source.y} ${d.points
  //     .map((p) => `${p.x},${p.y}`)
  //     .join(" ")} ${d.target.x}, ${d.target.y}`;
  // });

  link.exit().transition().duration(1000).remove();

  const node = svg.selectAll(".node").data(nodes);

  node
    .enter()
    .append("rect")
    .transition()
    .duration(1000)
    .ease(easeFunc)
    .style("fill", (d) => d.color)
    .attr("rx", 5)
    .attr("class", "node")
    .attr("width", (d) => d.width ?? 20)
    .attr("height", (d) => d.height ?? 20)
    .attr("x", (d) => d.x - (d.width ?? 20) / 2)
    .attr("y", (d) => d.y - (d.height ?? 20) / 2);

  node
    .raise()
    .transition()
    .duration(1000)
    .ease(easeFunc)
    .attr("x", (d) => d.x - (d.width ?? 20) / 2)
    .attr("y", (d) => d.y - (d.height ?? 20) / 2);

  node.exit().remove();

  // node.append("title").text((d) => d.id);
}
