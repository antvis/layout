import { Graph, ID } from '@antv/graphlib';
import {
  DagreRankdir,
  EdgeData,
  Graph as IGraph,
  NodeData,
  Point,
} from '../../../packages/layout';
import { layout } from '../../../packages/layout/src/antv-dagre/layout';

describe.skip('layout', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  test('can layout a single node', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 0,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 100 / 2 },
    });
    expect(g.getNode('a').data.x).toEqual(50 / 2);
    expect(g.getNode('a').data.y).toEqual(100 / 2);
  });

  test('can layout two nodes on the same rank', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 75, height: 200 },
    });
    layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 0,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
      nodesep: 200,
    });
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });

  test('can layout two nodes connected by an edge', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 75, height: 200 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {},
    });
    layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 300,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });
    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 },
    });

    // We should not get x, y coordinates if the edge has no label
    expect(g.getEdge('e1').data).not.toHaveProperty('x');
    expect(g.getEdge('e1').data).not.toHaveProperty('y');
  });

  test('can layout an edge with a label', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 75, height: 200 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {
        width: 60,
        height: 70,
        labelpos: 'c',
      },
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 300,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });

    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 },
    });
    expect(g.getEdge('e1').data.x).toEqual(75 / 2);
    expect(g.getEdge('e1').data.y).toEqual(100 + 150 + 70 / 2);
  });

  describe('can layout an edge with a long label, with rankdir =', function () {
    (['TB', 'BT', 'LR', 'RL'] as DagreRankdir[]).forEach((rankdir) => {
      test(`can layout an edge with a long label, with rankdir = ${rankdir}`, function () {
        ['a', 'b', 'c', 'd'].forEach(function (v) {
          g.addNode({
            id: v,
            data: { width: 10, height: 10 },
          });
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'c',
          data: { width: 2000, height: 10, labelpos: 'c' },
        });
        g.addEdge({
          id: 'e2',
          source: 'b',
          target: 'd',
          data: { width: 1, height: 1 },
        });

        const { width, height } = layout(g, {
          keepNodeOrder: false,
          prevGraph: null,
          acyclicer: 'greedy',
          nodeOrder: [],
          ranker: 'network-simplex',
          rankdir,
          nodesep: 10,
          edgesep: 10,
        });

        let p1, p2;
        if (rankdir === 'TB' || rankdir === 'BT') {
          p1 = g.getEdge('e1');
          p2 = g.getEdge('e2');
        } else {
          p1 = g.getNode('a');
          p2 = g.getNode('c');
        }

        expect(Math.abs(p1.data.x - p2.data.x)).toBeGreaterThan(1000);
      });
    });
  });

  describe.skip('can apply an offset, with rankdir =', function () {
    (['TB', 'BT', 'LR', 'RL'] as DagreRankdir[]).forEach((rankdir) => {
      test(`can apply an offset, with rankdir = ${rankdir}`, function () {
        ['a', 'b', 'c', 'd'].forEach(function (v) {
          g.addNode({
            id: v,
            data: { width: 10, height: 10 },
          });
        });

        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: { width: 10, height: 10, labelpos: 'l', labeloffset: 1000 },
        });
        g.addEdge({
          id: 'e2',
          source: 'c',
          target: 'd',
          data: { width: 10, height: 10, labelpos: 'r', labeloffset: 1000 },
        });

        const { width, height } = layout(g, {
          keepNodeOrder: false,
          prevGraph: null,
          acyclicer: 'greedy',
          nodeOrder: [],
          ranker: 'network-simplex',
          rankdir,
          nodesep: 10,
          edgesep: 10,
        });

        if (rankdir === 'TB' || rankdir === 'BT') {
          expect(
            g.getEdge('e1').data.x! - g.getEdge('e1').data.points![0].x,
          ).toEqual(-1000 - 10 / 2);
          expect(
            g.getEdge('e2').data.x! - g.getEdge('e2').data.points![0].x,
          ).toEqual(1000 + 10 / 2);
        } else {
          expect(
            g.getEdge('e1').data.y! - g.getEdge('e1').data.points![0].y,
          ).toEqual(-1000 - 10 / 2);
          expect(
            g.getEdge('e2').data.y! - g.getEdge('e2').data.points![0].y,
          ).toEqual(1000 + 10 / 2);
        }
      });
    });
  });

  test('can layout a long edge with a label', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 75, height: 200 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {
        width: 60,
        height: 70,
        minlen: 2,
        labelpos: 'c',
      },
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 300,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });

    expect(g.getEdge('e1').data.x).toEqual(75 / 2);
    expect(g.getEdge('e1').data.y).toBeGreaterThan(g.getNode('a').data.y!);
    expect(g.getEdge('e1').data.y).toBeLessThan(g.getNode('b').data.y!);
  });

  test('can layout out a short cycle', function () {
    g.addNode({
      id: 'a',
      data: { width: 100, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 100, height: 100 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {
        weight: 2,
      },
    });
    g.addEdge({
      id: 'e2',
      source: 'b',
      target: 'a',
      data: {},
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 200,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });

    expect(extractCoordinates(g)).toEqual({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2 },
    });
    // One arrow should point down, one up
    expect(g.getEdge('e1').data.points![1].y).toBeGreaterThan(
      g.getEdge('e1').data.points![0].y,
    );
    expect(g.getEdge('e2').data.points![0].y).toBeGreaterThan(
      g.getEdge('e2').data.points![1].y,
    );
  });

  test('adds rectangle intersects for edges', function () {
    g.addNode({
      id: 'a',
      data: { width: 100, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 100, height: 100 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {},
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 200,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });

    let points = g.getEdge('e1').data.points;
    expect(points).toHaveLength(3);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }, // intersect with top of b
    ]);
  });

  test('adds rectangle intersects for edges spanning multiple ranks', function () {
    g.addNode({
      id: 'a',
      data: { width: 100, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 100, height: 100 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: { minlen: 2 },
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 200,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });

    let points = g.getEdge('e1').data.points;
    expect(points).toHaveLength(5);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 }, // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }, // intersect with top of b
    ]);
  });

  describe('can layout a self loop', function () {
    (['TB', 'BT', 'LR', 'RL'] as DagreRankdir[]).forEach(function (rankdir) {
      test('in rankdir = ' + rankdir, function () {
        g.addNode({
          id: 'a',
          data: { width: 100, height: 100 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'a',
          data: { width: 50, height: 50 },
        });
        const { width, height } = layout(g, {
          keepNodeOrder: false,
          prevGraph: null,
          acyclicer: 'greedy',
          nodeOrder: [],
          ranker: 'network-simplex',
          rankdir,
          edgesep: 75,
        });

        let nodeA = g.getNode('a');
        let points = g.getEdge('e1').data.points!;
        expect(points).toHaveLength(7);

        points.forEach(function (point: Point) {
          if (rankdir !== 'LR' && rankdir !== 'RL') {
            expect(point.x).toBeGreaterThan(nodeA.data.x!);
            expect(Math.abs(point.y - nodeA.data.y!)).toBeLessThanOrEqual(
              (nodeA.data.height as number) / 2,
            );
          } else {
            expect(point.y).toBeGreaterThan(nodeA.data.y!);
            expect(Math.abs(point.x - nodeA.data.x!)).toBeLessThanOrEqual(
              (nodeA.data.width as number) / 2,
            );
          }
        });
      });
    });
  });

  test('can layout a graph with subgraphs', function () {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.addNode({
      id: 'a',
      data: { width: 50, height: 50 },
    });
    g.addNode({
      id: 'sg1',
      data: {},
    });
    g.setParent('a', 'sg1');

    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });
  });

  test('minimizes the height of subgraphs', function () {
    ['a', 'b', 'c', 'd', 'x', 'y'].forEach(function (v) {
      g.addNode({
        id: v,
        data: { width: 50, height: 50 },
      });
    });
    g.addNode({
      id: 'sg',
      data: {},
    });

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {},
      },
      {
        id: 'e2',
        source: 'b',
        target: 'c',
        data: {},
      },
      {
        id: 'e3',
        source: 'c',
        target: 'd',
        data: {},
      },
      {
        id: 'e4',
        source: 'a',
        target: 'x',
        data: { weight: 100 },
      },
      {
        id: 'e5',
        source: 'y',
        target: 'd',
        data: { weight: 100 },
      },
    ]);

    g.setParent('x', 'sg');
    g.setParent('y', 'sg');
    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });
    expect(g.getNode('x').data.y).toEqual(g.getNode('y').data.y);
  });
  test.skip('can layout subgraphs with different rankdirs', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 50 },
    });
    g.addNode({
      id: 'sg',
      data: {},
    });
    g.setParent('a', 'sg');

    function check() {
      expect(g.getNode('sg').data.width).toBeGreaterThan(50);
      expect(g.getNode('sg').data.height).toBeGreaterThan(50);
      expect(g.getNode('sg').data.x).toBeGreaterThan(50 / 2);
      expect(g.getNode('sg').data.y).toBeGreaterThan(50 / 2);
    }
    (['tb'] as DagreRankdir[]).forEach(function (rankdir) {
      // (["tb", "bt", "lr", "rl"] as DagreRankdir[]).forEach(function (rankdir) {
      const { width, height } = layout(g, {
        keepNodeOrder: false,
        prevGraph: null,
        acyclicer: 'greedy',
        nodeOrder: [],
        ranker: 'network-simplex',
        rankdir,
      });
      check();
    });
  });
  test('adds dimensions to the graph', function () {
    g.addNode({
      id: 'a',
      data: { width: 100, height: 50 },
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      ranksep: 0,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
    });
    expect(width).toEqual(100);
    expect(height).toEqual(50);
  });

  describe.skip('ensures all coordinates are in the bounding box for the graph', function () {
    (['TB', 'BT', 'LR', 'RL'] as DagreRankdir[]).forEach(function (rankdir) {
      describe(rankdir, function () {
        test('node', function () {
          g.addNode({
            id: 'a',
            data: { width: 100, height: 200 },
          });
          const { width, height } = layout(g, {
            keepNodeOrder: false,
            prevGraph: null,
            acyclicer: 'greedy',
            nodeOrder: [],
            ranker: 'network-simplex',
            rankdir,
          });
          expect(g.getNode('a').data.x).toEqual(100 / 2);
          expect(g.getNode('a').data.y).toEqual(200 / 2);
        });

        test('edge, labelpos = l', function () {
          g.addNode({
            id: 'a',
            data: { width: 100, height: 100 },
          });
          g.addNode({
            id: 'b',
            data: { width: 100, height: 100 },
          });

          g.addEdge({
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {
              width: 1000,
              height: 2000,
              labelpos: 'l',
              labeloffset: 0,
            },
          });
          const { width, height } = layout(g, {
            keepNodeOrder: false,
            prevGraph: null,
            acyclicer: 'greedy',
            nodeOrder: [],
            ranker: 'network-simplex',
            rankdir,
          });
          if (rankdir === 'TB' || rankdir === 'BT') {
            expect(g.getEdge('e1').data.x).toEqual(1000 / 2);
          } else {
            expect(g.getEdge('e1').data.y).toEqual(2000 / 2);
          }
        });
      });
    });
  });

  test('treats attributes with case-insensitivity', function () {
    g.addNode({
      id: 'a',
      data: { width: 50, height: 100 },
    });
    g.addNode({
      id: 'b',
      data: { width: 75, height: 200 },
    });
    const { width, height } = layout(g, {
      keepNodeOrder: false,
      prevGraph: null,
      acyclicer: 'greedy',
      nodeOrder: [],
      ranker: 'network-simplex',
      rankdir: 'TB',
      nodesep: 200,
    });

    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 },
    });
  });
});

function extractCoordinates(g: IGraph) {
  const coords: Record<ID, { x: number; y: number }> = {};
  g.getAllNodes().forEach(function (v) {
    coords[v.id] = {
      x: v.data.x as number,
      y: v.data.y as number,
    };
  });
  return coords;
}
