import { FruchtermanLayout } from '@/src';
import { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { NodeData } from '../../src/types';
import { fruchterman as fruchtermanData } from '../dataset';
import { createCanvas, getEuclideanDistance } from '../utils';
import { preprocessGraphData } from '../utils/preprocess';
import { GraphRenderer } from '../utils/renderer';

describe('FruchtermanLayout', () => {
  let canvas: Canvas;
  let renderer: GraphRenderer;
  let fruchterman: FruchtermanLayout;
  let data: any;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas();
    renderer = new GraphRenderer(canvas);
    fruchterman = new FruchtermanLayout();
    data = preprocessGraphData(fruchtermanData, renderer.getCanvasSize());
  });

  afterEach(() => {
    clearMockRandom();
    if (fruchterman) {
      fruchterman.stop();
    }
    canvas.destroy();
  });

  it('should return correct default config.', async () => {
    const layout = new FruchtermanLayout();
    expect(layout.options).toEqual({
      maxIteration: 1000,
      gravity: 10,
      speed: 5,
      clustering: false,
      clusterGravity: 10,
      width: 300,
      height: 300,
      nodeClusterBy: 'data.cluster',
      dimensions: 2,
      animate: true,
    });
  });

  it('should render with default options', async () => {
    const positions = await fruchterman.execute(data, {
      center: [250, 250],
      width: 500,
      height: 500,
    });
    renderer.render(positions, { showLabel: true, nodeRadius: 10 });
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom gravity', async () => {
    const positions = await fruchterman.execute(data, {
      center: [250, 250],
      width: 500,
      height: 500,
      gravity: 10,
    });
    renderer.render(positions, { showLabel: true, nodeRadius: 10 });
    await expect(canvas).toMatchSnapshot(__filename, 'custom-gravity');
  });

  it('should render with custom speed', async () => {
    const positions = await fruchterman.execute(data, {
      center: [250, 250],
      width: 500,
      height: 500,
      speed: 10,
    });
    renderer.render(positions, { showLabel: true, nodeRadius: 10 });
    await expect(canvas).toMatchSnapshot(__filename, 'custom-speed');
  });

  it('should render with clustering enabled', async () => {
    const positions = await fruchterman.execute(data, {
      center: [250, 250],
      width: 500,
      height: 500,
      clustering: true,
      nodeClusterBy: (node: any) => node.cluster,
    });
    renderer.render(positions, { showLabel: true, nodeRadius: 10 });
    await expect(canvas).toMatchSnapshot(__filename, 'clustering-enabled');
  });

  it('should do fruchterman layout with an empty graph.', async () => {
    const fruchterman = new FruchtermanLayout();
    await fruchterman.execute({
      nodes: [],
      edges: [],
    });
    fruchterman.stop();
    const positions = fruchterman.tick(1000);
    expect(JSON.stringify(positions.nodes)).toBe('[]');
  });

  it('should assign position for single node in assign mode (assign branch)', async () => {
    const fruchterman = new FruchtermanLayout({
      center: [10, 20, 30],
      dimensions: 3,
    });
    const data = {
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    };
    await fruchterman.assign(data);
    const node = data.nodes[0] as NodeData;
    expect(node.data.x).toBe(10);
    expect(node.data.y).toBe(20);
    expect(node.data.z).toBe(30);
  });

  it('should update z in gravity and move for 3D (dimensions === 3 branches)', () => {
    const graph = {
      nodes: [
        { id: 'n1', data: { x: 1, y: 2, z: 3 } },
        { id: 'n2', data: { x: 4, y: 5, z: 6 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
    };
    const fruchterman = new FruchtermanLayout({
      dimensions: 3,
      center: [0, 0, 0],
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const before = graph.nodes.find((n) => n.id === 'n1')?.data.z;
    const positions = fruchterman.tick(1);
    // z 轴有变化
    expect(positions.nodes[0].data.z).not.toBe(before);
  });

  it('should keep z fixed if fx/fy/fz is set (move branch for 3D)', () => {
    const graph = {
      nodes: [
        { id: 'n1', data: { x: 1, y: 2, z: 3, fx: 1, fy: 2, fz: 3 } },
        { id: 'n2', data: { x: 4, y: 5, z: 6 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
    };
    const fruchterman = new FruchtermanLayout({
      dimensions: 3,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1);
    expect(positions.nodes[0].data.z).toBe(3);
  });

  it('should skip repulsive/attractive if node positions are not numbers (repulsive/attractive skip branches)', () => {
    // repulsive skip
    const graph = {
      nodes: [
        { id: 'n1', data: { x: undefined, y: 2 } },
        { id: 'n2', data: { x: 4, y: undefined } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    // should not throw
    expect(() => fruchterman.tick(1)).not.toThrow();
  });

  it('should update z in attractive for 3D (attractive z branch)', () => {
    const graph = {
      nodes: [
        { id: 'n1', data: { x: 1, y: 2, z: 3 } },
        { id: 'n2', data: { x: 4, y: 5, z: 6 } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2', data: {} }],
    };
    const fruchterman = new FruchtermanLayout({
      dimensions: 3,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const before = fruchterman.tick(0);
    const before1 = before.nodes[0].data.z;
    const before2 = before.nodes[1].data.z;
    const after = fruchterman.tick(1);
    const after1 = after.nodes[0].data.z;
    const after2 = after.nodes[1].data.z;
    expect(after1).not.toBe(before1);
    expect(after2).not.toBe(before2);
  });

  it('should do fruchterman layout with clustering and nodeClusterBy.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { clusterField: 'a' } },
        { id: 'node1', data: { clusterField: 'c' } },
        { id: 'node2', data: { clusterField: 'b' } },
        { id: 'node3', data: { clusterField: 'a' } },
        { id: 'node4', data: { clusterField: 'c' } },
        { id: 'node5', data: { clusterField: 'b' } },
      ],
      edges: [],
    };
    const fruchterman = new FruchtermanLayout({
      clustering: true,
      nodeClusterBy: (node) => node.data.clusterField,
      clusterGravity: 50,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(2000);

    const aClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[3],
    );
    const bClusterDist = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[5],
    );
    const cClusterDist = getEuclideanDistance(
      positions.nodes[1],
      positions.nodes[4],
    );
    const abClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[2],
    );
    const acClusterDist = getEuclideanDistance(
      positions.nodes[0],
      positions.nodes[1],
    );
    const bcClusterDist = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[1],
    );
    // distances intra a cluster are smaller than distances inter clusters
    expect(aClusterDist < abClusterDist).toBe(true);
    expect(aClusterDist < bcClusterDist).toBe(true);
    expect(aClusterDist < acClusterDist).toBe(true);
    expect(bClusterDist < abClusterDist).toBe(true);
    expect(bClusterDist < bcClusterDist).toBe(true);
    expect(bClusterDist < acClusterDist).toBe(true);
    expect(cClusterDist < abClusterDist).toBe(true);
    expect(cClusterDist < bcClusterDist).toBe(true);
    expect(cClusterDist < acClusterDist).toBe(true);
  });

  it('should do fruchterman layout with onTick.', async () => {
    let tick = 0;
    const onTick = ({ nodes, edges }: any) => {
      expect(nodes.length).toBe(data.nodes.length);
      expect(nodes[0].data.x).not.toBe(undefined);
      expect(nodes[0].data.y).not.toBe(undefined);
      tick++;
    };

    const fruchterman = new FruchtermanLayout({
      maxIteration: 10,
      onTick,
    });
    const { nodes } = await fruchterman.execute(data);
    expect(nodes.length).toBe(data.nodes.length);
    expect(nodes[0].data.x).not.toBe(undefined);
    expect(nodes[0].data.y).not.toBe(undefined);
    expect(tick).toBe(10);
  });

  it('should do fruchterman layout with overlapped nodes and loop edge.', () => {
    const graph = {
      nodes: [
        {
          id: 'node0',
          data: { x: 100, y: 100 },
        },
        {
          id: 'node1',
          data: { x: 100, y: 100 },
        },
        {
          id: 'node2',
          data: { x: 150, y: 120 },
        },
      ],
      edges: [
        { id: 'edge0', source: 'node2', target: 'node2', data: {} },
        { id: 'edge1', source: 'node1', target: 'node1', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);
    expect(positions.nodes[0].data.x).not.toEqual(positions.nodes[1].data.x);
    expect(positions.nodes[0].data.y).not.toEqual(positions.nodes[1].data.y);
  });

  it('should do fruchterman layout with different gravities.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { x: 10, y: 10 } },
        { id: 'node1', data: { x: 100, y: 10 } },
        { id: 'node2', data: { x: 10, y: 100 } },
      ],
      edges: [],
    };
    const fruchterman1 = new FruchtermanLayout({
      gravity: 1,
      center: [10, 20],
    });
    fruchterman1.execute(graph);
    fruchterman1.stop();
    const positions1 = fruchterman1.tick(1000);

    const fruchterman2 = new FruchtermanLayout({
      gravity: 10,
      center: [10, 20],
    });
    fruchterman2.execute(graph);
    fruchterman2.stop();
    const positions2 = fruchterman2.tick(1000);

    const virtualCenterNode = { data: { x: 10, y: 20 } };
    const layout1DistToCenter1 = getEuclideanDistance(
      positions1.nodes[0],
      virtualCenterNode,
    );
    const layout1DistToCenter2 = getEuclideanDistance(
      positions1.nodes[1],
      virtualCenterNode,
    );
    const layout1DistToCenter3 = getEuclideanDistance(
      positions1.nodes[2],
      virtualCenterNode,
    );

    const layout2DistToCenter1 = getEuclideanDistance(
      positions2.nodes[0],
      virtualCenterNode,
    );
    const layout2DistToCenter2 = getEuclideanDistance(
      positions2.nodes[1],
      virtualCenterNode,
    );
    const layout2DistToCenter3 = getEuclideanDistance(
      positions2.nodes[2],
      virtualCenterNode,
    );

    expect(layout1DistToCenter1 > layout2DistToCenter1).toBe(true);
    expect(layout1DistToCenter2 > layout2DistToCenter2).toBe(true);
    expect(layout1DistToCenter3 > layout2DistToCenter3).toBe(true);
  });

  it('should do fruchterman layout with different speeds.', () => {
    const graph1 = {
      nodes: [
        { id: 'node0', data: { x: 10, y: 10 } },
        { id: 'node1', data: { x: 100, y: 10 } },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const fruchterman1 = new FruchtermanLayout({
      speed: 1,
      maxIteration: 10,
    });
    fruchterman1.execute(graph1);
    fruchterman1.stop();
    const positions1 = fruchterman1.tick(10);

    const graph2 = {
      nodes: [
        { id: 'node0', data: { x: 10, y: 10 } },
        { id: 'node1', data: { x: 100, y: 10 } },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const fruchterman2 = new FruchtermanLayout({
      speed: 10,
      maxIteration: 10,
    });
    fruchterman2.execute(graph2);
    fruchterman2.stop();
    const positions2 = fruchterman2.tick(10);

    // higher speed leads to more movement per iteration
    const dist1 = Math.abs(
      positions1.nodes[0].data.x - positions1.nodes[1].data.x,
    );
    const dist2 = Math.abs(
      positions2.nodes[0].data.x - positions2.nodes[1].data.x,
    );
    // With higher speed, nodes should move more (smaller distance after attraction)
    expect(dist2).toBeLessThan(dist1);
  });

  it('should do fruchterman layout with custom center.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { x: 10, y: 10 } },
        { id: 'node1', data: { x: 100, y: 100 } },
      ],
      edges: [],
    };
    const fruchterman = new FruchtermanLayout({
      center: [200, 200],
      gravity: 50,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    // nodes should be pulled towards [200, 200]
    const avgX = (positions.nodes[0].data.x + positions.nodes[1].data.x) / 2;
    const avgY = (positions.nodes[0].data.y + positions.nodes[1].data.y) / 2;
    expect(Math.abs(avgX - 200)).toBeLessThan(50);
    expect(Math.abs(avgY - 200)).toBeLessThan(50);
  });

  it('should do fruchterman layout with fixed positions (fx, fy).', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { x: 10, y: 10, fx: 10, fy: 10 } },
        { id: 'node1', data: { x: 100, y: 100 } },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    // node0 should remain at fixed position
    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(10);
    // node1 should move
    expect(positions.nodes[1].data.x).not.toBe(100);
  });

  it('should handle assign mode.', async () => {
    const graph = {
      nodes: [
        { id: 'node0', data: {} },
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [
        { id: 'edge1', source: 'node0', target: 'node1', data: {} },
        { id: 'edge2', source: 'node1', target: 'node2', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    await fruchterman.assign(graph);
    fruchterman.stop();
    fruchterman.tick(1000);

    const allNodes = graph.nodes as any[];
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle disconnected components.', () => {
    const graph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'c', target: 'd', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    expect(positions.nodes.length).toBe(4);
    expect(positions.edges?.length).toBe(2);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle complete graph.', () => {
    const graph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'a', target: 'c', data: {} },
        { id: 'e3', source: 'a', target: 'd', data: {} },
        { id: 'e4', source: 'b', target: 'c', data: {} },
        { id: 'e5', source: 'b', target: 'd', data: {} },
        { id: 'e6', source: 'c', target: 'd', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    expect(positions.nodes.length).toBe(4);
    // nodes in complete graph should be evenly distributed
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle star graph.', () => {
    const graph = {
      nodes: [
        { id: 'center', data: {} },
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'center', target: 'a', data: {} },
        { id: 'e2', source: 'center', target: 'b', data: {} },
        { id: 'e3', source: 'center', target: 'c', data: {} },
        { id: 'e4', source: 'center', target: 'd', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    // center node should be close to graph center
    // surrounding nodes should be distributed around it
    expect(positions.nodes.length).toBe(5);
  });

  it('should handle path graph.', () => {
    const graph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
        { id: 'e', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
        { id: 'e3', source: 'c', target: 'd', data: {} },
        { id: 'e4', source: 'd', target: 'e', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    expect(positions.nodes.length).toBe(5);
    // nodes should form roughly a line
  });

  it('should handle custom width and height.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: {} },
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [
        { id: 'edge1', source: 'node0', target: 'node1', data: {} },
        { id: 'edge2', source: 'node1', target: 'node2', data: {} },
      ],
    };
    const fruchterman = new FruchtermanLayout({
      width: 800,
      height: 600,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    // nodes should be positioned within the bounds
    positions.nodes.forEach((node) => {
      expect(node.data.x).toBeLessThan(800);
      expect(node.data.y).toBeLessThan(600);
    });
  });

  it('should handle nodes with initial positions.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { x: 50, y: 50 } },
        { id: 'node1', data: { x: 150, y: 150 } },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(1000);

    // positions should be updated from initial values
    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
  });

  it('should handle clusterGravity parameter with clustering.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { cluster: 'a' } },
        { id: 'node1', data: { cluster: 'a' } },
        { id: 'node2', data: { cluster: 'b' } },
        { id: 'node3', data: { cluster: 'b' } },
      ],
      edges: [],
    };
    const fruchterman1 = new FruchtermanLayout({
      clustering: true,
      nodeClusterBy: (node) => node.data.cluster,
      clusterGravity: 1,
    });
    fruchterman1.execute(graph);
    fruchterman1.stop();
    const positions1 = fruchterman1.tick(1000);

    const graph2 = {
      nodes: [
        { id: 'node0', data: { cluster: 'a' } },
        { id: 'node1', data: { cluster: 'a' } },
        { id: 'node2', data: { cluster: 'b' } },
        { id: 'node3', data: { cluster: 'b' } },
      ],
      edges: [],
    };
    const fruchterman2 = new FruchtermanLayout({
      clustering: true,
      nodeClusterBy: (node) => node.data.cluster,
      clusterGravity: 50,
    });
    fruchterman2.execute(graph2);
    fruchterman2.stop();
    const positions2 = fruchterman2.tick(1000);

    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );
    // higher clusterGravity should keep cluster nodes closer
    expect(dist2).toBeLessThan(dist1);
  });

  it('should handle maxIteration parameter.', () => {
    const graph = {
      nodes: [
        { id: 'node0', data: { x: 0, y: 0 } },
        { id: 'node1', data: { x: 100, y: 0 } },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const fruchterman = new FruchtermanLayout({
      maxIteration: 10,
    });
    fruchterman.execute(graph);
    fruchterman.stop();
    const positions = fruchterman.tick(10);

    expect(positions.nodes.length).toBe(2);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should stop simulation.', () => {
    const fruchterman = new FruchtermanLayout();
    fruchterman.execute(data);
    fruchterman.stop();
    // After stop, should be able to tick manually
    const positions = fruchterman.tick(100);
    expect(positions.nodes.length).toBeGreaterThan(0);
  });
});
