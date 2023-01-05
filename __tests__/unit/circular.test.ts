// import { jest } from "@jest/globals";
import { Graph } from "@antv/graphlib";
import { CircularLayout } from "../../packages/layout/src";
import dataset from "../data";
import { mathEqual } from "../util";
const data = dataset.data;

describe("CircularLayout", () => {
  it("should skip layout when there's no node in graph.", () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const circular = new CircularLayout();

    const positions = circular.execute(graph);
    expect(positions).toEqual({ nodes: [], edges: [] });

    // Graph should remain unchanged.
    circular.assign(graph);
    expect(graph.getAllNodes()).toEqual([]);
    expect(graph.getAllEdges()).toEqual([]);

    // const mockOnLayoutEnd = jest.fn();
    // circular.execute(graph, { onLayoutEnd: mockOnLayoutEnd });
    // expect(mockOnLayoutEnd).toHaveBeenCalledTimes(1);
  });

  it("should layout quickly when there's only one node in graph.", () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: "Node1", data: {} }],
      edges: [],
    });

    const circular = new CircularLayout();

    // Use user-defined center.
    const positions = circular.execute(graph, { center: [100, 100] });
    expect(positions).toEqual({
      nodes: [
        {
          id: "Node1",
          x: 100,
          y: 100,
        },
      ],
      edges: [],
    });

    circular.assign(graph, { center: [100, 100] });
    expect(graph.getAllNodes()).toEqual([
      {
        id: "Node1",
        data: {
          x: 100,
          y: 100,
        },
      },
    ]);
    expect(graph.getAllEdges()).toEqual([]);
  });

  it("should layout with fixed radius, start angle, end angle.", () => {
    const graph = new Graph<any, any>({
      // @ts-ignore
      nodes: data.nodes,
      // @ts-ignore
      edges: data.edges,
    });

    const circular = new CircularLayout({
      center: [250, 250],
      radius: 200,
      startAngle: Math.PI / 4,
      endAngle: Math.PI,
    });

    const positions = circular.execute(graph);
    console.log(positions);

    const pos = (200 * Math.sqrt(2)) / 2;

    expect(mathEqual(positions.nodes[0].x, 250 + pos)).toEqual(true);

    // expect(mathEqual(data.nodes[0].x, 250 + pos)).toEqual(true);
    // expect(mathEqual(data.nodes[0].y, 250 + pos)).toEqual(true);
  });

  // it('circular with no radius but startRadius and endRadius', () => {
  //   const circular = new Layouts['circular']({
  //     center: [150, 200],
  //     startRadius: 1,
  //     endRadius: 100,
  //   });
  //   circular.layout(data)
  //   expect(data.nodes[0].x).toEqual(150 + 1);
  //   expect(data.nodes[0].y).toEqual(200);
  //   const nodeNumber = data.nodes.length;
  //   const nodeModelLast = data.nodes[nodeNumber - 1];
  //   expect(mathEqual(nodeModelLast.x, 248)).toEqual(true);
  //   expect(mathEqual(nodeModelLast.y, 180)).toEqual(true);
  // });
  // it('circular with no radius and startRadius but endRadius', () => {
  //   const circular = new Layouts['circular']({
  //     center: [150, 200],
  //     endRadius: 100,
  //   });
  //   circular.layout(data)
  //   const nodeModelFirst = data.nodes[0];
  //   expect(nodeModelFirst.x).toEqual(150 + 100);
  //   expect(nodeModelFirst.y).toEqual(200);
  // });

  // it('circular with no radius and endRadius but startRadius', () => {
  //   const circular = new Layouts['circular']({
  //     center: [150, 200],
  //     startRadius: 100,
  //   });
  //   circular.layout(data)
  //   const nodeModelFirst = data.nodes[0];
  //   expect(nodeModelFirst.x).toEqual(150 + 100);
  //   expect(nodeModelFirst.y).toEqual(200);
  // });

  // it('circular with topology ordering', () => {
  //   const circular = new Layouts['circular']({
  //     center: [250, 250],
  //     ordering: 'topology',
  //     radius: 200,
  //   });
  //   circular.layout(data)

  //   let node0, node1, node2, node3;
  //   data.nodes.forEach(node => {
  //     if (node.id === 'Uruguay') node0 = node;
  //     else if (node.id === 'Saudi Arabia') node1 = node;
  //     else if (node.id === 'Switzerland') node2 = node;
  //     else if (node.id === 'Sweden') node3 = node;
  //   })

  //   const dist1 =
  //     (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);

  //   const dist2 =
  //     (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);

  //   expect(mathEqual(dist1, dist2)).toEqual(true);

  //   const dist3 =
  //     (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
  //   expect(mathEqual(dist3, dist2)).toEqual(true);
  // });

  // it('circular with topology-directed ordering', () => {
  //   const circular = new Layouts['circular']({
  //     center: [250, 250],
  //     ordering: 'topology-directed',
  //     radius: 200,
  //   });
  //   circular.layout(data)

  //   let node0, node1, node2, node3;
  //   data.nodes.forEach(node => {
  //     if (node.id === 'Uruguay') node0 = node;
  //     else if (node.id === 'Tunisia') node1 = node;
  //     else if (node.id === 'Switzerland') node2 = node;
  //     else if (node.id === 'Sweden') node3 = node;
  //   })

  //   const dist1 =
  //     (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);

  //   const dist2 =
  //     (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);
  //   expect(mathEqual(dist1, dist2)).toEqual(true);

  //   const dist3 =
  //     (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
  //   expect(mathEqual(dist3, dist2)).toEqual(true);
  // });

  // it('circular with degree ordering, counterclockwise', () => {
  //   const circular = new Layouts['circular']({
  //     center: [250, 250],
  //     ordering: 'degree',
  //     radius: 200,
  //     clockwise: false,
  //   });
  //   circular.layout(data)

  //   let node0, node1, node2, node3;
  //   data.nodes.forEach(node => {
  //     if (node.id === 'England') node0 = node;
  //     else if (node.id === 'Croatia') node1 = node;
  //     else if (node.id === 'Belgium') node2 = node;
  //     else if (node.id === 'Uruguay') node3 = node;
  //   })
  //   const dist1 =
  //     (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);

  //   const dist2 =
  //     (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);
  //   expect(mathEqual(dist1, dist2)).toEqual(true);

  //   const dist3 =
  //     (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
  //   expect(mathEqual(dist3, dist2)).toEqual(true);
  // });
});
