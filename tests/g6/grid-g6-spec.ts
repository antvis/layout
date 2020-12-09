import { Layout } from '../../es';
import G6 from '@antv/g6';

const simpleData = {
  nodes: [
    {id: 'node1', x: 1, y: 1},
    {id: 'node2', x: 0, y: 0},
  ],
  edges: [
    {source: 'node1', target: 'node2'},
  ]
}

describe('Adjacency Matrix on graph', () => {
  console.log('dsc');
  it('get graph adjacency matrix', () => {

    const layout = new Layout.GridLayout();
    console.log('dsc1')
    layout.layout(simpleData);
    console.log('dsc2')
  
    const graph = new G6.Graph({
      container: 'container',
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
  

  });
});