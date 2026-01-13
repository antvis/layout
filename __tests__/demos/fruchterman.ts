import { FruchtermanLayout } from '@/src';
import type { GUI } from 'lil-gui';
import { fruchterman as data } from '../dataset';
import { GraphRenderer, preprocessGraphData } from '../utils';

export async function render(gui?: GUI) {
  const renderer = new GraphRenderer();
  const { width, height } = renderer.getCanvasSize();

  const processedData = preprocessGraphData(data, {
    width,
    height,
  });

  const layout = new FruchtermanLayout({
    width,
    height,
    animate: false,
    onTick: (layout) => {
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

  const options = {
    gravity: 10,
    speed: 5,
    nodeSize: 20,
  };

  const clusterOptions = {
    ...options,
    clustering: true,
    // nodeClusterBy: (node: any) => node.cluster,
    nodeClusterBy: 'node.cluster',
  };

  console.time('fruchterman layout');
  await layout.execute(processedData, clusterOptions);
  console.timeEnd('fruchterman layout');

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
