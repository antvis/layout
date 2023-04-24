import { Graph } from "@antv/graphlib";
import { DagreLayout, NodeData, EdgeData } from "../../packages/layout";
import { mathEqual } from "../util";

const data = {
  nodes: [
    {
      id: "1",
      data: {
        name: "alps_file1",
      },
    },
    {
      id: "2",
      data: {
        name: "alps_file2",
      },
    },
    {
      id: "3",
      data: {
        name: "alps_file3",
      },
    },
    {
      id: "4",
      data: {
        name: "sql_file1",
      },
    },
    {
      id: "5",
      data: {
        name: "sql_file2",
      },
    },
    {
      id: "6",
      data: {
        name: "feature_etl_1",
      },
    },
    {
      id: "7",
      data: {
        name: "feature_etl_1",
      },
    },
    {
      id: "8",
      data: {
        name: "feature_extractor",
      },
    },
  ],
  edges: [
    {
      id: "e1",
      data: {},
      source: "1",
      target: "2",
    },
    {
      id: "e2",
      data: {},
      source: "1",
      target: "3",
    },
    {
      id: "e3",
      data: {},
      source: "2",
      target: "4",
    },
    {
      id: "e4",
      data: {},
      source: "3",
      target: "4",
    },
    {
      id: "e5",
      data: {},
      source: "4",
      target: "5",
    },
    {
      id: "e6",
      data: {},
      source: "5",
      target: "6",
    },
    {
      id: "7",
      data: {},
      source: "6",
      target: "7",
    },
    {
      id: "e8",
      data: {},
      source: "6",
      target: "8",
    },
  ],
};

describe("DagreLayout", () => {
  test.skip("should skip layout when there's no node in graph.", async () => {
    const graph = new Graph<NodeData, EdgeData>(data);

    const dagre = new DagreLayout({
      nodesep: 50, // 节点水平间距(px)
      ranksep: 50, // 每一层节点之间间距
      controlPoints: false, // 是否保留布局连线的控制点
    });

    const positions = await dagre.execute(graph);
    // expect(positions).toEqual({ nodes: [], edges: [] });

    // Graph should remain unchanged.
    // await circular.assign(graph);
    expect(positions.nodes[0].data.x).not.toBe(undefined);
    expect(positions.nodes[0].data.y).not.toBe(undefined);
  });
});
