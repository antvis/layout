export function outputGraphology(
  graph: any,
  positions: any,
  processEachNode?: (node: any) => void
) {
  const nodes: number[] = [];
  const edges: number[] = [];
  Object.keys(positions).forEach((id) => {
    if (processEachNode) {
      processEachNode(positions[id]);
    }
    nodes.push(positions[id].x, positions[id].y);
  });
  graph.edges().forEach((id: string) => {
    const source = graph.source(id);
    const target = graph.target(id);
    edges.push(
      positions[source].x,
      positions[source].y,
      positions[target].x,
      positions[target].y
    );
  });
  return { nodes, edges };
}

export function outputAntvLayout(graphModel: any) {
  const nodes: number[] = [];
  const edges: number[] = [];
  const nodesIdxMap: any = {};
  // @ts-ignore
  graphModel.nodes.forEach(({ id, data: { x, y } }) => {
    nodesIdxMap[id] = { x, y };
    nodes.push(x, y);
  });
  // @ts-ignore
  graphModel.edges.forEach(({ source, target }) => {
    const x1 = nodesIdxMap[source].x;
    const y1 = nodesIdxMap[source].y;
    const x2 = nodesIdxMap[target].x;
    const y2 = nodesIdxMap[target].y;
    edges.push(x1, y1, x2, y2);
  });

  return { nodes, edges };
}

export function outputAntvLayoutWASM(
  nodes: number[],
  edges: [number, number][]
) {
  const outputEdges: number[] = [];
  edges.forEach(([source, target]) => {
    outputEdges.push(
      nodes[source * 2],
      nodes[source * 2 + 1],
      nodes[target * 2],
      nodes[target * 2 + 1]
    );
  });

  return { nodes, edges: outputEdges };
}
