import { Graph as Graphlib, PlainObject } from '@antv/graphlib';
import Graphology from 'graphology';
import { clusters } from 'graphology-generators/random';
import { CANVAS_SIZE } from './constants';
import { TestName } from './types';

export const loadDatasets = async (dimensions = 2) => {
  const [
    randomClusters100,
    randomClusters1000,
    randomClusters2_1000,
    randomClusters2000,
    relations,
    netscience,
    eva,
    regions,
  ] = await Promise.all([
    loadRandomClusters(100, 100, dimensions),
    loadRandomClusters(1000, 1000, dimensions),
    loadRandomClusters(2000, 1000, dimensions),
    loadRandomClusters(2000, 2000, dimensions),
    loadG6JSON(
      'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json',
      'A small dataset of "relations" between people.',
    )(),
    loadG6JSON(
      'https://gw.alipayobjects.com/os/basement_prod/da5a1b47-37d6-44d7-8d10-f3e046dabf82.json',
      'Netscience with 1589 nodes & 2742 edges.',
    )(),
    loadG6JSON(
      'https://gw.alipayobjects.com/os/basement_prod/0b9730ff-0850-46ff-84d0-1d4afecd43e6.json',
      'Eva with 8322 nodes & 5421 edges.',
    )(),
    loadG6JSON(
      'https://gw.alipayobjects.com/os/basement_prod/7bacd7d1-4119-4ac1-8be3-4c4b9bcbc25f.json',
      'A dataset for regions on earth.',
    )(),
  ]);

  const datasets = {
    'random-clusters-100': randomClusters100,
    'random-clusters-1000': randomClusters1000,
    'random-clusters2-1000': randomClusters2_1000,
    'random-clusters-2000': randomClusters2000,
    relations,
    netscience,
    eva,
    regions,
  };
  return datasets;
};

export const loadRandomClusters = (
  NODES: number,
  EDGES: number,
  dimensions: number = 2,
) => {
  // Use graphology generator.
  const graph = clusters(Graphology, {
    order: NODES,
    size: EDGES,
    clusters: 5,
  });
  graph.edges().forEach(function (edge, i) {
    graph.setEdgeAttribute(edge, 'weight', 1);
  });
  graph.nodes().forEach(function (node) {
    graph.setNodeAttribute(node, 'x', Math.random() * CANVAS_SIZE);
    graph.setNodeAttribute(node, 'y', Math.random() * CANVAS_SIZE);
    graph.setNodeAttribute(node, 'width', 10);
    graph.setNodeAttribute(node, 'height', 10);

    if (dimensions === 3) {
      graph.setNodeAttribute(node, 'z', Math.random() * CANVAS_SIZE);
    }
  });

  return graphology2antv(graph, false);
};

const loadG6JSON = (url: string, desc: string) => {
  return async () => {
    const result = await fetch(url);
    const oldG6GraphFormat = await result.json();

    // format old G6 graph format to @antv/graphlib
    // assign random positions
    const nodes: any[] = [];
    const edges: any[] = [];
    const uniqueNodes = new Set();
    oldG6GraphFormat.nodes.forEach((node: any, i: number) => {
      // remove duplicated nodes
      if (!uniqueNodes.has(node.id)) {
        uniqueNodes.add(node.id);

        // clear
        node.x = undefined;
        node.y = undefined;
        node.z = undefined;

        nodes.push({
          id: node.id,
          data: { x: node.x, y: node.y, z: node.z },
        });
      }
    });
    oldG6GraphFormat.edges.forEach((edge: any, i: number) => {
      if (edge.id === undefined) {
        edge.id = `e${i}`;
      }
      if (edge.weight === undefined || edge.weight === null) {
        edge.weight = 1;
      } else {
        edge.weight = Number(edge.weight);
      }

      edges.push({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        data: { weight: edge.weight },
      });
    });
    const puregraph = {
      nodes,
      edges,
    };
    const antvgraph = new Graphlib(puregraph);

    const graph = antv2graphology(antvgraph);

    return {
      desc,
      [TestName.GRAPHOLOGY]: graph,
      [TestName.ANTV_LAYOUT]: puregraph,
      [TestName.ANTV_LAYOUT_NPM]: antvgraph,
      // [TestName.ANTV_LAYOUT_GPU]: antvgraph,
      // [TestName.ANTV_LAYOUT_WASM_SINGLETHREAD]: antvgraph,
      // [TestName.ANTV_LAYOUT_WASM_MULTITHREADS]: antvgraph,
    };
  };
};

function graphology2antv(
  graph: Graphology,
  useLib: boolean,
): Graphlib<PlainObject, PlainObject> | PlainObject {
  const data = {
    nodes: graph.nodes().map((id: any) => ({
      id,
      data: {
        x: graph.getNodeAttribute(id, 'x'),
        y: graph.getNodeAttribute(id, 'y'),
        z: graph.getNodeAttribute(id, 'z'),
      },
    })),
    edges: graph.edges().map((id: any) => ({
      id,
      source: graph.source(id),
      target: graph.target(id),
      data: {
        weight: graph.getEdgeAttribute(id, 'weight'),
      },
    })),
  };
  if (!useLib) return data;
  return new Graphlib(data);
}

const antv2graphology = (
  graph: Graphlib<PlainObject, PlainObject>,
): Graphology => {
  const g = new Graphology();
  graph.getAllNodes().forEach(({ id, data: { x, y, z } }: any) => {
    if (!g.hasNode(id)) {
      g.addNode(id, { x, y, z });
    }
  });
  graph.getAllEdges().forEach(({ source, target, data: { weight } }: any) => {
    g.addEdge(source, target, { weight });
  });
  return g;
};
