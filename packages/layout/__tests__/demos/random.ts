import { RandomLayout } from '@/src';
import type { Canvas } from '@antv/g';
import type { GUI } from 'lil-gui';
import { countries as data } from '../dataset';
import { renderNodesAndEdges } from '../utils';

export function render(canvas: Canvas, gui?: GUI) {
  const random = new RandomLayout({
    width: canvas.getConfig().width,
    height: canvas.getConfig().height,
    center: [canvas.getConfig().width! / 2, canvas.getConfig().height! / 2],
  });

  const relayout = async (options = {}) => {
    const positions = await random.execute(data, options);
    await renderNodesAndEdges(canvas, positions, true);
  };

  relayout();

  if (gui) {
    const folder = gui.addFolder('Random Layout');
    folder.add({ run: () => relayout() }, 'run').name('Relayout');
    folder.open();
  }

  return canvas;
}
