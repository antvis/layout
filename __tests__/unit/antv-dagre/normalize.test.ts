import { Edge, Graph, ID } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../packages/layout';
import { run, undo } from '../../../packages/layout/src/antv-dagre/normalize';

describe('normalize', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  describe('run', function () {
    test('does not change a short edge', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 1 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {},
      });

      run(g, []);

      expect(g.getAllEdges().map(incidentNodes)).toEqual([
        { source: 'a', target: 'b' },
      ]);
      expect(g.getNode('a').data.rank).toEqual(0);
      expect(g.getNode('b').data.rank).toEqual(1);
    });

    test('splits a two layer edge into two segments', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 2 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {},
      });

      const dummyChains: ID[] = [];
      run(g, dummyChains);

      expect(g.getSuccessors('a')).toHaveLength(1);
      let successor = g.getSuccessors('a')[0];
      expect(g.getNode(successor.id).data.dummy).toEqual('edge');
      expect(g.getNode(successor.id).data.rank).toEqual(1);
      expect(g.getSuccessors(successor.id).map((n) => n.id)).toEqual(['b']);
      expect(g.getNode('a').data.rank).toEqual(0);
      expect(g.getNode('b').data.rank).toEqual(2);

      expect(dummyChains).toHaveLength(1);
      expect(g.getNode(dummyChains[0])).toEqual(successor);
    });

    test('assigns width = 0, height = 0 to dummy nodes by default', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 2 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {
          width: 10,
          height: 10,
        },
      });

      const dummyChains: ID[] = [];
      run(g, dummyChains);

      expect(g.getSuccessors('a')).toHaveLength(1);
      let successor = g.getSuccessors('a')[0];
      expect(g.getNode(successor.id).data.width).toEqual(0);
      expect(g.getNode(successor.id).data.height).toEqual(0);
    });

    test('assigns width and height from the edge for the node on labelRank', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 4 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {
          width: 20,
          height: 10,
          labelRank: 2,
        },
      });

      const dummyChains: ID[] = [];
      run(g, dummyChains);

      let labelV = g.getSuccessors(g.getSuccessors('a')[0].id)[0];
      expect(labelV.data.width).toEqual(20);
      expect(labelV.data.height).toEqual(10);
    });

    test('preserves the weight for the edge', function () {
      g.addNode({
        id: 'a',
        data: { rank: 0 },
      });
      g.addNode({
        id: 'b',
        data: { rank: 2 },
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {
          weight: 2,
        },
      });

      const dummyChains: ID[] = [];
      run(g, dummyChains);

      expect(g.getSuccessors('a')).toHaveLength(1);
      expect(g.getRelatedEdges('a', 'out')[0].data.weight).toEqual(2);
    });

    describe('undo', function () {
      test('reverses the run operation', function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 2 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);
        undo(g, dummyChains);

        expect(g.getAllEdges().map(incidentNodes)).toEqual([
          { source: 'a', target: 'b' },
        ]);
        expect(g.getNode('a').data.rank).toEqual(0);
        expect(g.getNode('b').data.rank).toEqual(2);
      });

      test('restores previous edge labels', function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 2 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: { foo: 'bar' },
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);
        undo(g, dummyChains);

        expect(g.getEdge('e1').data.foo).toEqual('bar');
      });

      test("collects assigned coordinates into the 'points' attribute", function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 2 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);

        let dummyLabel = g.getNode(g.getNeighbors('a')[0].id);
        dummyLabel.data.x = 5;
        dummyLabel.data.y = 10;

        undo(g, dummyChains);

        expect(g.getEdge('e1').data.points).toEqual([{ x: 5, y: 10 }]);
      });

      test("merges assigned coordinates into the 'points' attribute", function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 4 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);

        let aSucLabel = g.getNode(g.getNeighbors('a')[0].id);
        aSucLabel.data.x = 5;
        aSucLabel.data.y = 10;

        let midLabel = g.getNode(
          g.getSuccessors(g.getSuccessors('a')[0].id)[0].id,
        );
        midLabel.data.x = 20;
        midLabel.data.y = 25;

        let bPredLabel = g.getNode(g.getNeighbors('b')[0].id);
        bPredLabel.data.x = 100;
        bPredLabel.data.y = 200;

        undo(g, dummyChains);

        expect(g.getEdge('e1').data.points).toEqual([
          { x: 5, y: 10 },
          { x: 20, y: 25 },
          { x: 100, y: 200 },
        ]);
      });

      test('sets coords and dims for the label, if the edge has one', function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 2 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {
            width: 10,
            height: 20,
            labelRank: 1,
          },
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);

        let labelNode = g.getNode(g.getSuccessors('a')[0].id);
        g.updateNodeData(labelNode.id, {
          ...labelNode.data,
          x: 50,
          y: 60,
          width: 20,
          height: 10,
        });
        // labelNode.data.x = 50;
        // labelNode.data.y = 60;
        // labelNode.data.width = 20;
        // labelNode.data.height = 10;

        undo(g, dummyChains);

        const { x, y, width, height } = g.getEdge('e1').data;

        expect({ x, y, width, height }).toEqual({
          x: 50,
          y: 60,
          width: 20,
          height: 10,
        });
      });

      test('sets coords and dims for the label, if the long edge has one', function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 4 },
        });
        g.addEdge({
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {
            width: 10,
            height: 20,
            labelRank: 2,
          },
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);

        let labelNode = g.getNode(
          g.getSuccessors(g.getSuccessors('a')[0].id)[0].id,
        );
        g.updateNodeData(labelNode.id, {
          ...labelNode.data,
          x: 50,
          y: 60,
          width: 20,
          height: 10,
        });

        undo(g, dummyChains);

        const { x, y, width, height } = g.getEdge('e1').data;

        expect({ x, y, width, height }).toEqual({
          x: 50,
          y: 60,
          width: 20,
          height: 10,
        });
      });

      test('restores multi-edges', function () {
        g.addNode({
          id: 'a',
          data: { rank: 0 },
        });
        g.addNode({
          id: 'b',
          data: { rank: 2 },
        });
        g.addEdge({
          id: 'bar',
          source: 'a',
          target: 'b',
          data: {},
        });
        g.addEdge({
          id: 'foo',
          source: 'a',
          target: 'b',
          data: {},
        });

        const dummyChains: ID[] = [];
        run(g, dummyChains);

        let outEdges = g
          .getRelatedEdges('a', 'out')
          // @ts-ignore
          .sort((a, b) => a.id - b.id);
        expect(outEdges).toHaveLength(2);

        let barDummy = g.getNode(outEdges[0].target);
        barDummy.data.x = 5;
        barDummy.data.y = 10;

        let fooDummy = g.getNode(outEdges[1].target);
        fooDummy.data.x = 15;
        fooDummy.data.y = 20;

        undo(g, dummyChains);

        expect(g.getEdge('bar').data.points).toEqual([{ x: 5, y: 10 }]);
        expect(g.getEdge('foo').data.points).toEqual([{ x: 15, y: 20 }]);
      });
    });
  });
});

function incidentNodes(edge: Edge<EdgeData>) {
  return { source: edge.source, target: edge.target };
}
