import { Graph, Node } from "@antv/graphlib";
import { ConcentricLayout } from "@antv/layout";
import dataset from "../data";
import { mathEqual } from "../util";
const data = dataset.data;

describe("ConcentricLayout", () => {
  it("should return correct default config.", () => {
    const concentric = new ConcentricLayout();
    expect(concentric.options).toEqual({
      nodeSize: 30,
      minNodeSpacing: 10,
      preventOverlap: false,
      sweep: undefined,
      equidistant: false,
      startAngle: (3 / 2) * Math.PI,
      clockwise: true,
      maxLevelDiff: undefined,
      sortBy: "degree",
      nodeSpacing: 10,
    });
  });

  it("should do concentric with an empty graph.", () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });
    const concentric = new ConcentricLayout();
    const positions = concentric.execute(graph);
    expect(positions.nodes).toEqual([]);
  });

  it("should do concentric with a graph which has only one node.", () => {
    const graph = new Graph<any, any>({
      nodes: [
        {
          id: "node",
          data: {
            x: 100,
            y: 100,
          },
        },
      ],
      edges: [],
    });
    const concentric = new ConcentricLayout({
      center: [150, 50],
    });
    const positions = concentric.execute(graph);
    expect(positions.nodes[0].data.x).toEqual(150);
    expect(positions.nodes[0].data.y).toEqual(50);
  });

  it("should do concentric with array nodeSize", () => {
    const graph = new Graph<any, any>({
      // @ts-ignore
      nodes: data.nodes,
      // @ts-ignore
      edges: data.edges,
    });

    const width = 500;
    const height = 500;
    const concentric = new ConcentricLayout({
      nodeSize: [10, 20],
      width,
      height,
    });

    const positions = concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });

  it("should do concentric layout with array size in node data, sortBy in data undefined", () => {
    const graph = new Graph<any, any>({
      // @ts-ignore
      nodes: data.nodes,
      // @ts-ignore
      edges: data.edges,
    });

    const width = 500;
    const height = 500;
    const concentric = new ConcentricLayout({
      sortBy: "ttt",
      width,
      height,
    });
    const positions = concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });

  it("should use concentric equidistant.", () => {
    const graph = new Graph<any, any>({
      // @ts-ignore
      nodes: data.nodes,
      // @ts-ignore
      edges: data.edges,
    });

    const width = 500;
    const height = 500;
    const concentric = new ConcentricLayout({
      width,
      height,
      equidistant: true,
    });
    const positions = concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });
});
