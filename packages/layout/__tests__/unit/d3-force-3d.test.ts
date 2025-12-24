import { D3Force3DLayout } from '@/src';
import { force3d as data } from '../dataset';
import { calculatePositions } from '../utils';

describe('d3 force 3d', () => {
  test('default layout', async () => {
    const d3Force3D = new D3Force3DLayout();

    await d3Force3D.execute(data);

    d3Force3D.forEachNode((node) => {
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
      expect(node.z).toBeDefined();
      expect(node.vx).toBeDefined();
      expect(node.vy).toBeDefined();
      expect(node.vz).toBeDefined();
    });
  });

  test('tick layout', async () => {
    const d3Force3D = new D3Force3DLayout();

    const onTick = jest.fn();

    await d3Force3D.execute(data, {
      onTick,
    });

    expect(onTick).toHaveBeenCalledTimes(300);
  });

  it('should handle 3D positions', async () => {
    const d3Force3D = new D3Force3DLayout();
    await d3Force3D.execute(data);

    const nodeId = data.nodes[0].id;
    d3Force3D.setFixedPosition(nodeId, [100, 200, 300]);
    d3Force3D.tick(1);

    const positions = calculatePositions(d3Force3D);
    const node = positions.nodes.find((n) => n.id === nodeId);

    expect(node?.x).toBe(100);
    expect(node?.y).toBe(200);
    expect(node?.z).toBe(300);
  });
});
