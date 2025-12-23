import { D3Force3DLayout } from '@/src';
import { Layout } from '@/src/core/types';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { d3Force as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

export async function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 700,
    height: 700,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);
  const { width, height } = renderer.getCanvasSize();

  const layout = new D3Force3DLayout();

  layout.execute(data, {
    center: {
      x: width / 2,
      y: height / 2,
    },
    x: {
      x: width / 2,
    },
    y: {
      y: height / 2,
    },
    manyBody: {
      strength: -20,
    },
    onTick: (layout: Layout) => {
      renderer.handleTick(layout, { nodeRadius: 5 });
    },
  });

  if (gui) {
    const controls = {
      restart: () => layout.restart(),
      stop: () => layout.stop(),
      tick: () => layout.tick(5),
      enableDrag: true,
    };

    const layoutFolder = gui.addFolder('D3 Force Layout');
    layoutFolder.add(controls, 'stop').name('Stop');
    layoutFolder.add(controls, 'tick').name('Tick 5 Iterations');
    layoutFolder.add(controls, 'restart').name('Restart');

    layoutFolder
      .add(controls, 'enableDrag')
      .name('Enable Drag')
      .onChange((enabled: boolean) => {
        renderer.setDraggable(enabled);
      });
  }

  return canvas;
}
