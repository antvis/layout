import { Graph, Node } from "@antv/graphlib";
import { ConcentricLayout } from "../../packages/layout";
import dataset from "../data";
import { mathEqual } from "../util";
const data = dataset.data;

describe("ConcentricLayout", () => {
  test("should return correct default config.", async () => {
    const concentric = new ConcentricLayout();
    expect(concentric.options).toEqual({
      nodeSize: 30,
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

  test("should do concentric with an empty graph.", async () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });
    const concentric = new ConcentricLayout();
    const positions = await concentric.execute(graph);
    expect(positions.nodes).toEqual([]);
  });

  test("should do concentric with a graph which has only one node.", async () => {
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
    const positions = await concentric.execute(graph);
    expect(positions.nodes[0].data.x).toEqual(150);
    expect(positions.nodes[0].data.y).toEqual(50);
  });

  test("should do concentric with array nodeSize", async () => {
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

    const positions = await concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });

  test("should do concentric layout with array size in node data, sortBy in data undefined", async () => {
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
    const positions = await concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });

  test("should use concentric equidistant.", async () => {
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
    const positions = await concentric.execute(graph);
    const node = positions.nodes[2];
    expect(mathEqual(node.data.x, width / 2)).toEqual(true);
    expect(mathEqual(node.data.y, height / 2)).toEqual(true);
  });
});
