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

describe('#FruchtermanLayout', () => {
  const preGrid = new Layouts['grid']({
    width: 500,
    height: 500
  });
  preGrid.layout(data);
  // 由于 GPU 计算是异步的，所以两种 fruchterman 使用方式。
  // 1. fruchterman.layout 后调用渲染
  // 2. 实例化 FruchtermanLayout 时将渲染语句传入 onLayoutEnd 回调函数
  it('return correct default config', () => {
    const fruchterman = new Layouts['fruchterman']();
    expect(fruchterman.getDefaultCfg()).toEqual({
      maxIteration: 1000,
      gravity: 10,
      speed: 1,
      clustering: false,
      clusterGravity: 10,
    });
    fruchterman.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('new graph with fruchterman layout, with configurations', () => {
    const fruchterman = new Layouts['fruchterman']({
      center: [100, 100],
      maxIteration: 5000
    });
    fruchterman.layout(data);

    expect(data.nodes[0].x).not.toEqual(undefined);
    expect(data.nodes[0].y).not.toEqual(undefined);
    expect(data.nodes[1].x).not.toEqual(undefined);
    expect(data.nodes[1].y).not.toEqual(undefined);
  });
  it('fruchterman layout with no node', () => {
    const fruchterman = new Layouts['fruchterman']({
      center: [100, 100],
      maxIteration: 5000
    });
    fruchterman.layout({
      nodes: []
    });
  });
  it('fruchterman layout with one node', () => {
    const fruchterman = new Layouts['fruchterman']({
      width: 500,
      height: 500
    });
    const data1 = {
      nodes: [
        {
          id: 'node',
        }
      ]
    }
    fruchterman.layout(data1);
    const nodeModel: any = data1.nodes[0];
    expect(nodeModel.x).toEqual(250);
    expect(nodeModel.y).toEqual(250);
  });
  it('fruchterman layout with clustering and no clusterGravity', () => {
    const colors = ['#f00', '#0f0', '#00f', '#ff0'];
    data.nodes.forEach((node) => {
      node.size = 10;
      node.cluster = Math.ceil((Math.random() / 3) * 10);
      node.style = {
        fill: colors[node.cluster],
      };
    });

    const fruchterman = new Layouts['fruchterman']({
      clustering: true,
      maxIteration: 3000,
      clusterGravity: null,
    });
    fruchterman.layout(data);
    
    const node0 = data.nodes[0];
    expect(node0.x).not.toEqual(NaN);
    expect(node0.y).not.toEqual(NaN);
  });
  it('fruchterman layout with overlapped nodes and loop edge', () => {
    const fruchterman = new Layouts['fruchterman']({
      clustering: true,
      maxIteration: 5000,
      clusterGravity: null,
    });
    const tmpData = {
      nodes: [
        {
          id: 'node0',
          x: 100,
          y: 100,
        },
        {
          id: 'node1',
          x: 100,
          y: 100,
        },
        {
          id: 'node3',
          x: 150,
          y: 120,
        },
      ],
      edges: [
        {
          source: 'node3',
          target: 'node3',
        },
      ],
    };
    fruchterman.layout(tmpData);
    const node0 = tmpData.nodes[0];
    const node1 = tmpData.nodes[1];
    expect(node0.x).not.toEqual(node1.x);
    expect(node0.y).not.toEqual(node1.y);
  });
  it('update fructherman layout configurations', () => {
    const fruchterman = new Layouts['fruchterman']();
    fruchterman.layout(data);
    
    fruchterman.updateCfg({
      center: [100, 100],
      gravity: 50,
    });
    expect(data.nodes[0].x).not.toEqual(undefined);
    expect(data.nodes[0].y).not.toEqual(undefined);
    expect(data.nodes[1].x).not.toEqual(undefined);
    expect(data.nodes[1].y).not.toEqual(undefined);
  });
})