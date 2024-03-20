import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../packages/layout';
import {
  adjust,
  undo,
} from '../../../packages/layout/src/antv-dagre/coordinate-system';

describe('coordinateSystem', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  describe('adjust', function () {
    beforeEach(function () {
      g.addNode({
        id: 'a',
        data: { width: 100, height: 200 },
      });
    });

    test('does nothing to node dimensions with rankdir = TB', function () {
      adjust(g, 'TB');
      expect(g.getNode('a').data).toEqual({ width: 100, height: 200 });
    });

    test('does nothing to node dimensions with rankdir = BT', function () {
      adjust(g, 'BT');
      expect(g.getNode('a').data).toEqual({ width: 100, height: 200 });
    });

    test('swaps width and height for nodes with rankdir = LR', function () {
      adjust(g, 'LR');
      expect(g.getNode('a').data).toEqual({ width: 200, height: 100 });
    });

    test('swaps width and height for nodes with rankdir = RL', function () {
      adjust(g, 'RL');
      expect(g.getNode('a').data).toEqual({ width: 200, height: 100 });
    });
  });

  describe('undo', function () {
    beforeEach(function () {
      g.addNode({
        id: 'a',
        data: { width: 100, height: 200, x: 20, y: 40 },
      });
    });

    test('does nothing to points with rankdir = TB', function () {
      undo(g, 'TB');
      expect(g.getNode('a').data).toEqual({
        x: 20,
        y: 40,
        width: 100,
        height: 200,
      });
    });

    test('flips the y coordinate for points with rankdir = BT', function () {
      undo(g, 'BT');
      expect(g.getNode('a').data).toEqual({
        x: 20,
        y: -40,
        width: 100,
        height: 200,
      });
    });

    test('swaps dimensions and coordinates for points with rankdir = LR', function () {
      undo(g, 'LR');
      expect(g.getNode('a').data).toEqual({
        x: 40,
        y: 20,
        width: 200,
        height: 100,
      });
    });

    test('swaps dims and coords and flips x for points with rankdir = RL', function () {
      undo(g, 'RL');
      expect(g.getNode('a').data).toEqual({
        x: -40,
        y: 20,
        width: 200,
        height: 100,
      });
    });
  });
});
