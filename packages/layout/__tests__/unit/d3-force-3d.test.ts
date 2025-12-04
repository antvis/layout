import { D3Force3DLayout } from '@/src';
import { force3d as data } from '../dataset';

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
});
