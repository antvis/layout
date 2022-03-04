import { Layouts } from '../../src';
import { mathEqual } from '../util';
import dataset, { TestNode } from '../data';
const data = dataset.data;
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);
const graph = new G6.Graph({
  container: div,
  width: 500,
  height: 500,
  modes: {
    default: ['zoom-canvas', 'drag-node', 'drag-canvas']
  }
});
data.nodes.forEach(node => {
  node.label = node.id;
});
graph.data(data);
graph.render();

describe('#ConcentricLayout', () => {
  it('return correct default config', () => {
    const concentric = new Layouts['concentric']();
    expect(concentric.getDefaultCfg()).toEqual({
      nodeSize: 30,
      minNodeSpacing: 10,
      nodeSpacing: 10,
      preventOverlap: false,
      sweep: undefined,
      equidistant: false,
      startAngle: (3 / 2) * Math.PI,
      clockwise: true,
      maxLevelDiff: undefined,
      sortBy: 'degree'
    });
    concentric.layout(data);
    expect((data.nodes[0] as TestNode).x).not.toBe(undefined);
    expect((data.nodes[0] as TestNode).y).not.toBe(undefined);
  });
  it('concentric with no node', () => {
    const concentric = new Layouts['concentric']();
    concentric.layout({ nodes: [] });
  });

  it('concentric with one node', () => {
    const concentric = new Layouts['concentric']({
      center: [150, 50]
    });
    const data1 = {
      nodes: [
        {
          id: 'node',
          x: 100,
          y: 100
        }
      ]
    };
    concentric.layout(data1);
    expect(data1.nodes[0].x).toEqual(150);
    expect(data1.nodes[0].y).toEqual(50);
  });

  it('concentric with array nodeSize', () => {
    const width = 500;
    const height = 500;
    const concentric = new Layouts['concentric']({
      nodeSize: [10, 20],
      width,
      height
    });
    concentric.layout(data);
    const node = data.nodes[2];
    expect(mathEqual(node.x, width / 2)).toEqual(true);
    expect(mathEqual(node.y, height / 2)).toEqual(true);
  });

  it('concentric with array size in node data, sortBy in data undefined', () => {
    const width = 500;
    const height = 500;
    data.nodes.forEach(node => {
      node.size = [10, 20];
      node.labelCfg = {
        style: {
          fontSize: 5
        }
      };
    });
    const concentric = new Layouts['concentric']({
      sortBy: 'ttt',
      width,
      height
    });
    concentric.layout(data);
    const node = data.nodes[2];
    expect(mathEqual(node.x, width / 2)).toEqual(true);
    expect(mathEqual(node.y, height / 2)).toEqual(true);
  });

  it('concentric preventOverlap', () => {
    const width = 500;
    const height = 500;
    const concentric = new Layouts['concentric']({
      width,
      height,
      preventOverlap: true
    });
    concentric.layout(data);
    const node = data.nodes[2];
    expect(mathEqual(node.x, width / 2)).toEqual(true);
    expect(mathEqual(node.y, height / 2)).not.toEqual(true);
  });

  it('concentric equidistant', () => {
    const width = 500;
    const height = 500;
    const concentric = new Layouts['concentric']({
      width,
      height,
      equidistant: true
    });
    concentric.layout(data);
    const node = data.nodes[2];
    expect(mathEqual(node.x, width / 2)).toEqual(true);
    expect(mathEqual(node.y, height / 2)).toEqual(true);
  });

  it('instantiate layout', () => {
    const concentric = new Layouts['concentric']({
      center: [250, 250],
      sweep: 1
    });
    concentric.layout(data);

    expect(data.nodes[0].x).not.toEqual(undefined);
    expect(data.nodes[0].y).not.toEqual(undefined);
    expect(data.nodes[1].x).not.toEqual(undefined);
    expect(data.nodes[1].y).not.toEqual(undefined);
  });
});
