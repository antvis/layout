import { D3ForceLayout } from '@/src';
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

  const layout = new D3ForceLayout();

  layout.execute(data, {
    width,
    height,
    // manyBody: {
    //   strength: -20,
    // },
    // clustering: true,
    // clusterNodeStrength: -5,
    // clusterEdgeDistance: 200,
    // clusterNodeSize: 20,
    // clusterFociStrength: 1.2,
    // nodeSpacing: 5,
    // preventOverlap: true,
    // clusterBy: (d) => d.group,
    onTick: (layout) => {
      renderer.handleTick(layout, { nodeRadius: 5 });
    },
  });

  renderer.setDragCallbacks({
    onDragStart: (nodeId, position) => {
      console.log(`🎯 Start dragging node: ${nodeId}`);
      layout.setFixedPosition(nodeId, [position.x, position.y]);
    },

    onDrag: (nodeId, position) => {
      layout.setFixedPosition(nodeId, [position.x, position.y]);
      layout.simulation.alphaTarget(0.3).restart();
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
