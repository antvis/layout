import { Layout } from '../../src'
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

describe('#gForceGPULayout', () => {
  const preGrid = new Layout.GridLayout({
    width: 500,
    height: 500
  });
  preGrid.layout(data);
  // 由于 GPU 计算是异步的，所以两种 gForce 使用方式。
  // 1. await gForceGPU.layout 后调用渲染
  // 2. 实例化 GForceGPULayout 时将渲染语句传入 onLayoutEnd 回调函数
  it('return correct default config', async () => {
    const gForceGPU = new Layout.GForceGPULayout();
    expect(gForceGPU.getDefaultCfg()).toEqual({
      maxIteration: 2000,
      gravity: 10,
      clustering: false,
      clusterGravity: 10,
    });
    await gForceGPU.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('gforce layout with default configs, test emit afterlayout', async () => {
    const gForceGPU = new Layout.GForceGPULayout({
      minMovement: 0.2,
    });
    await gForceGPU.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('force with fixed edgeStrength, nodeStrength', async () => {
    const node = data.nodes[0];
    const edge = data.edges[0];
    let isEnd;

    const gForceGPU = new Layout.GForceGPULayout({
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
    await gForceGPU.layout(data);
    expect(isEnd === true).toEqual(true);
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });
})