export function outputAntvLayout(graphModel: any) {
  const nodes: number[] = [];
  const edges: number[] = [];
  const nodesIdxMap: any = {};
  // @ts-ignore
  graphModel.nodes.forEach(({ id, data: { x, y, z } }) => {
    nodesIdxMap[id] = { x, y, z };
    nodes.push(x, y, z);
  });
  // @ts-ignore
  graphModel.edges.forEach(({ source, target }) => {
    const x1 = nodesIdxMap[source].x;
    const y1 = nodesIdxMap[source].y;
    const z1 = nodesIdxMap[source].z;
    const x2 = nodesIdxMap[target].x;
    const y2 = nodesIdxMap[target].y;
    const z2 = nodesIdxMap[target].z;
    edges.push(x1, y1, z1, x2, y2, z2);
  });

  return { nodes, edges };
}
