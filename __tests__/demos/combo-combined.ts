import { ComboCombinedLayout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { combo2 as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

data.combos.forEach((combo: any) => {
  (data.nodes as any).push({
    ...combo,
    id: combo.id,
    isCombo: true,
  });
});
delete data.combos;
console.log('combo combined data:', data);

export function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 800,
    height: 800,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);

  const layout = new ComboCombinedLayout({
    width: 800,
    height: 800,
    node: (d) => ({
      parentId: d.comboId,
      isCombo: d.isCombo,
    }),
  });

  const relayout = async (options = {}) => {
    await layout.execute(data, options);

    renderer.render(layout, {
      enableDrag: false,
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
    });

    layout.forEachNode((node) => {
      renderer.updateNodeAttributes(node.id, {
        cx: node.x,
        cy: node.y,
        r: Math.max(...node.size) / 2,
        zIndex: node.isCombo ? 0 : 1,
        fillOpacity: node.isCombo ? 0.3 : 1,
        fill: node.isCombo ? '#91D5FF' : '#FFD666',
      });
    });

    layout.forEachEdge((edge) => {});
  };

  relayout();

  return renderer.getCanvas();
}
