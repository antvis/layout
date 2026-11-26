import { MindmapLayout } from '@/src/algorithm/mindmap';
import type { GraphData } from '@/src/types';

const createData = (): GraphData => ({
  nodes: [
    { id: 'root', data: {} },
    { id: 'left', data: {} },
    { id: 'right', data: {} },
    { id: 'left-leaf', data: {} },
    { id: 'right-leaf', data: {} },
  ],
  edges: [
    { source: 'root', target: 'left' },
    { source: 'root', target: 'right' },
    { source: 'left', target: 'left-leaf' },
    { source: 'right', target: 'right-leaf' },
  ],
});

function getPositions(layout: MindmapLayout) {
  const positions: Record<string, { x: number; y: number }> = {};
  layout.forEachNode((node) => {
    positions[node.id] = { x: node.x, y: node.y };
  });
  return positions;
}

describe('layout mindmap', () => {
  it('should assign sides and inherit branch colors', async () => {
    const data = createData();
    const layout = new MindmapLayout({
      branchColors: ['red', 'blue'],
      getSide: (_node, index, parentSide) =>
        parentSide ?? (index === 0 ? 'left' : 'right'),
    });

    await layout.execute(data);

    expect(getPositions(layout)).toEqual({
      root: { x: 0, y: 0 },
      left: { x: -220, y: 0 },
      right: { x: 220, y: 0 },
      'left-leaf': { x: -440, y: 0 },
      'right-leaf': { x: 440, y: 0 },
    });
    expect(data.nodes.map((node) => [node.id, node.data?._branchColor])).toEqual([
      ['root', undefined],
      ['left', 'red'],
      ['right', 'blue'],
      ['left-leaf', 'red'],
      ['right-leaf', 'blue'],
    ]);
  });

  it('should respect node sizes and gaps in LR and RL directions', async () => {
    for (const direction of ['LR', 'RL'] as const) {
      const layout = new MindmapLayout({
        direction,
        levelGap: 100,
        nodeGap: 10,
        getWidth: (node) => (node.id === 'root' ? 80 : 40),
        getHeight: (node) => (node.id === 'root' ? 60 : 20),
      });
      await layout.execute({
        nodes: [{ id: 'root' }, { id: 'a' }, { id: 'b' }],
        edges: [
          { source: 'root', target: 'a' },
          { source: 'root', target: 'b' },
        ],
      });

      const sign = direction === 'LR' ? 1 : -1;
      expect(getPositions(layout)).toEqual({
        root: { x: 0, y: 0 },
        a: { x: sign * 160, y: -15 },
        b: { x: sign * 160, y: 15 },
      });
    }
  });
});
