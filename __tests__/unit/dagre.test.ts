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
  test("should layout correctly with UR alignment.", async () => {
    const graph = new Graph<NodeData, EdgeData>(data);

    //             +---+
    //             |-| |
    //            -/-|-+
    //          -/   |  
    //       --/     |  
    // +----/      +-|-+
    // | --|       | | |
    // +---\-      +-|-+
    //       \-      |  
    //         \--   |  
    //            \--|-+
    //             |\- |
    //             +-|-+
    //               |  
    //               |  
    //             +-|-+
    //             | | |
    //             +-|-+
    //               |  
    //               |  
    //             +-|-+
    //             |-- |
    //            -/-|-+
    //          -/   |  
    //       --/     |  
    // +----/      +-|-+
    // | -/|       | + |
    // +---+       +---+
    const dagre = new DagreLayout({
      nodeSize: 10,
      ranksep: 70,
      controlPoints: true,
      begin: [0, 0],
      align: "UR",
    });

    const positions = await dagre.execute(graph);
    expect(positions.nodes[0].data.x).toBe(160);
    expect(positions.nodes[0].data.y).toBe(0);

    expect(positions.nodes[1].data.x).toBe(0);
    expect(positions.nodes[1].data.y).toBe(150);

    expect(positions.nodes[2].data.x).toBe(160);
    expect(positions.nodes[2].data.y).toBe(150);

    expect(positions.nodes[3].data.x).toBe(160);
    expect(positions.nodes[3].data.y).toBe(300);

    expect(positions.nodes[4].data.x).toBe(160);
    expect(positions.nodes[4].data.y).toBe(450);

    expect(positions.nodes[5].data.x).toBe(160);
    expect(positions.nodes[5].data.y).toBe(600);

    expect(positions.nodes[6].data.x).toBe(0);
    expect(positions.nodes[6].data.y).toBe(750);

    expect(positions.nodes[7].data.x).toBe(160);
    expect(positions.nodes[7].data.y).toBe(750);
  });

  test("should layout correctly with UR alignment & ranksepFunc.", async () => {
    const graph = new Graph<NodeData, EdgeData>(data);

    //             +---+
    //             |-| |
    //            -/-|-+
    //          -/   |  
    //       --/     |  
    // +----/      +-|-+
    // | --|       | | |
    // +---\-      +-|-+
    //       \-      |  
    //         \--   |  
    //            \--|-+
    //             |\- |
    //             +-|-+
    //               |  
    //               |  
    //             +-|-+
    //             | | |
    //             +-|-+
    //               |  
    //               |  
    //             +-|-+
    //             |-- |
    //            -/-|-+
    //          -/   |  
    //       --/     |  
    // +----/      +-|-+
    // | -/|       | + |
    // +---+       +---+
    const dagre = new DagreLayout({
      nodeSize: 10,
      ranksepFunc: () => 70,
      controlPoints: true,
      begin: [0, 0],
      align: "UR",
    });

    const positions = await dagre.execute(graph);
    expect(positions.nodes[0].data.x).toBe(160);
    expect(positions.nodes[0].data.y).toBe(0);

    expect(positions.nodes[1].data.x).toBe(0);
    expect(positions.nodes[1].data.y).toBe(150);

    expect(positions.nodes[2].data.x).toBe(160);
    expect(positions.nodes[2].data.y).toBe(150);

    expect(positions.nodes[3].data.x).toBe(160);
    expect(positions.nodes[3].data.y).toBe(300);

    expect(positions.nodes[4].data.x).toBe(160);
    expect(positions.nodes[4].data.y).toBe(450);

    expect(positions.nodes[5].data.x).toBe(160);
    expect(positions.nodes[5].data.y).toBe(600);

    expect(positions.nodes[6].data.x).toBe(0);
    expect(positions.nodes[6].data.y).toBe(750);

    expect(positions.nodes[7].data.x).toBe(160);
    expect(positions.nodes[7].data.y).toBe(750);
  });
});
