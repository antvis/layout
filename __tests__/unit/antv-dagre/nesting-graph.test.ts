import { Graph, ID } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../packages/layout';
import { cleanup, run } from '../../../packages/layout/src/antv-dagre/nesting-graph';
import { components } from '../../util';

describe('rank/nestingGraph', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  describe('run', function () {
    test('connects a disconnected graph', function () {
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
      expect(components(g)).toHaveLength(2);
      run(g);
      expect(components(g)).toHaveLength(1);
      expect(g.hasNode('a'));
      expect(g.hasNode('b'));
    });

    test('adds border nodes to the top and bottom of a subgraph', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
      ]);
      g.setParent('a', 'sg1');
      run(g);

      const node = g.getNode('sg1');
      let borderTop = g.getNode('sg1').data.borderTop as ID;
      let borderBottom = g.getNode('sg1').data.borderBottom as ID;
      expect(node.data).toHaveProperty('borderTop');
      expect(node.data).toHaveProperty('borderBottom');
      expect(g.getParent(borderTop)?.id).toEqual('sg1');
      expect(g.getParent(borderBottom)?.id).toEqual('sg1');
      expect(
        g.getRelatedEdges(borderTop, 'out').filter((e) => e.target === 'a'),
      ).toHaveLength(1);
      expect(
        g.getRelatedEdges(borderTop, 'out').filter((e) => e.target === 'a')[0]
          .data.minlen,
      ).toEqual(1);
      expect(
        g.getRelatedEdges('a', 'out').filter((e) => e.target === borderBottom),
      ).toHaveLength(1);
      expect(
        g
          .getRelatedEdges('a', 'out')
          .filter((e) => e.target === borderBottom)[0].data.minlen,
      ).toEqual(1);
      expect(g.getNode(borderTop).data).toEqual({
        width: 0,
        height: 0,
        dummy: 'border',
      });
      expect(g.getNode(borderBottom).data).toEqual({
        width: 0,
        height: 0,
        dummy: 'border',
      });
    });

    test('adds edges between borders of nested subgraphs', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'sg2',
          data: {},
        },
      ]);

      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      run(g);

      let sg1Top = g.getNode('sg1').data.borderTop as ID;
      let sg1Bottom = g.getNode('sg1').data.borderBottom as ID;
      let sg2Top = g.getNode('sg2').data.borderTop as ID;
      let sg2Bottom = g.getNode('sg2').data.borderBottom as ID;
      expect(sg1Top).not.toBeUndefined();
      expect(sg1Bottom).not.toBeUndefined();
      expect(sg2Top).not.toBeUndefined();
      expect(sg2Bottom).not.toBeUndefined();

      // expect(g.outEdges(sg1Top, sg2Top)).toHaveLength(1);
      // expect(g.edge(g.outEdges(sg1Top, sg2Top)[0]).minlen).toEqual(1);
      // expect(g.outEdges(sg2Bottom, sg1Bottom)).toHaveLength(1);
      // expect(g.edge(g.outEdges(sg2Bottom, sg1Bottom)[0]).minlen).toEqual(1);

      expect(
        g.getRelatedEdges(sg1Top, 'out').filter((e) => e.target === sg2Top),
      ).toHaveLength(1);

      expect(
        g.getRelatedEdges(sg1Top, 'out').filter((e) => e.target === sg2Top)[0]
          .data.minlen,
      ).toEqual(1);
      expect(
        g
          .getRelatedEdges(sg2Bottom, 'out')
          .filter((e) => e.target === sg1Bottom),
      ).toHaveLength(1);
      expect(
        g
          .getRelatedEdges(sg2Bottom, 'out')
          .filter((e) => e.target === sg1Bottom)[0].data.minlen,
      ).toEqual(1);
    });

    test('adds sufficient weight to border to node edges', function () {
      g.addNodes([
        {
          id: 'x',
          data: {},
        },
        {
          id: 'sg',
          data: {},
        },
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
      ]);

      // We want to keep subgraphs tight, so we should ensure that the weight for
      // the edge between the top (and bottom) border nodes and nodes in the
      // subgraph have weights exceeding anything in the graph.
      g.setParent('x', 'sg');
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'x',
        data: { weight: 100 },
      });
      g.addEdge({
        id: 'e2',
        source: 'x',
        target: 'b',
        data: { weight: 200 },
      });
      run(g);

      let top = g.getNode('sg').data.borderTop as ID;
      let bot = g.getNode('sg').data.borderBottom as ID;
      expect(
        g.getRelatedEdges(top, 'out').find((e) => e.target === 'x')!.data
          .weight,
      ).toBeGreaterThan(300);
      expect(
        g.getRelatedEdges('x', 'out').find((e) => e.target === bot)!.data
          .weight,
      ).toBeGreaterThan(300);
    });

    test('adds an edge from the root to the tops of top-level subgraphs', function () {
      g.addNodes([
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'a',
          data: {},
        },
      ]);

      g.setParent('a', 'sg1');
      const { nestingRoot: root } = run(g);
      let borderTop = g.getNode('sg1').data.borderTop as ID;
      expect(root).not.toBeUndefined();
      expect(borderTop).not.toBeUndefined();
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === borderTop),
      ).toHaveLength(1);
      const edge = g
        .getRelatedEdges(root, 'out')
        .filter((e) => e.target === borderTop)[0];
      expect(edge).toBeTruthy();
    });

    test('adds an edge from root to each node with the correct minlen #1', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
      ]);
      const { nestingRoot: root } = run(g);

      expect(root).not.toBeUndefined();
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a'),
      ).toHaveLength(1);
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a')[0].data,
      ).toEqual({
        weight: 0,
        minlen: 1,
      });
    });

    test('adds an edge from root to each node with the correct minlen #2', function () {
      g.addNodes([
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'a',
          data: {},
        },
      ]);
      g.setParent('a', 'sg1');
      const { nestingRoot: root } = run(g);

      expect(root).not.toBeUndefined();

      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a'),
      ).toHaveLength(1);
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a')[0].data,
      ).toEqual({
        weight: 0,
        minlen: 3,
      });
    });

    test('adds an edge from root to each node with the correct minlen #3', function () {
      g.addNodes([
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'sg2',
          data: {},
        },
        {
          id: 'a',
          data: {},
        },
      ]);

      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      const { nestingRoot: root } = run(g);

      expect(root).not.toBeUndefined();
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a'),
      ).toHaveLength(1);
      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === 'a')[0].data,
      ).toEqual({
        weight: 0,
        minlen: 5,
      });
    });

    test('does not add an edge from the root to itself', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
      ]);

      const { nestingRoot: root } = run(g);

      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === root),
      ).toHaveLength(0);
    });

    test('expands inter-node edges to separate SG border and nodes #1', function () {
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
        id: 'e1',
        source: 'a',
        target: 'b',
        data: { minlen: 1 },
      });
      run(g);
      expect(
        g.getRelatedEdges('a', 'out').filter((e) => e.target === 'b')[0].data
          .minlen,
      ).toEqual(1);
    });

    test('expands inter-node edges to separate SG border and nodes #2', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
      ]);
      g.setParent('a', 'sg1');
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: { minlen: 1 },
      });
      run(g);
      expect(
        g.getRelatedEdges('a', 'out').filter((e) => e.target === 'b')[0].data
          .minlen,
      ).toEqual(3);
    });

    test('expands inter-node edges to separate SG border and nodes #3', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'sg2',
          data: {},
        },
      ]);

      g.setParent('sg2', 'sg1');
      g.setParent('a', 'sg2');
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: { minlen: 1 },
      });

      run(g);
      expect(
        g.getRelatedEdges('a', 'out').filter((e) => e.target === 'b')[0].data
          .minlen,
      ).toEqual(5);
    });

    test('sets minlen correctly for nested SG boder to children', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
        {
          id: 'sg2',
          data: {},
        },
      ]);

      g.setParent('a', 'sg1');
      g.setParent('sg2', 'sg1');
      g.setParent('b', 'sg2');
      const { nestingRoot: root } = run(g);

      // We expect the following layering:
      //
      // 0: root
      // 1: empty (close sg2)
      // 2: empty (close sg1)
      // 3: open sg1
      // 4: open sg2
      // 5: a, b
      // 6: close sg2
      // 7: close sg1

      let sg1Top = g.getNode('sg1').data.borderTop as ID;
      let sg1Bot = g.getNode('sg1').data.borderBottom as ID;
      let sg2Top = g.getNode('sg2').data.borderTop as ID;
      let sg2Bot = g.getNode('sg2').data.borderBottom as ID;

      expect(
        g.getRelatedEdges(root, 'out').filter((e) => e.target === sg1Top)[0]
          .data.minlen,
      ).toEqual(3);
      expect(
        g.getRelatedEdges(sg1Top, 'out').filter((e) => e.target === sg2Top)[0]
          .data.minlen,
      ).toEqual(1);
      expect(
        g.getRelatedEdges(sg1Top, 'out').filter((e) => e.target === 'a')[0].data
          .minlen,
      ).toEqual(2);
      expect(
        g.getRelatedEdges('a', 'out').filter((e) => e.target === sg1Bot)[0].data
          .minlen,
      ).toEqual(2);
      expect(
        g.getRelatedEdges(sg2Top, 'out').filter((e) => e.target === 'b')[0].data
          .minlen,
      ).toEqual(1);
      expect(
        g.getRelatedEdges('b', 'out').filter((e) => e.target === sg2Bot)[0].data
          .minlen,
      ).toEqual(1);
      expect(
        g.getRelatedEdges(sg2Bot, 'out').filter((e) => e.target === sg1Bot)[0]
          .data.minlen,
      ).toEqual(1);
      // expect(g.edgeFromArgs(root, sg1Top).minlen).toEqual(3);
      // expect(g.edgeFromArgs(sg1Top, sg2Top).minlen).toEqual(1);
      // expect(g.edgeFromArgs(sg1Top, "a").minlen).toEqual(2);
      // expect(g.edgeFromArgs("a", sg1Bot).minlen).toEqual(2);
      // expect(g.edgeFromArgs(sg2Top, "b").minlen).toEqual(1);
      // expect(g.edgeFromArgs("b", sg2Bot).minlen).toEqual(1);
      // expect(g.edgeFromArgs(sg2Bot, sg1Bot).minlen).toEqual(1);
    });
  });

  describe('cleanup', function () {
    test('removes nesting graph edges', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
      ]);

      g.setParent('a', 'sg1');
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: { minlen: 1 },
      });
      run(g);
      cleanup(g);
      expect(g.getSuccessors('a').map((n) => n.id)).toEqual(['b']);
    });

    test('removes the root node', function () {
      g.addNodes([
        {
          id: 'a',
          data: {},
        },
        {
          id: 'sg1',
          data: {},
        },
      ]);

      g.setParent('a', 'sg1');
      const { nestingRoot } = run(g);
      cleanup(g, nestingRoot);
      expect(g.getAllNodes().length).toEqual(4); // sg1 + sg1Top + sg1Bottom + "a"
    });
  });
});
