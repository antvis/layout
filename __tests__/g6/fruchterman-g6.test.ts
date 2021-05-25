import { Layout } from '../../src';
import { GridLayout, FruchtermanGPULayout, FruchtermanLayout } from '../../src'
import G6 from '@antv/g6';
import dataset from '../data';

const data = dataset.smallWorld;

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const simpleData = {
  nodes: [
    {id: 'node1'},
    {id: 'node2'},
    {id: 'node3'},
    {id: 'node4'},
  ],
  edges: [
    {source: 'node1', target: 'node2'},
  ]
}

const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('Grid Layout', () => {
  it.only('grid layout with small data', async () => {
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
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

        data.nodes[0].fx = 100;
        data.nodes[0].fy = 100;

        data.nodes[17].fx = 400;
        data.nodes[17].fy = 400;

        data.nodes.forEach((node, i) => {
          node.label = `${i}`;
        })

        
        const layout = new FruchtermanLayout({ // FruchtermanGPULayout FruchtermanLayout
          maxIteration: 100,
          speed: 50,
          // onLayoutEnd: () => {
          //   console.log('on layout end')
          //   graph.refreshPositions();
          // }
          // gravity: 100,
          tick: () => {
            graph.refreshPositions();
          }
        });
        // await layout.layout(data);
        layout.layout(data);

        graph.data(data)
        graph.render();

        function refreshDragedNodePosition(e) {
          const model = e.item.get('model');
          model.fx = e.x;
          model.fy = e.y;
        }
        graph.on('node:dragstart', (e) => {
          layout.stop();
        });
        graph.on('node:drag', (e) => {
          const model = e.item.get('model');
          model.x = e.x;
          model.y = e.y;
          graph.refreshPositions();
        });
        graph.on('node:dragend', async (e) => {
          refreshDragedNodePosition(e);
          layout.execute();
          graph.refreshPositions();
        });
        // graph.destroy();
      // });
  });
});