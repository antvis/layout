import { Graph, ID } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../../packages/layout';
import * as bk from '../../../../packages/layout/src/antv-dagre/position/bk';
import { buildLayerMatrix } from '../../../../packages/layout/src/antv-dagre/util';

let findType1Conflicts = bk.findType1Conflicts;
let findType2Conflicts = bk.findType2Conflicts;
let addConflict = bk.addConflict;
let hasConflict = bk.hasConflict;
let verticalAlignment = bk.verticalAlignment;
let horizontalCompaction = bk.horizontalCompaction;
let alignCoordinates = bk.alignCoordinates;
let balance = bk.balance;
let findSmallestWidthAlignment = bk.findSmallestWidthAlignment;
let positionX = bk.positionX;

describe('position/bk', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  describe('findType1Conflicts', function () {
    let layering: ID[][];

    beforeEach(function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1 },
        },
      ]);
      // Set up crossing
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'd',
          data: { weight: 1 },
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: { weight: 1 },
        },
      ]);

      layering = buildLayerMatrix(g);
    });

    test('does not mark edges that have no conflict', function () {
      g.removeEdge('e1');
      g.removeEdge('e2');

      g.addEdges([
        {
          id: 'e3',
          source: 'a',
          target: 'c',
          data: { weight: 1 },
        },
        {
          id: 'e4',
          source: 'b',
          target: 'd',
          data: { weight: 1 },
        },
      ]);

      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, 'a', 'c')).toBe(false);
      expect(hasConflict(conflicts, 'b', 'd')).toBe(false);
    });

    test('does not mark type-0 conflicts (no dummies)', function () {
      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, 'a', 'd')).toBe(false);
      expect(hasConflict(conflicts, 'b', 'c')).toBe(false);
    });

    ['a', 'b', 'c', 'd'].forEach(function (v) {
      test('does not mark type-0 conflicts (' + v + ' is dummy)', function () {
        g.getNode(v).data.dummy = true;

        let conflicts = findType1Conflicts(g, layering);
        expect(hasConflict(conflicts, 'a', 'd')).toBe(false);
        expect(hasConflict(conflicts, 'b', 'c')).toBe(false);
      });
    });

    ['a', 'b', 'c', 'd'].forEach(function (v) {
      test('does mark type-1 conflicts (' + v + ' is non-dummy)', function () {
        ['a', 'b', 'c', 'd'].forEach(function (w) {
          if (v !== w) {
            g.getNode(w).data.dummy = true;
          }
        });

        let conflicts = findType1Conflicts(g, layering);
        if (v === 'a' || v === 'd') {
          expect(hasConflict(conflicts, 'a', 'd')).toBe(true);
          expect(hasConflict(conflicts, 'b', 'c')).toBe(false);
        } else {
          expect(hasConflict(conflicts, 'a', 'd')).toBe(false);
          expect(hasConflict(conflicts, 'b', 'c')).toBe(true);
        }
      });
    });

    test('does not mark type-2 conflicts (all dummies)', function () {
      ['a', 'b', 'c', 'd'].forEach(function (v) {
        g.getNode(v).data.dummy = true;
      });

      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, 'a', 'd')).toBe(false);
      expect(hasConflict(conflicts, 'b', 'c')).toBe(false);
      findType1Conflicts(g, layering);
    });
  });

  describe('findType2Conflicts', function () {
    let layering: any;

    beforeEach(function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1 },
        },
      ]);
      // Set up crossing
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'd',
          data: { weight: 1 },
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: { weight: 1 },
        },
      ]);

      layering = buildLayerMatrix(g);
    });

    test('marks type-2 conflicts favoring border segments #1', function () {
      ['a', 'd'].forEach(function (v) {
        g.getNode(v).data.dummy = true;
      });

      ['b', 'c'].forEach(function (v) {
        g.getNode(v).data.dummy = 'border';
      });

      let conflicts = findType2Conflicts(g, layering);
      expect(hasConflict(conflicts, 'a', 'd')).toBe(true);
      expect(hasConflict(conflicts, 'b', 'c')).toBe(false);
      findType1Conflicts(g, layering);
    });

    test('marks type-2 conflicts favoring border segments #2', function () {
      ['b', 'c'].forEach(function (v) {
        g.getNode(v).data.dummy = true;
      });

      ['a', 'd'].forEach(function (v) {
        g.getNode(v).data.dummy = 'border';
      });

      let conflicts = findType2Conflicts(g, layering);
      expect(hasConflict(conflicts, 'a', 'd')).toBe(false);
      expect(hasConflict(conflicts, 'b', 'c')).toBe(true);
      findType1Conflicts(g, layering);
    });
  });

  describe('hasConflict', function () {
    test('can test for a type-1 conflict regardless of edge orientation', function () {
      let conflicts = {};
      addConflict(conflicts, 'b', 'a');
      expect(hasConflict(conflicts, 'a', 'b')).toBe(true);
      expect(hasConflict(conflicts, 'b', 'a')).toBe(true);
    });

    test('works for multiple conflicts with the same node', function () {
      let conflicts = {};
      addConflict(conflicts, 'a', 'b');
      addConflict(conflicts, 'a', 'c');
      expect(hasConflict(conflicts, 'a', 'b')).toBe(true);
      expect(hasConflict(conflicts, 'a', 'c')).toBe(true);
    });
  });

  describe('verticalAlignment', function () {
    test('Aligns with itself if the node has no adjacencies', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0, order: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 1, order: 0 },
      });

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'b' },
        align: { a: 'a', b: 'b' },
      });
    });

    test('Aligns with its sole adjacency', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0, order: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 1, order: 0 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {},
      });

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'a' },
        align: { a: 'b', b: 'a' },
      });
    });

    test('aligns with its left median when possible', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'c',
          data: {},
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'b', c: 'a' },
        align: { a: 'c', b: 'b', c: 'a' },
      });
    });

    test('aligns correctly even regardless of node name / insertion order', function () {
      // This test ensures that we're actually properly sorting nodes by
      // position when searching for candidates. Many of these tests previously
      // passed because the node insertion order matched the order of the nodes
      // in the layering.
      g.addNodes([
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
        {
          id: 'z',
          data: { rank: 0, order: 0 },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'z',
          target: 'c',
          data: {},
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { z: 'z', b: 'b', c: 'z' },
        align: { z: 'c', b: 'b', c: 'z' },
      });
    });

    test('aligns with its right median when left is unavailable', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'c',
          data: {},
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      addConflict(conflicts, 'a', 'c');

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'b', c: 'b' },
        align: { a: 'a', b: 'c', c: 'b' },
      });
    });

    test('aligns with neither median if both are unavailable', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1 },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'd',
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
          source: 'b',
          target: 'd',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      // c will align with b, so d will not be able to align with a, because
      // (a,d) and (c,b) cross.
      expect(result).toEqual({
        root: { a: 'a', b: 'b', c: 'b', d: 'd' },
        align: { a: 'a', b: 'c', c: 'b', d: 'd' },
      });
    });

    test('aligns with the single median for an odd number of adjacencies', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1 },
        },
        {
          id: 'c',
          data: { rank: 0, order: 2 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 0 },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'd',
          data: {},
        },
        {
          id: 'e2',
          source: 'b',
          target: 'd',
          data: {},
        },
        {
          id: 'e3',
          source: 'c',
          target: 'd',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'b', c: 'c', d: 'b' },
        align: { a: 'a', b: 'd', c: 'c', d: 'b' },
      });
    });

    test('aligns blocks across multiple layers', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 0 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 1 },
        },
        {
          id: 'd',
          data: { rank: 2, order: 0 },
        },
      ]);

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
          target: 'd',
          data: {},
        },
        {
          id: 'e3',
          source: 'a',
          target: 'c',
          data: {},
        },
        {
          id: 'e4',
          source: 'c',
          target: 'd',
          data: {},
        },
      ]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(
        g,
        layering,
        conflicts,
        g.getPredecessors.bind(g),
      );
      expect(result).toEqual({
        root: { a: 'a', b: 'a', c: 'c', d: 'a' },
        align: { a: 'b', b: 'd', c: 'c', d: 'a' },
      });
    });
  });

  describe('horizonalCompaction', function () {
    test('places the center of a single node graph at origin (0,0)', function () {
      let root = { a: 'a' };
      let align = { a: 'a' };
      g.addNode({
        id: 'a',
        data: { rank: 0, order: 0 },
      });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 0);
      expect(xs.a).toEqual(0);
    });

    test('separates adjacent nodes by specified node separation', function () {
      let root = { a: 'a', b: 'b' };
      let align = { a: 'a', b: 'b' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 200 },
        },
      ]);

      let xs = horizontalCompaction(
        g,
        buildLayerMatrix(g),
        root,
        align,
        100,
        0,
      );
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 100 + 200 / 2);
    });

    test('separates adjacent edges by specified node separation', function () {
      let root = { a: 'a', b: 'b' };
      let align = { a: 'a', b: 'b' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100, dummy: true },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 200, dummy: true },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 20);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 20 + 200 / 2);
    });

    test('aligns the centers of nodes in the same block', function () {
      let root = { a: 'a', b: 'a' };
      let align = { a: 'b', b: 'a' };
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 0, width: 200 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 0);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(0);
    });

    test('separates blocks with the appropriate separation', function () {
      let root = { a: 'a', b: 'a', c: 'c' };
      let align = { a: 'b', b: 'a', c: 'c' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 1, width: 200 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 50 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 75, 0);
      expect(xs.a).toEqual(50 / 2 + 75 + 200 / 2);
      expect(xs.b).toEqual(50 / 2 + 75 + 200 / 2);
      expect(xs.c).toEqual(0);
    });

    test('separates classes with the appropriate separation', function () {
      let root = { a: 'a', b: 'b', c: 'c', d: 'b' };
      let align = { a: 'a', b: 'd', c: 'c', d: 'b' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 200 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 50 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 80 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 75, 0);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 75 + 200 / 2);
      expect(xs.c).toEqual(100 / 2 + 75 + 200 / 2 - 80 / 2 - 75 - 50 / 2);
      expect(xs.d).toEqual(100 / 2 + 75 + 200 / 2);
    });

    test('shifts classes by max sep from the adjacent block #1', function () {
      let root = { a: 'a', b: 'b', c: 'a', d: 'b' };
      let align = { a: 'c', b: 'd', c: 'a', d: 'b' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 50 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 150 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 60 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 70 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 75, 0);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(50 / 2 + 75 + 150 / 2);
      expect(xs.c).toEqual(0);
      expect(xs.d).toEqual(50 / 2 + 75 + 150 / 2);
    });

    test('shifts classes by max sep from the adjacent block #2', function () {
      let root = { a: 'a', b: 'b', c: 'a', d: 'b' };
      let align = { a: 'c', b: 'd', c: 'a', d: 'b' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 50 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 70 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 60 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 150 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 75, 0);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(60 / 2 + 75 + 150 / 2);
      expect(xs.c).toEqual(0);
      expect(xs.d).toEqual(60 / 2 + 75 + 150 / 2);
    });

    test('cascades class shift', function () {
      let root = { a: 'a', b: 'b', c: 'c', d: 'd', e: 'b', f: 'f', g: 'd' };
      let align = { a: 'a', b: 'e', c: 'c', d: 'g', e: 'b', f: 'f', g: 'd' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 50 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 50 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 50 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 50 },
        },
        {
          id: 'e',
          data: { rank: 1, order: 2, width: 50 },
        },
        {
          id: 'f',
          data: { rank: 2, order: 0, width: 50 },
        },
        {
          id: 'g',
          data: { rank: 2, order: 1, width: 50 },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 75, 0);

      // Use f as 0, everything is relative to it
      expect(xs.a).toEqual(xs.b - 50 / 2 - 75 - 50 / 2);
      expect(xs.b).toEqual(xs.e);
      expect(xs.c).toEqual(xs.f);
      expect(xs.d).toEqual(xs.c + 50 / 2 + 75 + 50 / 2);
      expect(xs.e).toEqual(xs.d + 50 / 2 + 75 + 50 / 2);
      expect(xs.g).toEqual(xs.f + 50 / 2 + 75 + 50 / 2);
    });

    test('handles labelpos = l', function () {
      let root = { a: 'a', b: 'b', c: 'c' };
      let align = { a: 'a', b: 'b', c: 'c' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100, dummy: 'edge' },
        },
        {
          id: 'b',
          data: {
            rank: 0,
            order: 1,
            width: 200,
            dummy: 'edge-label',
            labelpos: 'l',
          },
        },
        {
          id: 'c',
          data: { rank: 0, order: 2, width: 300, dummy: 'edge' },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 50);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 200);
      expect(xs.c).toEqual(xs.b + 0 + 50 + 300 / 2);
    });

    test('handles labelpos = c', function () {
      let root = { a: 'a', b: 'b', c: 'c' };
      let align = { a: 'a', b: 'b', c: 'c' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100, dummy: 'edge' },
        },
        {
          id: 'b',
          data: {
            rank: 0,
            order: 1,
            width: 200,
            dummy: 'edge-label',
            labelpos: 'c',
          },
        },
        {
          id: 'c',
          data: { rank: 0, order: 2, width: 300, dummy: 'edge' },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 50);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 200 / 2);
      expect(xs.c).toEqual(xs.b + 200 / 2 + 50 + 300 / 2);
    });

    test('handles labelpos = r', function () {
      let root = { a: 'a', b: 'b', c: 'c' };
      let align = { a: 'a', b: 'b', c: 'c' };

      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100, dummy: 'edge' },
        },
        {
          id: 'b',
          data: {
            rank: 0,
            order: 1,
            width: 200,
            dummy: 'edge-label',
            labelpos: 'r',
          },
        },
        {
          id: 'c',
          data: { rank: 0, order: 2, width: 300, dummy: 'edge' },
        },
      ]);

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align, 0, 50);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 0);
      expect(xs.c).toEqual(xs.b + 200 + 50 + 300 / 2);
    });
  });

  describe('alignCoordinates', function () {
    test('aligns a single node', function () {
      let xss = {
        ul: { a: 50 },
        ur: { a: 100 },
        dl: { a: 50 },
        dr: { a: 200 },
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).toEqual({ a: 50 });
      expect(xss.ur).toEqual({ a: 50 });
      expect(xss.dl).toEqual({ a: 50 });
      expect(xss.dr).toEqual({ a: 50 });
    });

    test('aligns multiple nodes', function () {
      let xss = {
        ul: { a: 50, b: 1000 },
        ur: { a: 100, b: 900 },
        dl: { a: 150, b: 800 },
        dr: { a: 200, b: 700 },
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).toEqual({ a: 50, b: 1000 });
      expect(xss.ur).toEqual({ a: 200, b: 1000 });
      expect(xss.dl).toEqual({ a: 50, b: 700 });
      expect(xss.dr).toEqual({ a: 500, b: 1000 });
    });
  });

  describe('findSmallestWidthAlignment', function () {
    test('finds the alignment with the smallest width', function () {
      g.addNodes([
        {
          id: 'a',
          data: { width: 50 },
        },
        {
          id: 'b',
          data: { width: 50 },
        },
      ]);

      let xss = {
        ul: { a: 0, b: 1000 },
        ur: { a: -5, b: 1000 },
        dl: { a: 5, b: 2000 },
        dr: { a: 0, b: 200 },
      };

      expect(findSmallestWidthAlignment(g, xss)).toEqual(xss.dr);
    });

    test('takes node width into account', function () {
      g.addNodes([
        {
          id: 'a',
          data: { width: 50 },
        },
        {
          id: 'b',
          data: { width: 50 },
        },
        {
          id: 'c',
          data: { width: 200 },
        },
      ]);

      let xss = {
        ul: { a: 0, b: 100, c: 75 },
        ur: { a: 0, b: 100, c: 80 },
        dl: { a: 0, b: 100, c: 85 },
        dr: { a: 0, b: 100, c: 90 },
      };

      expect(findSmallestWidthAlignment(g, xss)).toEqual(xss.ul);
    });
  });

  describe('balance', function () {
    test('aligns a single node to the shared (ul + ur) / 2', function () {
      let xss = {
        ul: { a: 0 },
        ur: { a: 100 },
        dl: { a: 100 },
        dr: { a: 200 },
      };

      expect(balance(xss)).toEqual({ a: 50 });
    });

    test('aligns a single node to the average of (ur + ul) / 2', function () {
      let xss = {
        ul: { a: 0 },
        ur: { a: 75 },
        dl: { a: 125 },
        dr: { a: 200 },
      };

      expect(balance(xss)).toEqual({ a: 37.5 });
    });

    test('balances multiple nodes', function () {
      let xss = {
        ul: { a: 0, b: 50 },
        ur: { a: 75, b: 0 },
        dl: { a: 125, b: 60 },
        dr: { a: 200, b: 75 },
      };

      expect(balance(xss)).toEqual({ a: 37.5, b: 25 });
    });
  });

  describe('positionX', function () {
    test('positions a single node at origin', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
      ]);
      expect(positionX(g)).toEqual({ a: 0 });
    });

    test('positions a single node block at origin', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 100 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 0, width: 100 },
        },
      ]);

      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        },
      ]);

      expect(positionX(g)).toEqual({ a: 0, b: 0 });
    });

    test('positions a single node block at origin even when their sizes differ', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 40 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 0, width: 500 },
        },
        {
          id: 'c',
          data: { rank: 2, order: 0, width: 20 },
        },
      ]);

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
      ]);

      expect(positionX(g)).toEqual({ a: 0, b: 0, c: 0 });
    });

    test('centers a node if it is a predecessor of two same sized nodes', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 20 },
        },
        {
          id: 'b',
          data: { rank: 1, order: 0, width: 50 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 1, width: 50 },
        },
      ]);

      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        },
        {
          id: 'e2',
          source: 'a',
          target: 'c',
          data: {},
        },
      ]);

      let pos = positionX(g, {
        nodesep: 10,
      });
      let a = pos.a;
      expect(pos).toEqual({ a: a, b: a - (25 + 5), c: a + (25 + 5) });
    });

    test('shifts blocks on both sides of aligned block', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 50 },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 60 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 70 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 80 },
        },
      ]);

      g.addEdges([
        {
          id: 'e1',
          source: 'b',
          target: 'c',
          data: {},
        },
      ]);

      let pos = positionX(g, { nodesep: 10 });
      let b = pos.b;
      let c = b;
      expect(pos).toEqual({
        a: b - 60 / 2 - 10 - 50 / 2,
        b: b,
        c: c,
        d: c + 70 / 2 + 10 + 80 / 2,
      });
    });

    test('aligns inner segments', function () {
      g.addNodes([
        {
          id: 'a',
          data: { rank: 0, order: 0, width: 50, dummy: true },
        },
        {
          id: 'b',
          data: { rank: 0, order: 1, width: 60 },
        },
        {
          id: 'c',
          data: { rank: 1, order: 0, width: 70 },
        },
        {
          id: 'd',
          data: { rank: 1, order: 1, width: 80, dummy: true },
        },
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'b',
          target: 'c',
          data: {
            weight: 1,
          },
        },
        {
          id: 'e2',
          source: 'a',
          target: 'd',
          data: {
            weight: 1,
          },
        },
      ]);

      let pos = positionX(g, {
        nodesep: 10,
      });
      let a = pos.a;
      let d = a;

      expect(pos).toEqual({
        a: a,
        b: a + 50 / 2 + 10 / 2 + 60 / 2,
        c: d - 70 / 2 - 10 / 2 - 80 / 2,
        d: d,
      });
    });
  });
});
