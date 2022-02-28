import { FruchtermanGPULayout, GridLayout } from '../../src';
import G6 from '@antv/g6';
import dataset from '../data';

const data = dataset.smallWorld;

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

// @ts-ignore
const simpleData = {
  nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }, { id: 'node4' }],
  edges: [{ source: 'node1', target: 'node2' }]
};

// @ts-ignore
const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('Grid Layout', () => {
  it.only('grid layout with small data', async () => {
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true
        }
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas']
      }
    });

    // fetch(complexDataUrl)
    //   .then((res) => res.json())
    //   .then(async (data) => {
    const preGrid = new GridLayout({
      width: 500,
      height: 500,
      nodeStrength: 10
    });
    preGrid.layout(data);

    const colors = [
      '#5F95FF', // blue
      '#61DDAA',
      '#65789B',
      '#F6BD16',
      '#7262FD',
      '#78D3F8',
      '#9661BC',
      '#F6903D',
      '#008685',
      '#F08BB4'
    ];

    data.nodes.forEach((node: any) => {
      node.cluster = Math.floor(Math.random() * 5);
      node.color = colors[node.cluster];
    });

    (data.nodes[0] as any).fx = 100;
    (data.nodes[0] as any).fy = 100;

    (data.nodes[17] as any).fx = 400;
    (data.nodes[17] as any).fy = 400;

    data.nodes.forEach((node: any, i) => {
      node.label = `${i}`;
    });

    const layout = new FruchtermanGPULayout({
      // FruchtermanGPULayout FruchtermanLayout
      maxIteration: 1000,
      speed: 5,
      clustering: true,
      clusterGravity: 10
      // clustering: true,
      // clusterField: 'cluster',
      // onLayoutEnd: () => {
      //   graph.refreshPositions();
      // }
      // gravity: 100,
      // tick: () => {
      //   graph.refreshPositions();
      // }
    });
    await layout.layout(data);
    console.log(JSON.stringify(data));
    // layout.layout(data);

    graph.data(data);
    graph.render();

    function refreshDragedNodePosition(e: any) {
      const model = e.item.get('model');
      model.fx = e.x;
      model.fy = e.y;
    }
    graph.on('node:dragstart', e => {
      // @ts-ignore
      layout.stop();
    });
    graph.on('node:drag', (e: any) => {
      const model = e.item.get('model');
      model.x = e.x;
      model.y = e.y;
      graph.refreshPositions();
    });
    graph.on('node:dragend', async e => {
      refreshDragedNodePosition(e);
      layout.execute();
      graph.refreshPositions();
    });
    graph.destroy();
    // });
  });
});
