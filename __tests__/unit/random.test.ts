import { Layouts, Node, Edge } from '../../src';
// import G6 from '@antv/g6';

// const div = document.createElement('div');
// div.id = 'global-spec';
// document.body.appendChild(div);
// const graph = new G6.Graph({
//   container: div,
//   width: 500,
//   height: 500,
// });
// data.nodes.forEach(node => {
//   node.label = node.id
// })
// graph.data(data);
// graph.render()

const data: { nodes: Node[]; edges: Edge[] } = {
  nodes: [
    {
      id: '0'
    },
    {
      id: '1'
    }
  ],
  edges: []
};

describe('#RandomLayout', () => {
  it('return correct default config', () => {
    const random = new Layouts['random']();
    expect(random.getDefaultCfg()).toEqual({
      type: 'random',
      center: [0, 0],
      width: 300,
      height: 300
    });
    random.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
});
