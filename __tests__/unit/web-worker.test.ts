import { Layout } from '../../src'
import { Node, Edge } from '../../src/layout/types'
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

describe('#WebWorker', () => {
  it('return correct default config', () => {
  //   const fruchterman = new Layout.FruchtermanLayout({
  //     workerEnabled: true
  //   });
  //   expect(fruchterman.getDefaultCfg()).toEqual({
  //     maxIteration: 1000,
  //     gravity: 10,
  //     speed: 1,
  //     clustering: false,
  //     clusterGravity: 10,
  //   });
  //   fruchterman.layout(data);
  //   expect((data.nodes[0] as any).x).not.toBe(undefined);
  //   expect((data.nodes[0] as any).y).not.toBe(undefined);
  // });

  // it('change layout', function (done) {
  //   const node = data.nodes[0];
  //   const fruchterman = new Layout.FruchtermanLayout({
  //     workerEnabled: true
  //   });
  //   fruchterman.layout(data);

  //   // graph.data(data);
  //   // 下面的 graph.updateLayout又会触发一次afterLayout，为了避免这里的 event handler重复执行，用了 graph.once
  //   // graph.once('afterlayout', () => {
  //   //   expect(mathEqual(node.x, 500)).toEqual(true);
  //   //   expect(mathEqual(node.y, 250)).toEqual(true);
  //   //   callback();
  //   // });
  //   // graph.render();
  //   setTimeout(() => {
  //     callback();
  //   }, 1000);

  //   function callback() {
  //     let count = 0;
  //     let ended = false;

  //     fruchterman.updateCfg({
  //       gravity: 20
  //     })

  //     const gForce = new Layout.GForce({
  //       workerEnabled: true
  //     });
  //     gForce.layout(data);

  //     // 只执行一次
  //     // graph.once('afterlayout', () => {
  //     //   expect(node.x).not.toEqual(undefined);
  //     //   expect(node.y).not.toEqual(undefined);
  //     //   expect(count >= 1).toEqual(true);
  //     //   expect(ended).toEqual(true);
  //     //   graph.destroy();
  //     //   done();
  //     // });
  //     // graph.updateLayout({
  //     //   type: 'force',
  //     //   onTick() {
  //     //     count++;
  //     //     expect(node.x).not.toEqual(undefined);
  //     //     expect(node.y).not.toEqual(undefined);
  //     //   },
  //     //   onLayoutEnd() {
  //     //     ended = true;
  //     //   },
  //     //   // use web worker to layout
  //     //   workerEnabled: true,
  //     // });
  //   }
  });
})