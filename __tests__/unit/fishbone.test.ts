import { FishboneLayout } from '@/src/algorithm/fishbone';

const createData = () => ({
  nodes: [
    { id: 'root' },
    { id: 'category-1' },
    { id: 'category-2' },
    { id: 'item-1' },
    { id: 'item-2' },
  ],
  edges: [
    { source: 'root', target: 'category-1' },
    { source: 'root', target: 'category-2' },
    { source: 'category-1', target: 'item-1' },
    { source: 'category-2', target: 'item-2' },
  ],
});

async function getPositions(direction?: 'LR' | 'RL') {
  const layout = new FishboneLayout({ direction });
  await layout.execute(createData());

  const positions: Record<string, { x: number; y: number }> = {};
  layout.forEachNode((node) => {
    positions[node.id] = { x: node.x, y: node.y };
  });
  return positions;
}

describe('layout fishbone', () => {
  it('should layout categories and items in LR direction', async () => {
    await expect(getPositions()).resolves.toEqual({
      root: { x: 620, y: 280 },
      'category-1': { x: 110, y: 80 },
      'category-2': { x: 290, y: 480 },
      'item-1': { x: 150, y: 180 },
      'item-2': { x: 330, y: 380 },
    });
  });

  it('should mirror x coordinates in RL direction', async () => {
    const [lr, rl] = await Promise.all([
      getPositions('LR'),
      getPositions('RL'),
    ]);

    Object.entries(lr).forEach(([id, position]) => {
      expect(rl[id]).toEqual({ x: 660 - position.x, y: position.y });
    });
  });
});
