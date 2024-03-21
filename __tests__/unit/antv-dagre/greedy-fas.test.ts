import { Edge, Graph } from '@antv/graphlib';
import { EdgeData, Graph as IGraph, NodeData } from '../../../packages/layout';
import { greedyFAS } from '../../../packages/layout/src/antv-dagre/greedy-fas';
import { findCycles } from '../../util';

describe('greedyFAS', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  test('returns the empty set for empty graphs', function () {
    expect(greedyFAS(g)).toEqual([]);
  });

  test('returns the empty set for single-node graphs', function () {
    g.addNode({
      id: 'a',
      data: {},
    });
    expect(greedyFAS(g)).toEqual([]);
  });

  test('returns an empty set if the input graph is acyclic', function () {
    g.addNode({
      id: 'a',
      data: {},
    });
    g.addNode({
      id: 'b',
      data: {},
    });
    g.addNode({
      id: 'c',
      data: {},
    });
    g.addNode({
      id: 'd',
      data: {},
    });
    g.addNode({
      id: 'e',
      data: {},
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {},
    });
    g.addEdge({
      id: 'e2',
      source: 'b',
      target: 'c',
      data: {},
    });
    g.addEdge({
      id: 'e3',
      source: 'b',
      target: 'd',
      data: {},
    });
    g.addEdge({
      id: 'e4',
      source: 'a',
      target: 'e',
      data: {},
    });
    expect(greedyFAS(g)).toEqual([]);
  });

  test('returns a single edge with a simple cycle', function () {
    g.addNode({
      id: 'a',
      data: {},
    });
    g.addNode({
      id: 'b',
      data: {},
    });
    g.addEdge({
      id: 'e3',
      source: 'a',
      target: 'b',
      data: {},
    });
    g.addEdge({
      id: 'e4',
      source: 'b',
      target: 'a',
      data: {},
    });
    checkFAS(g, greedyFAS(g));
  });

  test('returns a single edge in a 4-node cycle', function () {
    g.addNodes([
      {
        id: 'n1',
        data: {},
      },
      {
        id: 'n2',
        data: {},
      },
      {
        id: 'n3',
        data: {},
      },
      {
        id: 'n4',
        data: {},
      },
      {
        id: 'n5',
        data: {},
      },
      {
        id: 'n6',
        data: {},
      },
    ]);
    g.addEdges([
      {
        id: 'e1',
        source: 'n1',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e2',
        source: 'n2',
        target: 'n3',
        data: { weight: 1 },
      },
      {
        id: 'e3',
        source: 'n3',
        target: 'n4',
        data: { weight: 1 },
      },
      {
        id: 'e4',
        source: 'n4',
        target: 'n5',
        data: { weight: 1 },
      },
      {
        id: 'e5',
        source: 'n5',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e6',
        source: 'n3',
        target: 'n5',
        data: { weight: 1 },
      },
      {
        id: 'e7',
        source: 'n4',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e8',
        source: 'n4',
        target: 'n6',
        data: { weight: 1 },
      },
    ]);
    checkFAS(g, greedyFAS(g));
  });

  test('returns two edges for two 4-node cycles', function () {
    g.addNodes([
      {
        id: 'n1',
        data: {},
      },
      {
        id: 'n2',
        data: {},
      },
      {
        id: 'n3',
        data: {},
      },
      {
        id: 'n4',
        data: {},
      },
      {
        id: 'n5',
        data: {},
      },
      {
        id: 'n6',
        data: {},
      },
      {
        id: 'n7',
        data: {},
      },
      {
        id: 'n8',
        data: {},
      },
      {
        id: 'n9',
        data: {},
      },
      {
        id: 'n10',
        data: {},
      },
    ]);
    g.addEdges([
      {
        id: 'e1',
        source: 'n1',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e2',
        source: 'n2',
        target: 'n3',
        data: { weight: 1 },
      },
      {
        id: 'e3',
        source: 'n3',
        target: 'n4',
        data: { weight: 1 },
      },
      {
        id: 'e4',
        source: 'n4',
        target: 'n5',
        data: { weight: 1 },
      },
      {
        id: 'e5',
        source: 'n5',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e6',
        source: 'n3',
        target: 'n5',
        data: { weight: 1 },
      },
      {
        id: 'e7',
        source: 'n4',
        target: 'n2',
        data: { weight: 1 },
      },
      {
        id: 'e8',
        source: 'n4',
        target: 'n6',
        data: { weight: 1 },
      },
      {
        id: 'e9',
        source: 'n6',
        target: 'n7',
        data: { weight: 1 },
      },
      {
        id: 'e10',
        source: 'n7',
        target: 'n8',
        data: { weight: 1 },
      },
      {
        id: 'e11',
        source: 'n8',
        target: 'n9',
        data: { weight: 1 },
      },
      {
        id: 'e12',
        source: 'n9',
        target: 'n6',
        data: { weight: 1 },
      },
      {
        id: 'e13',
        source: 'n7',
        target: 'n9',
        data: { weight: 1 },
      },
      {
        id: 'e14',
        source: 'n8',
        target: 'n6',
        data: { weight: 1 },
      },
      {
        id: 'e15',
        source: 'n8',
        target: 'n10',
        data: { weight: 1 },
      },
    ]);

    checkFAS(g, greedyFAS(g));
  });

  test('works with arbitrarily weighted edges', function () {
    // Our algorithm should also work for graphs with multi-edges, a graph
    // where more than one edge can be pointing in the same direction between
    // the same pair of incident nodes. We try this by assigning weights to
    // our edges representing the number of edges from one node to the other.

    let g1 = new Graph();
    g1.addNodes([
      {
        id: 'n1',
        data: {},
      },
      {
        id: 'n2',
        data: {},
      },
    ]);
    g1.addEdge({
      id: 'e1',
      source: 'n1',
      target: 'n2',
      data: {
        weight: 2,
      },
    });
    g1.addEdge({
      id: 'e2',
      source: 'n2',
      target: 'n1',
      data: {
        weight: 1,
      },
    });

    expect(greedyFAS(g1, weightFn(g1))).toEqual([
      { id: 'e2', source: 'n2', target: 'n1', data: { weight: 1 } },
    ]);

    let g2 = new Graph();
    g2.addNodes([
      {
        id: 'n1',
        data: {},
      },
      {
        id: 'n2',
        data: {},
      },
    ]);
    g2.addEdge({
      id: 'e1',
      source: 'n1',
      target: 'n2',
      data: {
        weight: 1,
      },
    });
    g2.addEdge({
      id: 'e2',
      source: 'n2',
      target: 'n1',
      data: {
        weight: 2,
      },
    });

    expect(greedyFAS(g2, weightFn(g2))).toEqual([
      { id: 'e1', source: 'n1', target: 'n2', data: { weight: 1 } },
    ]);
  });

  test('works for multigraphs', function () {
    let g = new Graph();
    g.addNodes([
      {
        id: 'a',
        data: {},
      },
      {
        id: 'b',
        data: {},
      },
    ]);
    g.addEdge({
      id: 'foo',
      source: 'a',
      target: 'b',
      data: {
        weight: 5,
      },
    });
    g.addEdge({
      id: 'bar',
      source: 'b',
      target: 'a',
      data: {
        weight: 2,
      },
    });
    g.addEdge({
      id: 'baz',
      source: 'b',
      target: 'a',
      data: {
        weight: 2,
      },
    });

    expect(greedyFAS(g, weightFn(g))).toEqual([
      {
        id: 'bar',
        source: 'b',
        target: 'a',
        data: {
          weight: 2,
        },
      },
      {
        id: 'baz',
        source: 'b',
        target: 'a',
        data: {
          weight: 2,
        },
      },
    ]);
  });
});

function checkFAS(g: IGraph, fas: Edge<EdgeData>[]) {
  let n = g.getAllNodes().length;
  let m = g.getAllEdges().length;
  fas.forEach((edge) => {
    g.removeEdge(edge.id);
  });
  expect(findCycles(g)).toEqual([]);
  // The more direct m/2 - n/6 fails for the simple cycle A <-> B, where one
  // edge must be reversed, but the performance bound implies that only 2/3rds
  // of an edge can be reversed. I'm using floors to acount for this.
  expect(fas.length).toBeLessThanOrEqual(Math.floor(m / 2) - Math.floor(n / 6));
}

function weightFn(g: IGraph) {
  return function (e: Edge<EdgeData>): number {
    return e.data.weight!;
  };
}
