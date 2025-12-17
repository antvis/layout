import { ForceLayout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { cluster as data } from '../dataset';
import { GraphRenderer, preprocessGraphData } from '../utils';

export async function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 690,
    height: 628,
    renderer: new Renderer(),
  });
  const renderer = new GraphRenderer(canvas);
  const { width, height } = renderer.getCanvasSize();

  const processedData = preprocessGraphData(data, {
    width,
    height,
  });

  let index = 0;
  const layout = new ForceLayout({
    width,
    height,
    center: [width / 2, height / 2],
    maxSpeed: 100,
    linkDistance: 50,
    clustering: true,
    nodeClusterBy: (d) => d.cluster,
    clusterNodeStrength: 300,
    onTick: (layout) => {
      console.log('tick:', index++);
      renderer.handleTick(
        layout,
        {
          nodeRadius: 10,
          showLabel: true,
          nodeStyle: { stroke: '#F875AA', lineWidth: 1 },
        },
        processedData as any,
      );
    },
  });

  renderer.setDragCallbacks({
    onDragStart: (nodeId, position) => {
      console.log(`🎯 Start dragging node: ${nodeId}`);
      layout.setFixedPosition(nodeId, [position.x, position.y]);
    },

    onDrag: (nodeId, position) => {
      console.log(`🚚 Dragging node: ${position}`);
      layout.setFixedPosition(nodeId, [position.x, position.y]);
      layout.tick(10);
    },

    onDragEnd: (nodeId) => {
      layout.setFixedPosition(nodeId, null);
    },
  });

  layout.execute(processedData);

  if (gui) {
    const controls = {
      restart: () => layout.restart(),
      stop: () => layout.stop(),
      tick: () => layout.tick(100),
      enableDrag: true,
    };

    const layoutFolder = gui.addFolder('Fruchterman Layout');
    layoutFolder.add(controls, 'stop').name('Stop');
    layoutFolder.add(controls, 'tick').name('Tick 100 Iterations');
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
