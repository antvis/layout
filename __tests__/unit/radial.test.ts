import { Graph } from "@antv/graphlib";
import { RadialLayout } from "@antv/layout";
import { getEuclideanDistance, mathEqual } from "../util";

const data: any = {
  nodes: [
    { id: "0", label: "0", data: {} },
    { id: "1", label: "1", data: {} },
    { id: "2", label: "2", data: {} },
    { id: "3", label: "3", data: {} },
    { id: "4", label: "4", data: {} },
    { id: "5", label: "5", data: {} },
  ],
  edges: [
    {
      id: "edge0",
      source: "0",
      target: "1",
      data: {},
    },
    {
      id: "edge1",
      source: "0",
      target: "2",
      data: {},
    },
    {
      id: "edge2",
      source: "3",
      target: "4",
      data: {},
    },
  ],
};

describe("RadialLayout", () => {
  it("should return correct default config.", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const radial = new RadialLayout();
    expect(radial.options).toEqual({
      maxIteration: 1000,
      focusNode: null,
      unitRadius: null,
      linkDistance: 50,
      preventOverlap: false,
      nodeSize: undefined,
      nodeSpacing: undefined,
      strictRadial: true,
      maxPreventOverlapIteration: 200,
      sortBy: undefined,
      sortStrength: 10,
    });

    const positions = await radial.execute(graph);

    const expectCenter = [window.innerWidth / 2, window.innerHeight / 2];
    expect(positions.nodes[0].data.x).toBe(expectCenter[0]);
    expect(positions.nodes[0].data.y).toBe(expectCenter[1]);
  });

  it("should do radial layout with an empty graph.", async () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const radial = new RadialLayout();
    const positions = await radial.execute(graph);
    expect(positions.nodes).not.toBe(undefined);
  });

  it("should do radial layout with a graph which has only one node.", async () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: "node", data: {} }],
      edges: [],
    });

    const radial = new RadialLayout({ center: [10, 20] });
    const positions = await radial.execute(graph);

    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  it("should do radial layout with unitRadius and linkDistance", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });
    const unitRadius = 100;
    const fnIndex = 1;
    const focusNode = data.nodes[fnIndex];
    const center: any = [250, 250];

    const radial = new RadialLayout({
      width: 500,
      height: 600,
      center,
      maxIteration: 100,
      focusNode,
      unitRadius,
      linkDistance: 100,
    });
    const positions = await radial.execute(graph);

    const focusPos = positions.nodes[fnIndex];
    const oneStepNode = positions.nodes[0];
    const twoStepNode = positions.nodes[2];
    const descreteNode1 = positions.nodes[3];
    const descreteNode2 = positions.nodes[5];
    const descreteNode3 = positions.nodes[4];

    const distToOneStepNode = getEuclideanDistance(focusPos, oneStepNode);
    const distToTwoStepNode = getEuclideanDistance(focusPos, twoStepNode);
    const distToDescreteNode1 = getEuclideanDistance(focusPos, descreteNode1);
    const distToDescreteNode2 = getEuclideanDistance(focusPos, descreteNode2);
    const distToDescreteNode3 = getEuclideanDistance(focusPos, descreteNode3);

    expect(mathEqual(distToOneStepNode, unitRadius)).toEqual(true);
    expect(mathEqual(distToTwoStepNode, 2 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode1, 3 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode2, 3 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode3, 4 * unitRadius)).toEqual(true);
  });

  it("should do radial layout with focusNode which is a descrete node", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });
    const unitRadius = 100;
    const focusNodeId = "5";

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      unitRadius,
    });
    const positions = await radial.execute(graph);

    const focusNode = positions.nodes.find((node) => node.id === focusNodeId);
    const descreteNode1 = positions.nodes[0];
    const descreteNode2 = positions.nodes[1];
    const descreteNode3 = positions.nodes[3];
    const descreteNode4 = positions.nodes[4];

    const distToDescreteNode1 = getEuclideanDistance(focusNode, descreteNode1);
    const distToDescreteNode2 = getEuclideanDistance(focusNode, descreteNode2);
    const distToDescreteNode3 = getEuclideanDistance(focusNode, descreteNode3);
    const distToDescreteNode4 = getEuclideanDistance(focusNode, descreteNode4);

    expect(mathEqual(distToDescreteNode1, unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode2, 2 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode3, unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode4, 2 * unitRadius)).toEqual(true);
  });

  it("should do radial layout with preventOverlap, number nodeSpacing, and array nodeSize", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });
    const unitRadius = 100;
    const focusNodeId = "5";
    const nodeSize = [40, 20];
    const nodeSpacing = 10;

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      unitRadius,
      nodeSpacing,
      nodeSize,
    });
    const positions = await radial.execute(graph);

    // const focusNode = positions.nodes.find(node => node.id === focusNodeId);
    const overlapNode1 = positions.nodes[2];
    const overlapNode2 = positions.nodes[4];
    const dist = getEuclideanDistance(overlapNode1, overlapNode2);
    expect(dist > nodeSpacing + Math.max(...nodeSize)).toEqual(true);
  });

  it("should do radial layout with preventOverlap, function nodeSpacing, and size in data", async () => {
    const graph = new Graph<any, any>({
      nodes: data.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          size: [40, 20],
        },
      })),
      edges: [...data.edges],
    });
    const unitRadius = 100;
    const focusNodeId = "5";
    const nodeSpacing = (d) => {
      return 5;
    };

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      unitRadius,
      nodeSpacing,
    });
    const positions = await radial.execute(graph);

    const overlapNode1 = positions.nodes[2];
    const overlapNode2 = positions.nodes[4];
    const dist = getEuclideanDistance(overlapNode1, overlapNode2);
    expect(dist > 5 + 40).toEqual(true);
  });

  it("should do radial layout with sortBy: 'data' ", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });
    const focusNodeId = "5";

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      sortBy: "data",
    });
    const positions = await radial.execute(graph);
    // keeps relative order in data.nodes
    if (positions.nodes[4].data.y < positions.nodes[2].data.y) {
      expect(positions.nodes[2].data.y < positions.nodes[1].data.y).toBe(true);
    } else {
      expect(positions.nodes[2].data.y > positions.nodes[1].data.y).toBe(true);
    }
  });

  it("should do radial layout with sortBy: 'sortProperty' ", async () => {
    const graph = new Graph<any, any>({
      nodes: data.nodes.map((node, i) => ({
        ...node,
        data: {
          ...node.data,
          sortProperty: i % 2,
        },
      })),
      edges: [...data.edges],
    });
    const focusNodeId = "5";

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      sortBy: "sortProperty",
      sortStrength: 1000,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      nodeSize: 50,
    });
    const positions = await radial.execute(graph);

    const sameClusterNodeDist = getEuclideanDistance(
      positions.nodes[4],
      positions.nodes[2]
    );
    const differentClusterNodeDist1 = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[1]
    );
    const differentClusterNodeDist2 = getEuclideanDistance(
      positions.nodes[4],
      positions.nodes[1]
    );
    expect(mathEqual(sameClusterNodeDist, 50)).toBe(true);
    expect(sameClusterNodeDist < differentClusterNodeDist1).toBe(true);
    expect(sameClusterNodeDist < differentClusterNodeDist2).toBe(true);
  });

  it("should not do radial layout with inexistent focusNode", async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const radial = new RadialLayout({
      focusNode: "id-inexistent",
      center: [10, 20],
    });
    const positions = await radial.execute(graph);

    // focusNode will be the first node
    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });
});
