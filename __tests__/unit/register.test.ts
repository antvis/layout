import { getLayoutByName, Layout, Layouts, registerLayout } from '../../src'
// import * as Layout from '../../src'
// import { Registy } from '../../es';
import { Node, Edge } from '../../src/layout/types'
import { mathEqual } from '../util';
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
      id: '0',
    },
    {
      id: '1',
    },
  ],
  edges: [],
};

describe('#UseLayoutWithType', () => {
  it('return correct default config', () => {
    // const circular = new Layout({
    //   type: 'circular'
    // });
    const circular = new Layouts['circular']();
    expect(circular.getDefaultCfg()).toEqual({
      radius: null,
      startRadius: null,
      endRadius: null,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      clockwise: true,
      divisions: 1,
      ordering: null,
      angleRatio: 1,
    });
    circular.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);

    // 默认 height width 是 300，未配置 radius 时，radius 为 150, center 是 [0, 0]
    expect(mathEqual((data.nodes[0] as any).x, 300)).toEqual(true);
    expect(mathEqual((data.nodes[0] as any).y, 150)).toEqual(true);
  });
})

describe('#RegisterLayout', () => {
  it('register a layout', () => {
    // 可以传入带有复写函数的对象，也可以传入一个继承了 base 的 class
    registerLayout('custom', {
      getDefaultCfg() {
        return {
          attr1: 'a',
          attr2: 'b',
          attr3: 'c',
        }
      },
      execute() {
        const { nodes } = this;
        nodes.forEach((node, i) => {
          node.x = i * 10;
          node.y = i * 5
        })
      }
    })

    const CustomLayut =  getLayoutByName('custom');
     const custom = new CustomLayut();
    expect(custom.getDefaultCfg()).toEqual({
      attr1: 'a',
      attr2: 'b',
      attr3: 'c',
    });
    custom.layout(data);
    expect((data.nodes[0] as any).x).toBe(0);
    expect((data.nodes[0] as any).y).toBe(0);
    expect((data.nodes[1] as any).x).toBe(10);
    expect((data.nodes[1] as any).y).toBe(5);
  });
})