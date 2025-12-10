import { ForceLayout } from '@/src';
import type { GUI } from 'lil-gui';
// import { relations as data } from '../dataset';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import { GraphRenderer, preprocessGraphData } from '../utils';

const data = {
  nodes: [
    {
      id: '0',
      label: '0',
      cluster: 'a',
    },
    {
      id: '1',
      label: '1',
      cluster: 'a',
    },
    {
      id: '2',
      label: '2',
      cluster: 'a',
    },
    {
      id: '3',
      label: '3',
      cluster: 'a',
    },
    {
      id: '4',
      label: '4',
      cluster: 'a',
    },
    {
      id: '5',
      label: '5',
      cluster: 'a',
    },
    {
      id: '6',
      label: '6',
      cluster: 'a',
    },
    {
      id: '7',
      label: '7',
      cluster: 'a',
    },
    {
      id: '8',
      label: '8',
      cluster: 'a',
    },
    {
      id: '9',
      label: '9',
      cluster: 'a',
    },
    {
      id: '10',
      label: '10',
      cluster: 'a',
    },
    {
      id: '11',
      label: '11',
      cluster: 'a',
    },
    {
      id: '12',
      label: '12',
      cluster: 'a',
    },
    {
      id: '13',
      label: '13',
      cluster: 'b',
    },
    {
      id: '14',
      label: '14',
      cluster: 'b',
    },
    {
      id: '15',
      label: '15',
      cluster: 'b',
    },
    {
      id: '16',
      label: '16',
      cluster: 'b',
    },
    {
      id: '17',
      label: '17',
      cluster: 'b',
    },
    {
      id: '18',
      label: '18',
      cluster: 'c',
    },
    {
      id: '19',
      label: '19',
      cluster: 'c',
    },
    {
      id: '20',
      label: '20',
      cluster: 'c',
    },
    {
      id: '21',
      label: '21',
      cluster: 'c',
    },
    {
      id: '22',
      label: '22',
      cluster: 'c',
    },
    {
      id: '23',
      label: '23',
      cluster: 'c',
    },
    {
      id: '24',
      label: '24',
      cluster: 'c',
    },
    {
      id: '25',
      label: '25',
      cluster: 'c',
    },
    {
      id: '26',
      label: '26',
      cluster: 'c',
    },
    {
      id: '27',
      label: '27',
      cluster: 'c',
    },
    {
      id: '28',
      label: '28',
      cluster: 'c',
    },
    {
      id: '29',
      label: '29',
      cluster: 'c',
    },
    {
      id: '30',
      label: '30',
      cluster: 'c',
    },
    {
      id: '31',
      label: '31',
      cluster: 'd',
    },
    {
      id: '32',
      label: '32',
      cluster: 'd',
    },
    {
      id: '33',
      label: '33',
      cluster: 'd',
    },
  ],
  edges: [
    {
      source: '0',
      target: '1',
    },
    {
      source: '0',
      target: '2',
    },
    {
      source: '0',
      target: '3',
    },
    {
      source: '0',
      target: '4',
    },
    {
      source: '0',
      target: '5',
    },
    {
      source: '0',
      target: '7',
    },
    {
      source: '0',
      target: '8',
    },
    {
      source: '0',
      target: '9',
    },
    {
      source: '0',
      target: '10',
    },
    {
      source: '0',
      target: '11',
    },
    {
      source: '0',
      target: '13',
    },
    {
      source: '0',
      target: '14',
    },
    {
      source: '0',
      target: '15',
    },
    {
      source: '0',
      target: '16',
    },
    {
      source: '2',
      target: '3',
    },
    {
      source: '4',
      target: '5',
    },
    {
      source: '4',
      target: '6',
    },
    {
      source: '5',
      target: '6',
    },
    {
      source: '7',
      target: '13',
    },
    {
      source: '8',
      target: '14',
    },
    {
      source: '9',
      target: '10',
    },
    {
      source: '10',
      target: '22',
    },
    {
      source: '10',
      target: '14',
    },
    {
      source: '10',
      target: '12',
    },
    {
      source: '10',
      target: '24',
    },
    {
      source: '10',
      target: '21',
    },
    {
      source: '10',
      target: '20',
    },
    {
      source: '11',
      target: '24',
    },
    {
      source: '11',
      target: '22',
    },
    {
      source: '11',
      target: '14',
    },
    {
      source: '12',
      target: '13',
    },
    {
      source: '16',
      target: '17',
    },
    {
      source: '16',
      target: '18',
    },
    {
      source: '16',
      target: '21',
    },
    {
      source: '16',
      target: '22',
    },
    {
      source: '17',
      target: '18',
    },
    {
      source: '17',
      target: '20',
    },
    {
      source: '18',
      target: '19',
    },
    {
      source: '19',
      target: '20',
    },
    {
      source: '19',
      target: '33',
    },
    {
      source: '19',
      target: '22',
    },
    {
      source: '19',
      target: '23',
    },
    {
      source: '20',
      target: '21',
    },
    {
      source: '21',
      target: '22',
    },
    {
      source: '22',
      target: '24',
    },
    {
      source: '22',
      target: '25',
    },
    {
      source: '22',
      target: '26',
    },
    {
      source: '22',
      target: '23',
    },
    {
      source: '22',
      target: '28',
    },
    {
      source: '22',
      target: '30',
    },
    {
      source: '22',
      target: '31',
    },
    {
      source: '22',
      target: '32',
    },
    {
      source: '22',
      target: '33',
    },
    {
      source: '23',
      target: '28',
    },
    {
      source: '23',
      target: '27',
    },
    {
      source: '23',
      target: '29',
    },
    {
      source: '23',
      target: '30',
    },
    {
      source: '23',
      target: '31',
    },
    {
      source: '23',
      target: '33',
    },
    {
      source: '32',
      target: '33',
    },
  ],
};

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
