import {
  FishboneLayout,
  IndentedLayout,
  MindmapLayout,
  registry,
  type BaseLayout,
  type ID,
} from '@/src';

function positions(layout: BaseLayout): [ID, number, number][] {
  const result: [ID, number, number][] = [];
  layout.forEachNode(({ id, x, y }) => result.push([id, x, y]));
  return result;
}

describe('tree layouts', () => {
  it('exports and registers all three algorithms', () => {
    expect(registry.indented).toBe(IndentedLayout);
    expect(registry.mindmap).toBe(MindmapLayout);
    expect(registry.fishbone).toBe(FishboneLayout);
  });

  it('indents in depth-first order from the requested root', async () => {
    const layout = new IndentedLayout({
      rootId: 0,
      direction: 'RL',
      indent: 60,
      rowHeight: 30,
    });
    const inputNode = { id: 'first', x: 20, data: { label: 'First' } };
    await layout.execute({
      nodes: [
        { id: 'outside' },
        { id: 0 },
        inputNode,
        { id: 'second' },
        { id: 'leaf' },
      ],
      edges: [
        { source: 0, target: 'first' },
        { source: 0, target: 'second' },
        { source: 'first', target: 'leaf' },
      ],
    });

    expect(positions(layout)).toEqual([
      ['outside', 0, 0],
      [0, 0, 0],
      ['first', -60, 30],
      ['second', -60, 90],
      ['leaf', -120, 60],
    ]);
    const depths = new Map<ID, number | undefined>();
    layout.forEachNode(({ id, depth }) => depths.set(id, depth));
    expect(depths.get('leaf')).toBe(2);
    expect(inputNode).toEqual({ id: 'first', x: 20, data: { label: 'First' } });
  });

  it('positions mind map branches using raw node sizes and a side callback', async () => {
    const layout = new MindmapLayout({
      getWidth: (node) => node.data.width,
      getSide: (node) => node.data.side,
    });
    await layout.execute({
      nodes: [
        { id: 'root', data: { width: 120 } },
        { id: 'left', data: { width: 80, side: 'left' } },
        { id: 'right', data: { width: 100, side: 'right' } },
        { id: 'leaf', data: { width: 60, side: 'left' } },
      ],
      edges: [
        { source: 'root', target: 'left' },
        { source: 'root', target: 'right' },
        { source: 'left', target: 'leaf' },
      ],
    });

    expect(positions(layout)).toEqual([
      ['root', 0, 0],
      ['left', -220, 0],
      ['right', 230, 0],
      ['leaf', -410, 0],
    ]);
    const sides = new Map<ID, 'left' | 'right' | undefined>();
    layout.forEachNode(({ id, side }) => sides.set(id, side));
    expect(sides.get('leaf')).toBe('left');
  });

  it('alternates fishbone ribs and mirrors their horizontal positions', async () => {
    const layout = new FishboneLayout();
    const data = {
      nodes: ['head', 'category-a', 'category-b', 'item-a', 'item-b'].map(
        (id) => ({ id }),
      ),
      edges: [
        { source: 'head', target: 'category-a' },
        { source: 'head', target: 'category-b' },
        { source: 'category-a', target: 'item-a' },
        { source: 'category-b', target: 'item-b' },
      ],
    };
    await layout.execute(data);
    expect(positions(layout)).toEqual([
      ['head', 620, 280],
      ['category-a', 110, 80],
      ['category-b', 290, 480],
      ['item-a', 150, 180],
      ['item-b', 330, 380],
    ]);

    await layout.execute(data, { direction: 'RL' });
    expect(positions(layout)).toEqual([
      ['head', 40, 280],
      ['category-a', 550, 80],
      ['category-b', 370, 480],
      ['item-a', 510, 180],
      ['item-b', 330, 380],
    ]);
  });

  it.each([IndentedLayout, MindmapLayout, FishboneLayout])(
    'accepts empty data in %p',
    async (LayoutClass) => {
      const layout = new LayoutClass();
      await layout.execute({ nodes: [] });
      expect(positions(layout)).toEqual([]);
    },
  );
});
