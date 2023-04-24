import { Graph } from "@antv/graphlib";
import { FruchtermanLayout } from "../../packages/layout";
import data from "../data/test-data-1";
import { getEuclideanDistance } from "../util";

describe("FruchtermanLayout", () => {
  test("should return correct default config.", () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const fruchterman = new FruchtermanLayout();
    expect(fruchterman.options).toEqual({
      maxIteration: 1000,
      gravity: 10,
      speed: 5,
      clustering: false,
      clusterGravity: 10,
      width: 300,
      height: 300,
      nodeClusterBy: "cluster",
    });

    fruchterman.execute(graph);
    fruchterman.stop();
    const { nodes } = fruchterman.tick(1000);

    expect(nodes[0].data.x).not.toBe(undefined);
    expect(nodes[0].data.y).not.toBe(undefined);
  });

  test("should do fruchterman layout with an empty graph.", async () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const fruchterman = new FruchtermanLayout();
    await fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);
    expect(JSON.stringify(positions.nodes)).toBe("[]");
  });

  test("should do fruchterman layout with a graph which has only one node.", () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: "node", data: {} }],
      edges: [],
    });

    const fruchterman = new FruchtermanLayout({
      center: [10, 20],
    });

    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  test("should do fruchterman layout with clustering and nodeClusterBy.", () => {
    const graph = new Graph<any, any>({
      nodes: [
        { id: "node0", data: { clusterField: "a" } },
        { id: "node1", data: { clusterField: "c" } },
        { id: "node2", data: { clusterField: "b" } },
        { id: "node3", data: { clusterField: "a" } },
        { id: "node4", data: { clusterField: "c" } },
        { id: "node5", data: { clusterField: "b" } },
      ],
      edges: [],
    });
    const fruchterman = new FruchtermanLayout({
      clustering: true,
      nodeClusterBy: "clusterField",
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    const aClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[3]
    );
    const bClusterDist = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[5]
    );
    const cClusterDist = getEuclideanDistance(
      positions.nodes[1],
      positions.nodes[4]
    );
    const abClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[2]
    );
    const acClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[1]
    );
    const bcClusterDist = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[1]
    );
    // distances intra a cluster are smaller than distances inter clusters
    expect(aClusterDist < abClusterDist).toBe(true);
    expect(aClusterDist < bcClusterDist).toBe(true);
    expect(aClusterDist < acClusterDist).toBe(true);
    expect(bClusterDist < abClusterDist).toBe(true);
    expect(bClusterDist < bcClusterDist).toBe(true);
    expect(bClusterDist < acClusterDist).toBe(true);
    expect(cClusterDist < abClusterDist).toBe(true);
    expect(cClusterDist < bcClusterDist).toBe(true);
    expect(cClusterDist < acClusterDist).toBe(true);
  });

  test("should do fruchterman layout with onTick.", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    let tick = 0;
    const onTick = ({ nodes, edges }: any) => {
      expect(nodes.length).toBe(data.nodes.length);
      expect(nodes[0].data.x).not.toBe(undefined);
      expect(nodes[0].data.y).not.toBe(undefined);
      tick++;
    };

    const fruchterman = new FruchtermanLayout({
      maxIteration: 10,
      onTick,
    });
    const { nodes } = await fruchterman.execute(graph);
    expect(nodes.length).toBe(data.nodes.length);
    expect(nodes[0].data.x).not.toBe(undefined);
    expect(nodes[0].data.y).not.toBe(undefined);
    expect(tick).toBe(10);
  });

  test("should do fruchterman layout with overlapped nodes and loop edge.", () => {
    const graph = new Graph<any, any>({
      nodes: [
        {
          id: "node0",
          data: { x: 100, y: 100 },
        },
        {
          id: "node1",
          data: { x: 100, y: 100 },
        },
        {
          id: "node2",
          data: { x: 150, y: 120 },
        },
      ],
      edges: [
        { id: "edge0", source: "node2", target: "node2", data: {} },
        { id: "edge1", source: "node1", target: "node1", data: {} },
      ],
    });
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);
    expect(positions.nodes[0].data.x).not.toEqual(positions.nodes[1].data.x);
    expect(positions.nodes[0].data.y).not.toEqual(positions.nodes[1].data.y);
  });

  test("should do fruchterman layout with different gravities.", () => {
    const graph = new Graph<any, any>({
      nodes: [
        { id: "node0", data: { x: 10, y: 10 } },
        { id: "node1", data: { x: 100, y: 10 } },
        { id: "node2", data: { x: 10, y: 100 } },
      ],
      edges: [],
    });
    const fruchterman1 = new FruchtermanLayout({
      gravity: 1,
      center: [10, 20],
    });
    fruchterman1.execute(graph);
    fruchterman1.stop();
    const positions1 = fruchterman1.tick(1000);

    const fruchterman2 = new FruchtermanLayout({
      gravity: 10,
      center: [10, 20],
    });
    fruchterman2.execute(graph);
    fruchterman2.stop();
    const positions2 = fruchterman2.tick(1000);

    const virtualCenterNode = { data: { x: 10, y: 20 } };
    const layout1DistToCenter1 = getEuclideanDistance(
      positions1.nodes[0],
      virtualCenterNode
    );
    const layout1DistToCenter2 = getEuclideanDistance(
      positions1.nodes[1],
      virtualCenterNode
    );
    const layout1DistToCenter3 = getEuclideanDistance(
      positions1.nodes[2],
      virtualCenterNode
    );

    const layout2DistToCenter1 = getEuclideanDistance(
      positions2.nodes[0],
      virtualCenterNode
    );
    const layout2DistToCenter2 = getEuclideanDistance(
      positions2.nodes[1],
      virtualCenterNode
    );
    const layout2DistToCenter3 = getEuclideanDistance(
      positions2.nodes[2],
      virtualCenterNode
    );

    expect(layout1DistToCenter1 > layout2DistToCenter1).toBe(true);
    expect(layout1DistToCenter2 > layout2DistToCenter2).toBe(true);
    expect(layout1DistToCenter3 > layout2DistToCenter3).toBe(true);
  });
});
