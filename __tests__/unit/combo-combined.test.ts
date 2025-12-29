import { ComboCombinedLayout } from '@/src';
import { registry } from '@/src/registry';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { combo2 as combo2Dataset } from '../dataset';
import { calculatePositions, GraphRenderer } from '../utils';

describe('layout combo-combined', () => {
  beforeEach(() => {
    mockRandom();
  });

  afterEach(() => {
    clearMockRandom();
  });

  it('returns expected default config', () => {
    const layout = new ComboCombinedLayout();
    expect(layout.options).toMatchObject({
      nodeSize: 20,
      nodeSpacing: 0,
      comboPadding: 10,
      comboSpacing: 0,
    });

    expect(typeof layout.options.layout).toBe('function');
    const layoutFn = layout.options.layout as any;
    expect(layoutFn(null)).toMatchObject({
      type: 'force',
      preventOverlap: true,
    });
    expect(layoutFn('any-combo')).toMatchObject({
      type: 'concentric',
      preventOverlap: true,
    });
  });

  it('keeps nodes distributed around their combo centers', async () => {
    const data = {
      nodes: [
        { id: 'combo-a', isCombo: true },
        { id: 'combo-a1', isCombo: true, parentId: 'combo-a' },
        { id: 'combo-b', isCombo: true },
        { id: 'a1', parentId: 'combo-a1' },
        { id: 'a2', parentId: 'combo-a1' },
        { id: 'a3', parentId: 'combo-a' },
        { id: 'b1', parentId: 'combo-b' },
        { id: 'b2', parentId: 'combo-b' },
      ],
      edges: [
        { id: 'e1', source: 'a1', target: 'a2' },
        { id: 'e2', source: 'a2', target: 'a3' },
        { id: 'e3', source: 'b1', target: 'b2' },
      ],
    };

    const layout = new ComboCombinedLayout({
      width: 600,
      height: 600,
      nodeSize: 20,
      comboSpacing: 30,
      node: (d: any) => ({
        parentId: d.parentId,
        isCombo: d.isCombo,
      }),
    });

    await layout.execute(data);
    const { nodes } = calculatePositions(layout);
    const nodesById = new Map(nodes.map((n) => [String(n.id), n]));

    const comboA = nodesById.get('combo-a')!;
    const comboA1 = nodesById.get('combo-a1')!;
    expect(comboA.isCombo).toBeTruthy();
    expect(comboA1.isCombo).toBeTruthy();
    expect(comboA.size[0]).toBeGreaterThan(comboA1.size[0]);
    expect(comboA.size[1]).toBeGreaterThan(comboA1.size[1]);

    const assertCombo = (comboId: string, leafNodeIds: string[]) => {
      const combo = nodesById.get(comboId);
      expect(combo?.isCombo).toBeTruthy();

      const members = leafNodeIds.map((id) => nodesById.get(id)!);

      // Members should not collapse to the same position
      for (let i = 0; i < members.length; i += 1) {
        for (let j = i + 1; j < members.length; j += 1) {
          const dx = members[i].x - members[j].x;
          const dy = members[i].y - members[j].y;
          expect(Math.hypot(dx, dy)).toBeGreaterThan(1);
        }
      }

      // Combo center should align with the center of its members' bounds.
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      members.forEach((node) => {
        const [w = 0, h = 0] = Array.isArray(node.size) ? node.size : [0, 0];
        const half = Math.max(w, h) / 2;
        minX = Math.min(minX, node.x - half);
        minY = Math.min(minY, node.y - half);
        maxX = Math.max(maxX, node.x + half);
        maxY = Math.max(maxY, node.y + half);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      expect(Math.abs(combo!.x - centerX)).toBeLessThan(5);
      expect(Math.abs(combo!.y - centerY)).toBeLessThan(5);
    };

    assertCombo('combo-a1', ['a1', 'a2']);
    assertCombo('combo-a', ['combo-a1', 'a3']);
    assertCombo('combo-b', ['b1', 'b2']);
  });

  it('builds temporary edges using closest ancestor and runs iterative sub-layouts via tick()', async () => {
    const spyType = '__combo_combined_spy__';
    const original = (registry as any)[spyType];

    const calls: {
      graphData?: any;
      stopped: boolean;
      tickIterations: number[];
    } = { stopped: false, tickIterations: [] };

    class SpyLayout {
      public model = { nodes: () => this.nodes };
      private nodes: any[] = [];

      execute(graphData: any) {
        calls.graphData = graphData;
        // Layout results only need stable x/y for ComboCombinedLayout to record relative positions.
        this.nodes = (graphData.nodes || []).map((n: any, i: number) => ({
          ...n,
          x: i * 100,
          y: 0,
        }));
      }

      stop() {
        calls.stopped = true;
      }

      tick(iterations: number) {
        calls.tickIterations.push(iterations);
        return Promise.resolve();
      }
    }

    (registry as any)[spyType] = SpyLayout;

    try {
      const data = {
        nodes: [
          { id: 'A', isCombo: true },
          { id: 'A1', isCombo: true, parentId: 'A' },
          { id: 'B', isCombo: true },
          { id: 'a', parentId: 'A1' },
          { id: 'b', parentId: 'A' },
          { id: 'c', parentId: 'B' },
          { id: 'd' },
        ],
        edges: [
          // a -> d should map to A -> d at root temporary graph
          { source: 'a', target: 'd' },
          // b -> c should map to A -> B at root temporary graph
          { source: 'b', target: 'c' },
          // a -> b should map to A -> A and be dropped
          { source: 'a', target: 'b' },
        ],
      };

      const layout = new ComboCombinedLayout({
        width: 600,
        height: 600,
        nodeSize: 20,
        node: (d: any) => ({
          parentId: d.parentId,
          isCombo: d.isCombo,
        }),
        layout: (comboId) =>
          comboId == null
            ? { type: spyType }
            : { type: 'concentric', preventOverlap: true },
      });

      await layout.execute(data);

      expect(calls.stopped).toBe(true);
      expect(calls.tickIterations).toEqual([300]);

      const edges = calls.graphData?.edges || [];
      expect(edges).toEqual(
        expect.arrayContaining([
          { source: 'A', target: 'd' },
          { source: 'A', target: 'B' },
        ]),
      );

      // Root temporary graph should not contain leaf ids.
      expect(edges.some((e: any) => e.source === 'a' || e.target === 'a')).toBe(
        false,
      );
      // And should not contain self loops.
      expect(edges.some((e: any) => e.source === e.target)).toBe(false);
    } finally {
      if (original) (registry as any)[spyType] = original;
      else delete (registry as any)[spyType];
    }
  });

  it('applies comboPadding for mixed children', async () => {
    const data = {
      nodes: [
        { id: 'mix', isCombo: true },
        { id: 'inner', isCombo: true, parentId: 'mix' },
        { id: 'n1', parentId: 'inner' },
        { id: 'n2', parentId: 'inner' },
        { id: 'loose', parentId: 'mix' },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const layoutNoPad = new ComboCombinedLayout({
      width: 600,
      height: 600,
      comboPadding: 0,
      comboSpacing: 30,
      nodeSize: 20,
      layout: { type: 'concentric', preventOverlap: true },
      node: (d: any) => ({ parentId: d.parentId, isCombo: d.isCombo }),
    });
    await layoutNoPad.execute(data);
    const nodes0 = calculatePositions(layoutNoPad).nodes;
    const byId0 = new Map(nodes0.map((n) => [String(n.id), n]));

    const layoutBigPad = new ComboCombinedLayout({
      width: 600,
      height: 600,
      comboPadding: 120,
      comboSpacing: 30,
      nodeSize: 20,
      layout: { type: 'concentric', preventOverlap: true },
      node: (d: any) => ({ parentId: d.parentId, isCombo: d.isCombo }),
    });
    await layoutBigPad.execute(data);
    const nodes1 = calculatePositions(layoutBigPad).nodes;
    const byId1 = new Map(nodes1.map((n) => [String(n.id), n]));

    const mix0 = byId0.get('mix')!;
    const inner0 = byId0.get('inner')!;
    const loose0 = byId0.get('loose')!;
    const mix1 = byId1.get('mix')!;
    const inner1 = byId1.get('inner')!;
    const loose1 = byId1.get('loose')!;

    expect(mix1.size[0]).toBeGreaterThan(mix0.size[0]);
    expect(mix1.size[1]).toBeGreaterThan(mix0.size[1]);

    // inner contains only nodes, so it should expand with comboPadding.
    expect(inner1.size[0]).toBeGreaterThan(inner0.size[0]);
    expect(inner1.size[1]).toBeGreaterThan(inner0.size[1]);
  });

  it('returns empty output for empty graph', async () => {
    const layout = new ComboCombinedLayout({ width: 600, height: 600 });
    await layout.execute({ nodes: [], edges: [] });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });
});

describe('layout combo-combined snapshots', () => {
  let canvas: Canvas;
  let renderer: GraphRenderer;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 800, 800);
    renderer = new GraphRenderer(canvas);
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  it('matches demo: combo2 (circles)', async () => {
    const data: any = JSON.parse(JSON.stringify(combo2Dataset));

    data.combos.forEach((combo: any) => {
      data.nodes.push({
        ...combo,
        id: combo.id,
        isCombo: true,
      });
    });
    delete data.combos;

    const layout = new ComboCombinedLayout({
      width: 800,
      height: 800,
      node: (d: any) => ({
        parentId: d.comboId,
        isCombo: d.isCombo,
      }),
    });

    await layout.execute(data);

    renderer.render(layout, {
      enableDrag: false,
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
    });

    layout.forEachNode((node: any) => {
      renderer.updateNodeAttributes(node.id, {
        cx: node.x,
        cy: node.y,
        r: Math.max(...node.size) / 2,
        zIndex: node.isCombo ? 0 : 1,
        fillOpacity: node.isCombo ? 0.3 : 1,
        fill: node.isCombo ? '#91D5FF' : '#FFD666',
      });
    });

    await expect(canvas).toMatchSnapshot(__filename, 'demo-combo2');
  });

  it('matches demo: dagre nested combos (rects)', async () => {
    const data: any = {
      nodes: [
        { id: '0' },
        { id: '1' },
        { id: '2' },
        { id: '3' },
        { id: '4', combo: 'A' },
        { id: '5', combo: 'B' },
        { id: '6', combo: 'A' },
        { id: '7', combo: 'C' },
        { id: '8', combo: 'C' },
        { id: '9', combo: 'A' },
        { id: '10', combo: 'B' },
        { id: '11', combo: 'B' },
        { id: '12' },
      ],
      edges: [
        { source: '0', target: '1' },
        { source: '0', target: '2' },
        { source: '1', target: 'A' },
        { source: '0', target: '3' },
        { source: '3', target: 'C' },
        { source: '2', target: 'B' },
        { source: '5', target: '10' },
        { source: '5', target: '11' },
        { source: 'A', target: '12' },
        { source: 'B', target: '12' },
        { source: 'C', target: '12' },
      ],
      combos: [
        { id: 'A', style: { type: 'rect' } },
        { id: 'B', style: { type: 'rect' } },
        { id: 'C', style: { type: 'rect' } },
      ],
    };

    data.combos.forEach((combo: any) => {
      data.nodes.push({
        ...combo,
        id: combo.id,
        isCombo: true,
      });
    });
    delete data.combos;

    const layout = new ComboCombinedLayout({
      width: 800,
      height: 800,
      node: (d: any) => ({
        parentId: d.combo,
        isCombo: d.isCombo,
      }),
      layout: (comboId: any) =>
        !comboId
          ? {
              type: 'dagre',
              rankdir: 'LR',
              ranksep: 60,
              nodesep: 50,
            }
          : {
              type: 'dagre',
              rankdir: 'LR',
              ranksep: 40,
              nodesep: 20,
            },
    });

    await layout.execute(data);

    renderer.render(layout, {
      enableDrag: false,
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
      nodeShape: 'rect',
    });

    layout.forEachNode((node: any) => {
      renderer.updateNodeAttributes(node.id, {
        x: node.x - node.size[0] / 2,
        y: node.y - node.size[1] / 2,
        width: node.size[0],
        height: node.size[1],
        zIndex: node.isCombo ? 0 : 1,
        fillOpacity: node.isCombo ? 0.3 : 1,
        fill: node.isCombo ? '#91D5FF' : '#FFD666',
      });
    });

    await expect(canvas).toMatchSnapshot(__filename, 'demo-dagre-rect');
  });
});
