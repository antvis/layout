import { RandomLayout } from '@/src';
import type { GUI } from 'lil-gui';
import { countries as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

export function render(gui?: GUI) {
  const renderer = new GraphRenderer();

  const { width, height } = renderer.getCanvasSize();

  const random = new RandomLayout({
    width,
    height,
    center: [width / 2, height / 2],
  });

  const relayout = async (options = {}) => {
    await random.execute(data, options);
    renderer.render(random);
  };

  relayout();

  if (gui) {
    const folder = gui.addFolder('Random Layout');
    folder.add({ run: () => relayout() }, 'run').name('Relayout');
    folder.open();
  }

  return renderer.getCanvas();
}
