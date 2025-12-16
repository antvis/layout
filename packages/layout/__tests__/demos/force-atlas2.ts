import { ForceAtlas2Layout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { relations as data } from '../dataset';
import { preprocessGraphData } from '../utils';
import { GraphRenderer } from '../utils/renderer';

export async function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 1000,
    height: 1000,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);
  const { width, height } = renderer.getCanvasSize();

  const processedData = preprocessGraphData(data, {
    width: 690,
    height: 640,
  });

  const layout = new ForceAtlas2Layout({
    width,
    height,
    radius: 200,
    nodeSize: 20,
  });

  await layout.execute(processedData, {
    preventOverlap: true,
    nodeSize: 20,
    maxIterations: 500,
    kr: 10,
    onTick: (layout) => {
      renderer.handleTick(layout, { nodeRadius: 10 });
    },
  });

  renderer.setDragCallbacks({
    onDragStart: (nodeId, position) => {
      console.log(`🎯 Start dragging node: ${nodeId}`);
      layout.setFixedPosition(nodeId, [position.x, position.y]);
    },

    onDrag: (nodeId, position) => {
      layout.setFixedPosition(nodeId, [position.x, position.y]);
      layout?.tick(10);
    },

    onDragEnd: (nodeId) => {
      layout.setFixedPosition(nodeId, null);
    },
  });

  if (gui) {
    const controls = {
      restart: () => layout.restart(),
      stop: () => layout.stop(),
      tick: () => layout.tick(5),
      enableDrag: true,
    };

    const layoutFolder = gui.addFolder('Force Atlas2 Layout');
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

  return renderer.getCanvas();
}
