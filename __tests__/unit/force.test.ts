import { Layouts } from '../../src'
import dataset from '../data';
import * as d3Force from 'd3-force';
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
// graph.data(data);
// graph.render()



describe('#ForceLayout', () => {
  it('force layout with default configs, test emit afterlayout', () => {
    const force = new Layouts['force']({
      alphaDecay: 0.2,
      nodeSize: 10
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('force layout with tick and onLayoutEnd', () => {
    const node = data.nodes[0];
    const edge = data.edges[0];
    let x: number;
    let y: number;
    let count = 0;
    let isEnd = false;

    const force = new Layouts['force']({
      nodeSize: 10,
      tick() {
        count++;
        expect(node.x !== x);
        expect(node.y !== y);
        expect(edge.x).toEqual(undefined);
        expect(edge.y).toEqual(undefined);
        x = node.x;
        y = node.y;
      },
      onLayoutEnd() {
        expect(node.x);
        expect(node.y);
        expect(edge.x).toEqual(undefined);
        expect(edge.y).toEqual(undefined);
        isEnd = true;
      },
    });
    force.layout(data);
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('force with fixed edgeStrength, nodeStrength, preventOverlap', () => {
    const node = data.nodes[0];
    const edge = data.edges[0];
    let x: number;
    let y: number;
    let count = 0;
    let isEnd = false;

    const force = new Layouts['force']({
      nodeSize: 10,
      linkDistance: 140,
      edgeStrength: 0.5,
      nodeStrength: -30,
      preventOverlap: true,
      tick() {
        count++;
        expect(node.x !== x);
        expect(node.y !== y);
        expect(edge.x).toEqual(undefined);
        expect(edge.y).toEqual(undefined);
        x = node.x;
        y = node.y;
      },
      onLayoutEnd() {
        isEnd = true;
        expect(node.x);
        expect(node.y);
        expect(edge.x).toEqual(undefined);
        expect(edge.y).toEqual(undefined);
      },
    });
    force.layout(data);
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('preventOverlap with number nodeSpacing', () => {
    let isEnd = false;
    const nodeSpacing = 10;
    const nodeSize = 10;

    const force = new Layouts['force']({
      nodeSize,
      preventOverlap: true,
      nodeSpacing,
      onLayoutEnd() {
        isEnd = true;
      },
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);

  });

  it('preventOverlap with function nodeSpacing and array node size', () => {
    let isEnd = false;
    const nodeSpacing = (d) => {
      return d.size[0] / 2;
    };
    data.nodes.forEach((node) => {
      const randomWidth = 10 + Math.random() * 20;
      const randomHeight = 5 + Math.random() * 5;
      node.size = [randomWidth, randomHeight];
      node.type = 'rect';
    });

    const force = new Layouts['force']({
      preventOverlap: true,
      nodeSpacing,
      onLayoutEnd() {
        isEnd = true
      }
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('preventOverlap with function nodeSpacing and function nodeSize', () => {
    let isEnd = false;
    const nodeSpacing = (d) => {
      return d.dsize[0] / 3;
    };
    const nodeSize = (d) => {
      return d.dsize[0];
    };
    data.nodes.forEach((node) => {
      node.dsize = [30, 15];
      node.type = 'rect';
    });

    const force = new Layouts['force']({
      preventOverlap: true,
      nodeSpacing,
      nodeSize,
      alphaDecay: 0.3,
      onLayoutEnd() {
        isEnd = true;
      },
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('preventOverlap with function nodeSpacing and array nodeSize', () => {
    let isEnd = false;
    const nodeSize = [30, 18];

    const force = new Layouts['force']({
      preventOverlap: true,
      nodeSize,
      alphaDecay: 0.3,
      onLayoutEnd() {
        isEnd = true;
      },
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('preventOverlap with function nodeSpacing and number nodeSize', () => {
    let isEnd = false;
    const nodeSize = 30;

    const force = new Layouts['force']({
      preventOverlap: true,
      nodeSize,
      onLayoutEnd() {
        isEnd = true;
      },
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });

  it('force re-execute, isTicking', () => {

    const force = new Layouts['force']();
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });
});

describe('update and simulation', () => {
  it('force update layout', () => {

    const force = new Layouts['force']();
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
    expect(force.linkDistance).toEqual(50); // default value
    expect(force.preventOverlap).toEqual(false);

    force.updateCfg({
      linkDistance: 100,
      preventOverlap: true,
      alphaDecay: 0.8,
    });
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
    
  });
  it('assign simualtion', () => {
    const center = [300, 300];
    const nodeForce = d3Force.forceManyBody();
    const forceSimulation = d3Force
      .forceSimulation()
      .nodes((data as any).nodes)
      .force('center', d3Force.forceCenter(center[0], center[1]))
      .force('charge', nodeForce)
      .alpha(0.3)
      .alphaDecay(0.028)
      .alphaMin(0.1);

    const force = new Layouts['force']({
      forceSimulation,
      preventOverlap: true,
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });
  it('force clustering', () => {
    data.nodes.forEach(node => {
      node.cluster = `${Math.ceil(Math.random() * 4)}`
    })
    const force = new Layouts['force']({
      preventOverlap: true,
      clustering: true,
      center: [200, 400]
    });
    force.layout(data);
    const node = data.nodes[0];
    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
  });
})