import { Canvas, Circle } from '@antv/g';
import type { LayoutMapping } from '../../packages/layout';

export async function renderNodes(canvas: Canvas, positions: LayoutMapping) {
  await canvas.ready;
  canvas.removeChildren();
  positions.nodes.forEach((node) => {
    const circle = new Circle({
      style: {
        cx: node.data.x,
        cy: node.data.y,
        r: 10,
        fill: '#1890FF',
        stroke: '#F04864',
        lineWidth: 4,
      },
    });
    canvas.appendChild(circle);
  });
}
