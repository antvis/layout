import { Graph, Node } from "@antv/graphlib";
import { GridLayout } from "@antv/layout";

const data = {
  nodes: [
    { id: "0", data: {} },
    { id: "1", data: {} },
    { id: "2", data: {} },
    { id: "3", data: {} },
    { id: "4", data: {} },
    { id: "5", data: {} },
    { id: "6", data: {} },
    { id: "7", data: {} },
  ],
  edges: [
    { id: "e0", source: "0", target: "1", data: {} },
    { id: "e1", source: "1", target: "2", data: {} },
    { id: "e2", source: "2", target: "3", data: {} },
    { id: "e3", source: "3", target: "4", data: {} },
    { id: "e4", source: "5", target: "6", data: {} },
    { id: "e5", source: "6", target: "7", data: {} },
  ],
};

function getNodeById(nodes, id: string) {
  return nodes.find((node) => node.id === id);
}

function isInTheSameRow(nodes) {
  const node0 = nodes[0];
  return nodes.every((node) => node.y === node0.y);
}

function isInTheSameCol(nodes) {
  const node0 = nodes[0];
  return nodes.every((node) => node.x === node0.x);
}

describe("GridLayout", () => {
  it("should return correct default config.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout();
    expect(grid.options).toEqual({
      begin: [0, 0],
      cols: undefined,
      condense: false,
      nodeSize: 30,
      position: undefined,
      preventOverlap: true,
      preventOverlapPadding: 10,
      rows: undefined,
      sortBy: "degree",
      width: 300,
      height: 300,
    });

    const positions = grid.execute(graph);

    expect(positions.nodes[0].data.x).not.toBe(undefined);
    expect(positions.nodes[0].data.y).not.toBe(undefined);
  });

  it("should do grid layout with an empty graph.", () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const grid = new GridLayout();
    const positions = grid.execute(graph);
    expect(positions.nodes).not.toBe(undefined);
  });

  it("should do grid layout with a graph which has only one node.", () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: "node", data: {} }],
      edges: [],
    });

    const grid = new GridLayout({ begin: [10, 20] });
    const positions = grid.execute(graph);

    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  it("should do grid layout with fixed columns.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      cols: 2,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6
     * 5 4
     * 3 2
     * 1 0
     */
    const positions = grid.execute(graph);

    // first column
    expect(
      isInTheSameCol([
        positions.nodes[0],
        positions.nodes[2],
        positions.nodes[4],
        positions.nodes[6],
      ])
    ).toEqual(true);

    // second column
    expect(
      isInTheSameCol([
        positions.nodes[1],
        positions.nodes[3],
        positions.nodes[5],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("should do grid layout with fixed rows.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      rows: 2,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6 5 4
     * 3 2 1 0
     */
    const positions = grid.execute(graph);

    // first row
    expect(
      isInTheSameRow([
        positions.nodes[0],
        positions.nodes[1],
        positions.nodes[2],
        positions.nodes[3],
      ])
    ).toEqual(true);

    // second row
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("should do grid layout with fixed cols and rows, rows*cols>nodes, situation 1.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      rows: 2,
      cols: 6,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6 5 4 3
     * 2 1 0
     */
    const positions = grid.execute(graph);

    expect(
      isInTheSameRow([
        positions.nodes[0],
        positions.nodes[1],
        positions.nodes[2],
        positions.nodes[3],
        positions.nodes[4],
      ])
    ).toEqual(true);
    expect(
      isInTheSameRow([
        positions.nodes[5],
        positions.nodes[6],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("should do grid layout with fixed cols and rows, rows*cols>nodes, situation 2.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      rows: 3,
      cols: 4,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6 5 4
     * 3 2 1 0
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameRow([
        positions.nodes[0],
        positions.nodes[1],
        positions.nodes[2],
        positions.nodes[3],
      ])
    ).toEqual(true);
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("should do grid layout with fixed cols and rows, rows*cols<nodes, situation 1", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      rows: 2,
      cols: 2,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6
     * 5 4
     * 3 2
     * 1 0
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameCol([
        positions.nodes[0],
        positions.nodes[2],
        positions.nodes[4],
        positions.nodes[6],
      ])
    ).toEqual(true);
    expect(
      isInTheSameCol([
        positions.nodes[1],
        positions.nodes[3],
        positions.nodes[5],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("grid layout with fixed cols and rows, rows*cols<nodes, situation 2", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      rows: 2,
      cols: 3,
      sortBy: "id",
      begin: [10, 20],
    });

    /**
     * 7 6 5 4
     * 3 2 1 0
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameRow([
        positions.nodes[0],
        positions.nodes[1],
        positions.nodes[2],
        positions.nodes[3],
      ])
    ).toEqual(true);
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
        positions.nodes[7],
      ])
    ).toEqual(true);
  });

  it("should do grid layout with condense param.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      condense: true,
      begin: [10, 20],
    });

    /**
     * 1 2 3
     * 6 0 4
     * 5 7
     */
    const positions = grid.execute(graph);

    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
      ])
    ).toEqual(true);

    expect(
      isInTheSameRow([
        positions.nodes[1],
        positions.nodes[7],
        positions.nodes[3],
      ])
    ).toEqual(true);

    expect(isInTheSameRow([positions.nodes[0], positions.nodes[2]])).toEqual(
      true
    );
  });

  it("should do grid layout with preventOverlap", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      preventOverlap: true,
      begin: [10, 20],
    });

    /**
     * 1 2 3
     * 6 0 4
     * 5 7
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
      ])
    ).toEqual(true);

    expect(
      isInTheSameRow([
        positions.nodes[1],
        positions.nodes[7],
        positions.nodes[3],
      ])
    ).toEqual(true);

    expect(isInTheSameRow([positions.nodes[0], positions.nodes[2]])).toEqual(
      true
    );
  });

  it("grid layout with preventOverlap, nodeSize is an array", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      preventOverlap: true,
      nodeSize: [20, 10],
      begin: [10, 20],
    });
    /**
     * 1 2 3
     * 6 0 4
     * 5 7
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
      ])
    ).toEqual(true);

    expect(
      isInTheSameRow([
        positions.nodes[1],
        positions.nodes[7],
        positions.nodes[3],
      ])
    ).toEqual(true);

    expect(isInTheSameRow([positions.nodes[0], positions.nodes[2]])).toEqual(
      true
    );
  });

  it("should do grid layout with preventOverlap & nodeSize.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      preventOverlap: true,
      nodeSize: 150,
      begin: [10, 20],
    });
    /**
     * 1 2 3
     * 6 0 4
     * 5 7
     */
    const positions = grid.execute(graph);
    expect(
      isInTheSameRow([
        positions.nodes[4],
        positions.nodes[5],
        positions.nodes[6],
      ])
    ).toEqual(true);

    expect(
      isInTheSameRow([
        positions.nodes[1],
        positions.nodes[7],
        positions.nodes[3],
      ])
    ).toEqual(true);

    expect(isInTheSameRow([positions.nodes[0], positions.nodes[2]])).toEqual(
      true
    );

    // gap between nodes > 150
    expect(positions.nodes[1].data.x - positions.nodes[0].data.x > 150).toEqual(
      true
    );
  });

  it("should do grid layout with position function", () => {
    let rows = 0;
    const graph = new Graph<any, any>({
      nodes: [...data.nodes].map((node, i) => {
        node.data.col = i % 3;
        node.data.row = rows;
        if (node.data.col === 2) rows++;

        node.data.col = i;
        node.data.row = 0;

        return node;
      }),
      edges: [...data.edges],
    });

    const grid = new GridLayout({
      begin: [10, 20],
      // @ts-ignore
      position: (d: Node<any>) => {
        return {
          row: d.data.row,
          col: d.data.col,
        };
      },
    });

    /**
     * 0 1 2
     * 3 4 5
     * 6 7
     */
    const positions = grid.execute(graph);

    expect(
      isInTheSameRow([
        getNodeById(positions.nodes, "0"),
        getNodeById(positions.nodes, "1"),
        getNodeById(positions.nodes, "2"),
      ])
    ).toEqual(true);
    expect(
      isInTheSameRow([
        getNodeById(positions.nodes, "3"),
        getNodeById(positions.nodes, "4"),
        getNodeById(positions.nodes, "5"),
      ])
    ).toEqual(true);
    expect(
      isInTheSameRow([
        getNodeById(positions.nodes, "6"),
        getNodeById(positions.nodes, "7"),
      ])
    ).toEqual(true);
  });
});
