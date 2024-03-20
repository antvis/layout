import { Graph } from '@antv/graphlib';
import {
  EdgeData,
  Graph as IGraph,
  NodeData,
} from '../../../../packages/layout';
import { buildLayerGraph } from '../../../../packages/layout/src/dagre/order/build-layer-graph';

describe('order/buildLayerGraph', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  test('places movable nodes with no parents under the root node', function () {
    g.addNode({
      id: 'a',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'c',
      data: { rank: 2 },
    });
    g.addNode({
      id: 'd',
      data: { rank: 3 },
    });

    let lg: IGraph;
    lg = buildLayerGraph(g, 1, 'in');

    const root = lg.getRoots()[0].id;
    expect(lg.hasNode(root));
    expect(lg.getChildren(root)).toEqual([
      {
        id: 'a',
        data: { rank: 1 },
      },
      {
        id: 'b',
        data: { rank: 1 },
      },
    ]);
  });

  test('copies flat nodes from the layer to the graph', function () {
    g.addNode({
      id: 'a',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'c',
      data: { rank: 2 },
    });
    g.addNode({
      id: 'd',
      data: { rank: 3 },
    });

    expect(
      buildLayerGraph(g, 1, 'in')
        .getAllNodes()
        .map((n) => n.id),
    ).toContain('a');
    expect(
      buildLayerGraph(g, 1, 'in')
        .getAllNodes()
        .map((n) => n.id),
    ).toContain('b');
    expect(
      buildLayerGraph(g, 2, 'in')
        .getAllNodes()
        .map((n) => n.id),
    ).toContain('c');
    expect(
      buildLayerGraph(g, 3, 'in')
        .getAllNodes()
        .map((n) => n.id),
    ).toContain('d');
  });

  test('uses the original node label for copied nodes', function () {
    // This allows us to make updates to the original graph and have them
    // be available automatically in the layer graph.
    g.addNode({
      id: 'a',
      data: { foo: 1, rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { foo: 2, rank: 2 },
    });

    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: { weight: 1 },
    });

    let lg = buildLayerGraph(g, 2, 'in');
    expect((lg.getNode('b').data as any).foo).toEqual(2);
  });

  test('copies edges incident on rank nodes to the graph (inEdges)', function () {
    g.addNode({
      id: 'a',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'c',
      data: { rank: 2 },
    });
    g.addNode({
      id: 'd',
      data: { rank: 3 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'c',
      data: { weight: 2 },
    });
    g.addEdge({
      id: 'e2',
      source: 'b',
      target: 'c',
      data: { weight: 3 },
    });
    g.addEdge({
      id: 'e3',
      source: 'c',
      target: 'd',
      data: { weight: 4 },
    });

    expect(buildLayerGraph(g, 1, 'in').getAllEdges().length).toEqual(0);
    expect(buildLayerGraph(g, 2, 'in').getAllEdges().length).toEqual(2);
    expect(
      buildLayerGraph(g, 2, 'in')
        .getAllEdges()
        .find((e) => e.source === 'a' && e.target === 'c')?.data,
    ).toEqual({
      weight: 2,
    });
    expect(
      buildLayerGraph(g, 2, 'in')
        .getAllEdges()
        .find((e) => e.source === 'b' && e.target === 'c')?.data,
    ).toEqual({
      weight: 3,
    });
    expect(buildLayerGraph(g, 3, 'in').getAllEdges().length).toEqual(1);
    expect(
      buildLayerGraph(g, 3, 'in')
        .getAllEdges()
        .find((e) => e.source === 'c' && e.target === 'd')?.data,
    ).toEqual({
      weight: 4,
    });
  });

  test('copies edges incident on rank nodes to the graph (outEdges)', function () {
    g.addNode({
      id: 'a',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'c',
      data: { rank: 2 },
    });
    g.addNode({
      id: 'd',
      data: { rank: 3 },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'c',
      data: { weight: 2 },
    });
    g.addEdge({
      id: 'e2',
      source: 'b',
      target: 'c',
      data: { weight: 3 },
    });
    g.addEdge({
      id: 'e3',
      source: 'c',
      target: 'd',
      data: { weight: 4 },
    });

    expect(buildLayerGraph(g, 1, 'out').getAllEdges().length).toEqual(2);
    expect(
      buildLayerGraph(g, 1, 'out')
        .getAllEdges()
        .find((e) => e.source === 'c' && e.target === 'a')?.data,
    ).toEqual({
      weight: 2,
    });
    expect(
      buildLayerGraph(g, 1, 'out')
        .getAllEdges()
        .find((e) => e.source === 'c' && e.target === 'b')?.data,
    ).toEqual({
      weight: 3,
    });
    expect(buildLayerGraph(g, 2, 'out').getAllEdges().length).toEqual(1);
    expect(
      buildLayerGraph(g, 2, 'out')
        .getAllEdges()
        .find((e) => e.source === 'd' && e.target === 'c')?.data,
    ).toEqual({
      weight: 4,
    });
    expect(buildLayerGraph(g, 3, 'out').getAllEdges().length).toEqual(0);
  });

  test('collapses multi-edges', function () {
    g.addNode({
      id: 'a',
      data: { rank: 1 },
    });
    g.addNode({
      id: 'b',
      data: { rank: 2 },
    });

    g.addEdge({
      id: 'e2',
      source: 'a',
      target: 'b',
      data: { weight: 2 },
    });
    g.addEdge({
      id: 'e3',
      source: 'a',
      target: 'b',
      data: { weight: 3 },
    });

    // g.setEdge("a", "b", { weight: 2 });
    // g.setEdge("a", "b", { weight: 3 }, "multi");
    expect(
      buildLayerGraph(g, 2, 'in')
        .getAllEdges()
        .find((e) => e.source === 'a' && e.target === 'b')?.data,
    ).toEqual({
      weight: 5,
    });
  });

  test('preserves hierarchy for the movable layer', function () {
    g.addNode({
      id: 'c',
      data: { rank: 0 },
    });

    g.addTree({
      id: 'sg',
      data: {
        minRank: 0,
        maxRank: 0,
        borderLeft: ['bl'],
        borderRight: ['br'],
      },
      children: [
        {
          id: 'a',
          data: { rank: 0 },
        },
        {
          id: 'b',
          data: { rank: 0 },
        },
      ],
    });

    let lg = buildLayerGraph(g, 0, 'in');
    let root = lg.getRoots()[0].id;
    expect(lg.getChildren(root).map((n) => n.id)).toEqual(['c', 'sg']);
    expect(lg.getParent('a')?.id).toEqual('sg');
    expect(lg.getParent('b')?.id).toEqual('sg');
  });
});
