import { Layouts } from '../../src';
import dataset from '../data';
import { mathEqual } from '../util';
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

describe('#CircularLayout', () => {
  it('return correct default config', () => {
    const circular = new Layouts['circular']();
    expect(circular.getDefaultCfg()).toEqual({
      type: 'circular',
      radius: null,
      startRadius: null,
      endRadius: null,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      clockwise: true,
      divisions: 1,
      ordering: null,
      angleRatio: 1
    });
    circular.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);

    // 默认 height width 是 300，未配置 radius 时，radius 为 150, center 是 [0, 0]
    expect(mathEqual(data.nodes[0].x, 300)).toEqual(true);
    expect(mathEqual(data.nodes[0].y, 150)).toEqual(true);
  });

  it('fixed radius, start angle, end angle', () => {
    const circular = new Layouts['circular']({
      center: [250, 250],
      radius: 200,
      startAngle: Math.PI / 4,
      endAngle: Math.PI
    });
    circular.layout(data);
    const pos = (200 * Math.sqrt(2)) / 2;

    expect(mathEqual(data.nodes[0].x, 250 + pos)).toEqual(true);
    expect(mathEqual(data.nodes[0].y, 250 + pos)).toEqual(true);
  });
  it('circular with no node', () => {
    const circular = new Layouts['circular']();
    circular.layout({
      nodes: []
    });
  });
  it('circular with one node', () => {
    const circular = new Layouts['circular']({
      center: [150, 50]
    });
    const oneNodeData = {
      nodes: [
        {
          id: 'node'
        }
      ]
    };
    circular.layout(oneNodeData);
    expect((oneNodeData.nodes[0] as any).x).toEqual(150);
    expect((oneNodeData.nodes[0] as any).y).toEqual(50);
  });
  it('circular with no radius but startRadius and endRadius', () => {
    const circular = new Layouts['circular']({
      center: [150, 200],
      startRadius: 1,
      endRadius: 100
    });
    circular.layout(data);
    expect(data.nodes[0].x).toEqual(150 + 1);
    expect(data.nodes[0].y).toEqual(200);
    const nodeNumber = data.nodes.length;
    const nodeModelLast = data.nodes[nodeNumber - 1];
    expect(mathEqual(nodeModelLast.x, 248)).toEqual(true);
    expect(mathEqual(nodeModelLast.y, 180)).toEqual(true);
  });
  it('circular with no radius and startRadius but endRadius', () => {
    const circular = new Layouts['circular']({
      center: [150, 200],
      endRadius: 100
    });
    circular.layout(data);
    const nodeModelFirst = data.nodes[0];
    expect(nodeModelFirst.x).toEqual(150 + 100);
    expect(nodeModelFirst.y).toEqual(200);
  });

  it('circular with no radius and endRadius but startRadius', () => {
    const circular = new Layouts['circular']({
      center: [150, 200],
      startRadius: 100
    });
    circular.layout(data);
    const nodeModelFirst = data.nodes[0];
    expect(nodeModelFirst.x).toEqual(150 + 100);
    expect(nodeModelFirst.y).toEqual(200);
  });

  it('circular with topology ordering', () => {
    const circular = new Layouts['circular']({
      center: [250, 250],
      ordering: 'topology',
      radius: 200
    });
    circular.layout(data);

    let node0, node1, node2, node3;
    data.nodes.forEach(node => {
      if (node.id === 'Uruguay') node0 = node;
      else if (node.id === 'Saudi Arabia') node1 = node;
      else if (node.id === 'Switzerland') node2 = node;
      else if (node.id === 'Sweden') node3 = node;
    });

    // @ts-ignore
    const dist1 = (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);
    // @ts-ignore
    const dist2 = (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);

    expect(mathEqual(dist1, dist2)).toEqual(true);

    // @ts-ignore
    const dist3 = (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
    expect(mathEqual(dist3, dist2)).toEqual(true);
  });

  it('circular with topology-directed ordering', () => {
    const circular = new Layouts['circular']({
      center: [250, 250],
      ordering: 'topology-directed',
      radius: 200
    });
    circular.layout(data);

    let node0, node1, node2, node3;
    data.nodes.forEach(node => {
      if (node.id === 'Uruguay') node0 = node;
      else if (node.id === 'Tunisia') node1 = node;
      else if (node.id === 'Switzerland') node2 = node;
      else if (node.id === 'Sweden') node3 = node;
    });

    // @ts-ignore
    const dist1 = (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);

    // @ts-ignore
    const dist2 = (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);
    expect(mathEqual(dist1, dist2)).toEqual(true);

    // @ts-ignore
    const dist3 = (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
    expect(mathEqual(dist3, dist2)).toEqual(true);
  });

  it('circular with degree ordering, counterclockwise', () => {
    const circular = new Layouts['circular']({
      center: [250, 250],
      ordering: 'degree',
      radius: 200,
      clockwise: false
    });
    circular.layout(data);

    let node0, node1, node2, node3;
    data.nodes.forEach(node => {
      if (node.id === 'England') node0 = node;
      else if (node.id === 'Croatia') node1 = node;
      else if (node.id === 'Belgium') node2 = node;
      else if (node.id === 'Uruguay') node3 = node;
    });
    // @ts-ignore
    const dist1 = (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y);

    // @ts-ignore
    const dist2 = (node2.x - node1.x) * (node2.x - node1.x) + (node2.y - node1.y) * (node2.y - node1.y);
    expect(mathEqual(dist1, dist2)).toEqual(true);

    // @ts-ignore
    const dist3 = (node2.x - node3.x) * (node2.x - node3.x) + (node2.y - node3.y) * (node2.y - node3.y);
    expect(mathEqual(dist3, dist2)).toEqual(true);
  });
});
