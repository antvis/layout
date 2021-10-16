const data = {
  nodes: [
    // {
    //   id: "9RQmLGueOikkikLvHVO",
    //   label: "Mysql连接账户",
    // },
    {
      id: "k79zNA0TkCwQPQWw4yn",
      label: "ETL数据流",
    },
    {
      id: "GWMF0chbHRKDkENg1hS",
      label: "ETL数据流2",
    },
    {
      id: "xCzXirgILRm9fF7gjeb",
      label: "报告",
    },
    // {
    //   id: "I2Msu7qhDMQPmGLOduP",
    //   label: "Mysql数据源",
    // },
    // {
    //   id: "QUCo43VpL9LaPT4QVx0",
    //   label: "Excel数据源",
    // },
    {
      id: "GxZeEGkky88xKxq1r22",
      label: "工厂输出表",
    },
    {
      id: "a",
      label: "a",
    },
    {
      id: "b",
      label: "b",
    },
    {
      id: "c",
      label: "c",
    },
    {
      id: "AKl8iaVQamqiMaMCF7E",
      label: "csv数据源",
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

const addGraph = {
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

const data1 = {
  nodes: [...data.nodes, ...addGraph.nodes],
  edges: [...data.edges, ...addGraph.edges],
};

data.nodes.forEach((n) => {
  n.width = 20;
  n.height = 20;
});

const g = createGraph(data);
// const g = createGraph(data1);

// Set an object for the graph label
g.setGraph({
  // ranker: "longest-path",
  ranker: "tight-tree",
  // ranker: "network-complex",
  rankdir: "LR",
});

dagre.layout(g, {
  // edgeLabelSpace: false,
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
    .text((d) => d.label);
    */

  node.append("title").text((d) => d.id);
}

function removeBranch(g, node) {
  nodeMap = {};
  edgeMap = {};
  for (const node of g.nodes) {
    nodeMap[node.id] = node;
  }
  for (const edge of g.edges) {
    if (!edgeMap[edge.source]) {
      edgeMap[edge.source] = [];
    }
    edgeMap[edge.source].push(edge.target);
  }

  let removeSet = new Set([node]);
  let q = new Set([node]);
  while (q.size) {
    let qq = new Set();
    for (const s of q) {
      if (!edgeMap[s]) continue;
      for (const t of edgeMap[s]) {
        removeSet.add(t);
        qq.add(t);
      }
    }
    q = qq;
  }

  const newG = {};
  newG.nodes = g.nodes.filter((n) => !removeSet.has(n.id));
  // newG.nodes = g.nodes;
  newG.edges = g.edges.filter((e) => !removeSet.has(e.target));
  return newG;
}
