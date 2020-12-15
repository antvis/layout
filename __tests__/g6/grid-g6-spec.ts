import { Layout } from '../../src';
import G6 from '@antv/g6';

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
  it('grid layout with small data', () => {
    const layout = new Layout.GridLayout();
    Layout.layout(simpleData);
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    graph.data(simpleData)
    graph.render();
    graph.destroy();
  });
  it('grid layout with complex data', () => {
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
    });
  
    fetch(complexDataUrl)
      .then((res) => res.json())
      .then((data) => {
        const layout = new Layout.GridLayout({
          begin: [150, 200]
        });
        Layout.layout(data);
        graph.data(data)
        graph.render();
        graph.destroy();
      });
  });
  it('swtich data', () => {
    const layout = new Layout.GridLayout();
    Layout.layout(simpleData);
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    graph.data(simpleData)
    graph.render();
    graph.on('canvas:click', e => {
      fetch(complexDataUrl)
        .then((res) => res.json())
        .then((data) => {
          Layout.layout(data);
          graph.data(data)
          graph.render();
        });
    });
    graph.destroy();
  });
  it('update cfg', () => {
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    const layout = new Layout.GridLayout({
      rows: 5
    });

    fetch(complexDataUrl)
    .then((res) => res.json())
    .then((data) => {
      Layout.layout(data);
      graph.data(data)
      graph.render();
      graph.destroy();
    });

    graph.on('canvas:click', e => {
      Layout.updateCfg({
        preventOverlapPadding: 30,
        width: 1000
      });
      Layout.execute();
      graph.refreshPositions();
    });
  });
});