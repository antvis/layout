import { Layouts } from '../../src'
import dataset from '../data';
const data = dataset.data;

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

describe('#gForceLayout', () => {
  const preGrid = new Layouts['grid']({
    width: 500,
    height: 500
  });
  preGrid.layout(data);
  it('return correct default config', () => {
    const gForce = new Layouts['gForce']();
    expect(gForce.getDefaultCfg()).toEqual({
      maxIteration: 500,
      gravity: 10,
      enableTick: true,
    });
    gForce.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('gforce layout with default configs, test emit afterlayout', () => {
    const gForce = new Layouts['gForce']({
      minMovement: 0.2,
    });
    gForce.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('force with fixed edgeStrength, nodeStrength', () => {
    const node = data.nodes[0];
    const edge = data.edges[0];
    let isEnd;

    const gForce = new Layouts['gForce']({
      linkDistance: 140,
      edgeStrength: 0.5,
      nodeStrength: -30,
      onLayoutEnd() {
        isEnd = true;
        expect(node.x);
        expect(node.y);
        expect(edge.x).toEqual(undefined);
        expect(edge.y).toEqual(undefined);
      },
    });
    gForce.layout(data);
    expect(isEnd === true).toEqual(true);
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });
})