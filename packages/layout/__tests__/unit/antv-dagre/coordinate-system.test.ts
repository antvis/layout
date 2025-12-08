import { adjust, undo } from '@/src/antv-dagre/coordinate-system';
import { DagreGraph as Graph } from '@/src/antv-dagre/graph';

describe('coordinateSystem', function () {
  let g: Graph;

  beforeEach(function () {
    g = new Graph({ tree: [] });
  });

  describe('adjust', function () {
    beforeEach(function () {
      g.addNode({
        id: 'a',
        data: { width: 100, height: 200 },
      });
    });

    it('does nothing to node dimensions with rankdir = TB', function () {
      adjust(g, 'TB');
      expect(g.getNode('a').data).toEqual({ width: 100, height: 200 });
    });

    it('does nothing to node dimensions with rankdir = BT', function () {
      adjust(g, 'BT');
      expect(g.getNode('a').data).toEqual({ width: 100, height: 200 });
    });

    it('swaps width and height for nodes with rankdir = LR', function () {
      adjust(g, 'LR');
      expect(g.getNode('a').data).toEqual({ width: 200, height: 100 });
    });

    it('swaps width and height for nodes with rankdir = RL', function () {
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

    it('does nothing to points with rankdir = TB', function () {
      undo(g, 'TB');
      expect(g.getNode('a').data).toEqual({
        x: 20,
        y: 40,
        width: 100,
        height: 200,
      });
    });

    it('flips the y coordinate for points with rankdir = BT', function () {
      undo(g, 'BT');
      expect(g.getNode('a').data).toEqual({
        x: 20,
        y: -40,
        width: 100,
        height: 200,
      });
    });

    it('swaps dimensions and coordinates for points with rankdir = LR', function () {
      undo(g, 'LR');
      expect(g.getNode('a').data).toEqual({
        x: 40,
        y: 20,
        width: 200,
        height: 100,
      });
    });

    it('swaps dims and coords and flips x for points with rankdir = RL', function () {
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
