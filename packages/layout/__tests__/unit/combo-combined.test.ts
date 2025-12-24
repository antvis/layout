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

      // Combo center should align with the centroid of its children
      const centroid = members.reduce(
        (acc, cur) => {
          acc.x += cur.x;
          acc.y += cur.y;
          return acc;
        },
        { x: 0, y: 0 },
      );
      centroid.x /= members.length;
      centroid.y /= members.length;

      expect(combo!.x).toBeCloseTo(centroid.x, 3);
      expect(combo!.y).toBeCloseTo(centroid.y, 3);
    };

    assertCombo('combo-a1', ['a1', 'a2']);
    assertCombo('combo-a', ['a1', 'a2', 'a3']);
    assertCombo('combo-b', ['b1', 'b2']);
  });

  it('does not apply comboPadding for mixed children', async () => {
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

    const toWH = (n: any): [number, number] => {
      if (Array.isArray(n.size)) return [n.size[0] ?? 0, n.size[1] ?? 0];
      const s = Number(n.size ?? 0);
      return [s, s];
    };

    const enclosingSize = (
      center: { x: number; y: number },
      children: any[],
      padding: number,
    ) => {
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;

      children.forEach((child) => {
        const [w, h] = toWH(child);
        const cx = child.x - center.x;
        const cy = child.y - center.y;
        left = Math.min(left, cx - w / 2);
        right = Math.max(right, cx + w / 2);
        top = Math.min(top, cy - h / 2);
        bottom = Math.max(bottom, cy + h / 2);
      });

      left -= padding;
      right += padding;
      top -= padding;
      bottom += padding;

      return {
        width: Math.max(Math.abs(left), Math.abs(right)) * 2,
        height: Math.max(Math.abs(top), Math.abs(bottom)) * 2,
      };
    };

    const mix0 = byId0.get('mix')!;
    const inner0 = byId0.get('inner')!;
    const loose0 = byId0.get('loose')!;
    const mix1 = byId1.get('mix')!;
    const inner1 = byId1.get('inner')!;
    const loose1 = byId1.get('loose')!;

    // mix has both a combo child and a node child, so its own bounds should NOT
    // apply comboPadding (even if comboPadding is large).
    const expectedMix0 = enclosingSize(mix0, [inner0, loose0], 0);
    const expectedMix1 = enclosingSize(mix1, [inner1, loose1], 0);
    const paddedMix1 = enclosingSize(mix1, [inner1, loose1], 120);

    expect(mix0.size[0]).toBeCloseTo(expectedMix0.width, 1);
    expect(mix0.size[1]).toBeCloseTo(expectedMix0.height, 1);
    expect(mix1.size[0]).toBeCloseTo(expectedMix1.width, 1);
    expect(mix1.size[1]).toBeCloseTo(expectedMix1.height, 1);
    expect(mix1.size[0]).not.toBeCloseTo(paddedMix1.width, 1);
    expect(mix1.size[1]).not.toBeCloseTo(paddedMix1.height, 1);

    // inner contains only nodes, so it should expand with comboPadding.
    expect(inner1.size[0]).toBeGreaterThan(inner0.size[0]);
    expect(inner1.size[1]).toBeGreaterThan(inner0.size[1]);
  });
});
