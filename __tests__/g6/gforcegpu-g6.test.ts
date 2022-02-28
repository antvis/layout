import { GForceGPULayout, GridLayout } from '../../src';
import G6, { IG6GraphEvent } from '@antv/g6';
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
    //   .then((data) => {
    const preGrid = new GridLayout({
      width: 500,
      height: 500,
      nodeStrength: 10
    });
    preGrid.layout(data);

    const node0 = data.nodes[0] as any;
    node0.fx = 100;
    node0.fy = 100;

    const node17 = data.nodes[17] as any;

    node17.fx = 400;
    node17.fy = 400;

    data.nodes.forEach((node: any, i) => {
      node.label = `${i}`;
    });

    const layout = new GForceGPULayout({
      // GForceGPULayout GForceLayout
      maxIteration: 1000,
      // gravity: 100,
      nodeStrength: 1000,
      // @ts-ignore
      tick: () => {
        graph.refreshPositions();
      }
    });
    await layout.layout(data);
    // layout.layout(data);

    // @ts-ignore
    console.log('layout', layout, layout.getMass(data.nodes[10]));
    graph.data(data);
    graph.render();

    function refreshDragedNodePosition(e: IG6GraphEvent) {
      const model = e.item?.get('model');
      model.fx = e.x;
      model.fy = e.y;
    }
    // graph.on('node:dragstart', (e) => {
    //   refreshDragedNodePosition(e);
    // });
    graph.on('node:drag', e => {
      const model = e.item?.get('model');
      model.x = e.x;
      model.y = e.y;
      graph.refreshPositions();
    });
    graph.on('node:dragend', async e => {
      refreshDragedNodePosition(e);
      await layout.execute();
      graph.refreshPositions();
    });
    // graph.destroy();
    // });
  });
});
