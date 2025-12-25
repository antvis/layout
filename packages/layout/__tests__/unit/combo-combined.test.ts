import { ComboCombinedLayout } from '@/src';
import { calculatePositions } from '../utils';

describe('layout combo-combined', () => {
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

  it('applies comboPadding for mixed children', async () => {
    const data = {
      nodes: [
        { id: 'mix', isGroup: true },
        { id: 'inner', isGroup: true, parentId: 'mix' },
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
      node: (d: any) => ({ parentId: d.parentId, isGroup: d.isGroup }),
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
      node: (d: any) => ({ parentId: d.parentId, isGroup: d.isGroup }),
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
});
