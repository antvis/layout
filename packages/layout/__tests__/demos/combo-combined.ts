import { ComboCombinedLayout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { combo as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

data.combos.forEach((combo: any) => {
  (data.nodes as any).push({
    id: combo.id,
    isGroup: true,
  });
});

export function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 600,
    height: 600,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);

  const layout = new ComboCombinedLayout({
    width: 600,
    height: 600,
    node: (d) => ({
      parentId: d.comboId,
      isGroup: d.isGroup,
    }),
  });

  const relayout = async (options = {}) => {
    await layout.execute(data, options);

    renderer.render(layout, {
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
    });

    layout.forEachNode((node) => {
      renderer.updateNodeAttributes(node.id, {
        cx: node.x,
        cy: node.y,
        r: Math.max(...node.size) / 2,
        zIndex: node.isGroup ? 0 : 1,
        fillOpacity: node.isGroup ? 0.3 : 1,
        fill: node.isGroup ? '#91D5FF' : '#FFD666',
      });
    });

    layout.forEachEdge((edge) => {});
  };

  relayout();

  return renderer.getCanvas();
}
