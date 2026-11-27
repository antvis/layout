import { IndentedLayout } from '@/src/algorithm/indented';
import type { GraphData } from '@/src/types';

describe('layout indented', () => {
  it('should layout DFS rows with depth metadata', async () => {
    const data: GraphData = {
      nodes: [
        { id: 'root', data: {} },
        { id: 'a', data: {} },
        { id: 'a-1', data: {} },
        { id: 'b', data: {} },
        { id: 'b-1', data: {} },
      ],
      edges: [
        { source: 'root', target: 'a' },
        { source: 'a', target: 'a-1' },
        { source: 'root', target: 'b' },
        { source: 'b', target: 'b-1' },
      ],
    };
    const layout = new IndentedLayout({
      rootId: 'root',
      direction: 'RL',
      indent: 100,
      rowHeight: 50,
    });

    await layout.execute(data);

    const positions: Record<string, { x: number; y: number }> = {};
    layout.forEachNode((node) => {
      positions[node.id] = { x: node.x === 0 ? 0 : node.x, y: node.y };
    });
    expect(positions).toEqual({
      root: { x: 0, y: 0 },
      a: { x: -100, y: 50 },
      'a-1': { x: -200, y: 100 },
      b: { x: -100, y: 150 },
      'b-1': { x: -200, y: 200 },
    });
    expect(data.nodes.map((node) => [node.id, node.data?.depth, node.data?._isRoot])).toEqual([
      ['root', 0, true],
      ['a', 1, false],
      ['a-1', 2, false],
      ['b', 1, false],
      ['b-1', 2, false],
    ]);
  });
});
