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
};

const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('ER Layout', () => {
  it('er layout with small data', () => {
    const layout = new Layout({
      type: 'er'
    });
    layout.layout(simpleData);
  
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
        const layout = new Layout({
          type: 'er',
        });
        layout.layout(data);
        graph.data(data)
        graph.render();
        graph.destroy();
      });
  });
  it('swtich data', () => {
    const layout = new Layout({
      type: 'er'
    });
    layout.layout(simpleData);
  
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
          layout.layout(data);
          graph.data(data)
          graph.render();
        });
    });
    graph.destroy();
  });
});