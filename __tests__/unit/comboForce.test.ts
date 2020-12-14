import { Layout } from '../../src'
import { isFunction } from '../../src/util';
import dataset from '../data';
const data = dataset.comboData;
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


describe('#ComboForceLayout', () => {
  it('return correct default config', () => {
    const comboForce = new Layout.ComboForceLayout();
    expect(comboForce.getDefaultCfg()).toEqual({
      maxIteration: 100,
      center: [0, 0],
      gravity: 10,
      speed: 1,
      comboGravity: 30,
      preventOverlap: false,
      preventComboOverlap: true,
      preventNodeOverlap: true,
      nodeSpacing: undefined,
      collideStrength: undefined,
      nodeCollideStrength: 0.5,
      comboCollideStrength: 0.5,
      comboSpacing: 20,
      comboPadding: 10,
      edgeStrength: 0.6,
      nodeStrength: 30,
      linkDistance: 10,
    });
    comboForce.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('layout without node', () => {
    const testData = {};
    const comboForce = new Layout.ComboForceLayout();
    comboForce.layout(testData);
  });
  it('layout with one node', () => {
    const testData = {
      nodes: [
        {
          id: 'node',
          x: 0,
          y: 0,
        },
      ],
    };
    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250]
    });
    comboForce.layout(testData);
    expect(testData.nodes[0].x).toBe(250);
    expect(testData.nodes[0].y).toBe(250);
  });
});

describe('combo force layout', () => {
  it('combo force layout with default configs, emit afterlayout', () => {
    const node = data.nodes[0];
    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250]
    });
    comboForce.layout(data);

    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
    expect(node.x).not.toEqual(NaN);
    expect(node.y).not.toEqual(NaN);
  });

  it('force with fixed edgeStrength, nodeStrength, preventOverlap', () => {
    const node = data.nodes[0];
    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250],
      linkDistance: 140,
      edgeStrength: 0.5,
      nodeStrength: 30,
      preventOverlap: true,
      maxIteration: 1
    });
    comboForce.layout(data);

    expect(node.x).not.toEqual(undefined);
    expect(node.y).not.toEqual(undefined);
    expect(node.x).not.toEqual(NaN);
    expect(node.y).not.toEqual(NaN);
  });

  it('preventOverlap with number nodeSpacing', () => {
    const nodeSpacing = 10;
    const comboSpacing = 20;
    const nodeSize = 10;

    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250],
      preventOverlap: true,
      nodeSpacing,
      comboSpacing,
    });
    comboForce.layout(data);
    
    const node0 = data.nodes[0];
    const node1 = data.nodes[1];
    const dist = Math.sqrt(
      (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y),
    );
    expect(dist >= nodeSize / 2 + nodeSpacing).toEqual(true);
  });

  it('preventOverlap with function nodeSpacing and array node size', () => {
    const nodeSpacing = (d) => {
      return d.size[0] / 2;
    };
    data.nodes.forEach((node) => {
      const randomWidth = 10 + Math.random() * 20;
      const randomHeight = 5 + Math.random() * 5;
      node.size = [randomWidth, randomHeight];
      node.type = 'rect';
    });


    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250],
      preventOverlap: true,
      nodeSpacing,
      maxIteration: 300,
    });
    comboForce.layout(data);

    const node0 = data.nodes[0];
    const node1 = data.nodes[1];
    const dist = Math.sqrt(
      (node0.x - node1.x) * (node0.x - node1.x) + (node0.y - node1.y) * (node0.y - node1.y),
    );
    const mindist =
      node0.size[0] / 2 + node1.size[1] / 2 + nodeSpacing(node0) + nodeSpacing(node1);
    expect(dist >= mindist).toEqual(true);
  });

  it('force re-execute, isTicking', () => {
    const comboForce = new Layout.ComboForceLayout({
      center: [250, 250],
    });
    comboForce.layout(data)
    const node0 = data.nodes[0];
    expect(node0.x).not.toEqual(NaN);
    expect(node0.y).not.toEqual(NaN);
  });
});

describe('undefined configurations and update layout', () => {
  it('undefined configurations and update layout', () => {
    data.nodes.push({
      id: 'newnode',
    });
    data.combos.push({
      id: 'newcombo',
    });

    const comboForce = new Layout.ComboForceLayout({
      center: [500, 500],
      preventComboOverlap: false,
      preventNodeOverlap: false,
      collideStrength: 1,
      nodeCollideStrength: undefined,
      nodeSize: [10, 10],
      comboSpacing: null,
      comboPadding: [20, 20, 10, 10],
      linkDistance: null,
      edgeStrength: null,
      nodeStrength: null,
      comboGravity: null,
    });
    comboForce.layout(data)

    expect(isFunction(comboForce.linkDistance)).toEqual(true);
    expect((comboForce.linkDistance as ((d?: unknown) => number))()).toEqual(10);
    expect(comboForce.preventOverlap).toEqual(false);
    comboForce.updateCfg({
      linkDistance: 100,
      preventOverlap: true,
      alphaDecay: 0.8,
      nodeSize: 10,
      comboPadding: null,
    })
    comboForce.layout(data)
    expect(isFunction(comboForce.linkDistance)).toEqual(true);
    expect((comboForce.linkDistance as ((d?: unknown) => number))()).toEqual(100);
    expect(comboForce.preventOverlap).toEqual(true);
  });
})