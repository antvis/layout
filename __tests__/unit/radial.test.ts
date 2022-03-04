import { Layouts } from '../../src';
import { mathEqual } from '../util';
import MDS from '../../src/layout/radial/mds';
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

const data: any = {
  nodes: [
    { id: '0', label: '0' },
    { id: '1', label: '1' },
    { id: '2', label: '2' },
    { id: '3', label: '3' },
    { id: '4', label: '4' },
    { id: '5', label: '5' }
  ],
  edges: [
    {
      source: '0',
      target: '1'
    },
    {
      source: '0',
      target: '2'
    },
    {
      source: '3',
      target: '4'
    }
  ]
};

describe('#RadialLayout', () => {
  it('return correct default config', () => {
    const radial = new Layouts['radial']();
    expect(radial.getDefaultCfg()).toEqual({
      maxIteration: 1000,
      focusNode: null,
      unitRadius: null,
      linkDistance: 50,
      preventOverlap: false,
      nodeSize: undefined,
      nodeSpacing: undefined,
      strictRadial: true,
      maxPreventOverlapIteration: 200,
      sortBy: undefined,
      sortStrength: 10
    });
    radial.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('new graph with radial layout, without configurations', () => {
    const radial = new Layouts['radial']({
      width: 500,
      height: 600
    });
    radial.layout(data);
    const focusNode = data.nodes[0];
    expect(mathEqual(focusNode.x, 250)).toEqual(true);
    expect(mathEqual(focusNode.y, 300)).toEqual(true);
  });
  it('new graph with radial layout, with configurations', () => {
    const unitRadius = 100;
    const fnIndex = 1;
    const focusNode = data.nodes[fnIndex];
    const center: any = [250, 250];

    const radial = new Layouts['radial']({
      width: 500,
      height: 600,
      center,
      maxIteration: 100,
      focusNode,
      unitRadius,
      linkDistance: 100
    });
    radial.layout(data);

    const oneStepNode = data.nodes[0];
    const DistFnToOneStepNode =
      (oneStepNode.x - focusNode.x) * (oneStepNode.x - focusNode.x) +
      (oneStepNode.y - focusNode.y) * (oneStepNode.y - focusNode.y);
    const twoStepNode = data.nodes[2];
    const DistFnToTwoStepNode =
      (twoStepNode.x - focusNode.x) * (twoStepNode.x - focusNode.x) +
      (twoStepNode.y - focusNode.y) * (twoStepNode.y - focusNode.y);
    const descreteNode = data.nodes[5];
    const DistFnToDescreteNode =
      (descreteNode.x - focusNode.x) * (descreteNode.x - focusNode.x) +
      (descreteNode.y - focusNode.y) * (descreteNode.y - focusNode.y);
    const descreteComNode1 = data.nodes[3];
    const DistFnToDescreteComNode1 =
      (descreteComNode1.x - focusNode.x) * (descreteComNode1.x - focusNode.x) +
      (descreteComNode1.y - focusNode.y) * (descreteComNode1.y - focusNode.y);
    const descreteComNode2 = data.nodes[4];
    const DistFnToDescreteComNode2 =
      (descreteComNode2.x - focusNode.x) * (descreteComNode2.x - focusNode.x) +
      (descreteComNode2.y - focusNode.y) * (descreteComNode2.y - focusNode.y);
    expect(mathEqual(DistFnToOneStepNode, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToTwoStepNode, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteNode, 9 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteComNode1, 9 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteComNode2, 16 * unitRadius * unitRadius)).toEqual(true);
  });

  it('radial layout with no node', () => {
    const radial = new Layouts['radial']();
    radial.layout({
      nodes: []
    });
  });

  it('radial layout with one node', () => {
    const radial = new Layouts['radial']({
      width: 500,
      height: 600
    });
    const data1: any = {
      nodes: [
        {
          id: 'node'
        }
      ]
    };
    radial.layout(data1);
    const nodeModel = data1.nodes[0];
    expect(nodeModel.x).toEqual(250);
    expect(nodeModel.y).toEqual(300);
  });

  it('focus on descrete node, prevent overlapping', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5]; //data.nodes[5];//'5';
    const nodeSize = 40;

    const radial = new Layouts['radial']({
      focusNode: '5',
      unitRadius,
      preventOverlap: true,
      maxPreventOverlapIteration: 800
    });
    radial.layout(data);

    const descreteCom1Node1 = data.nodes[0];
    const DistFnToDescreteCom1Node1 =
      (descreteCom1Node1.x - focusNode.x) * (descreteCom1Node1.x - focusNode.x) +
      (descreteCom1Node1.y - focusNode.y) * (descreteCom1Node1.y - focusNode.y);
    const descreteCom1Node2 = data.nodes[1];
    const DistFnToDescreteCom1Node2 =
      (descreteCom1Node2.x - focusNode.x) * (descreteCom1Node2.x - focusNode.x) +
      (descreteCom1Node2.y - focusNode.y) * (descreteCom1Node2.y - focusNode.y);
    const descreteCom2Node1 = data.nodes[3];
    const DistFnToDescreteCom2Node1 =
      (descreteCom2Node1.x - focusNode.x) * (descreteCom2Node1.x - focusNode.x) +
      (descreteCom2Node1.y - focusNode.y) * (descreteCom2Node1.y - focusNode.y);
    const descreteCom2Node2 = data.nodes[4];
    const DistFnToDescreteCom2Node2 =
      (descreteCom2Node2.x - focusNode.x) * (descreteCom2Node2.x - focusNode.x) +
      (descreteCom2Node2.y - focusNode.y) * (descreteCom2Node2.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteCom1Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom1Node2, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node2, 4 * unitRadius * unitRadius)).toEqual(true);

    // non overlap
    const overlapDist1 =
      (descreteCom1Node1.x - descreteCom2Node1.x) * (descreteCom1Node1.x - descreteCom2Node1.x) +
      (descreteCom1Node1.y - descreteCom2Node1.y) * (descreteCom1Node1.y - descreteCom2Node1.y);
    expect(overlapDist1 > nodeSize + nodeSize).toEqual(true);
  });

  it('focus on descrete node, prevent overlapping with number nodeSpacing', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    const nodeSize = 40;

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      preventOverlap: true,
      nodeSpacing: 10,
      nodeSize,
      maxPreventOverlapIteration: 800
    });
    radial.layout(data);

    const descreteCom1Node1 = data.nodes[0];
    const DistFnToDescreteCom1Node1 =
      (descreteCom1Node1.x - focusNode.x) * (descreteCom1Node1.x - focusNode.x) +
      (descreteCom1Node1.y - focusNode.y) * (descreteCom1Node1.y - focusNode.y);
    const descreteCom1Node2 = data.nodes[1];
    const DistFnToDescreteCom1Node2 =
      (descreteCom1Node2.x - focusNode.x) * (descreteCom1Node2.x - focusNode.x) +
      (descreteCom1Node2.y - focusNode.y) * (descreteCom1Node2.y - focusNode.y);
    const descreteCom2Node1 = data.nodes[3];
    const DistFnToDescreteCom2Node1 =
      (descreteCom2Node1.x - focusNode.x) * (descreteCom2Node1.x - focusNode.x) +
      (descreteCom2Node1.y - focusNode.y) * (descreteCom2Node1.y - focusNode.y);
    const descreteCom2Node2 = data.nodes[4];
    const DistFnToDescreteCom2Node2 =
      (descreteCom2Node2.x - focusNode.x) * (descreteCom2Node2.x - focusNode.x) +
      (descreteCom2Node2.y - focusNode.y) * (descreteCom2Node2.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteCom1Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom1Node2, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node2, 4 * unitRadius * unitRadius)).toEqual(true);

    // non overlap
    const overlapDist1 =
      (descreteCom1Node1.x - descreteCom2Node1.x) * (descreteCom1Node1.x - descreteCom2Node1.x) +
      (descreteCom1Node1.y - descreteCom2Node1.y) * (descreteCom1Node1.y - descreteCom2Node1.y);
    expect(overlapDist1 > nodeSize * nodeSize).toEqual(true);
  });

  it('focus on descrete node, prevent overlapping with function nodeSpacing', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    const nodeSize = 40;

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      preventOverlap: true,
      nodeSpacing: (d?: any) => {
        return 5;
      },
      nodeSize: [nodeSize, nodeSize]
    });
    radial.layout(data);

    const descreteCom1Node1 = data.nodes[0];
    const DistFnToDescreteCom1Node1 =
      (descreteCom1Node1.x - focusNode.x) * (descreteCom1Node1.x - focusNode.x) +
      (descreteCom1Node1.y - focusNode.y) * (descreteCom1Node1.y - focusNode.y);
    const descreteCom1Node2 = data.nodes[1];
    const DistFnToDescreteCom1Node2 =
      (descreteCom1Node2.x - focusNode.x) * (descreteCom1Node2.x - focusNode.x) +
      (descreteCom1Node2.y - focusNode.y) * (descreteCom1Node2.y - focusNode.y);
    const descreteCom2Node1 = data.nodes[3];
    const DistFnToDescreteCom2Node1 =
      (descreteCom2Node1.x - focusNode.x) * (descreteCom2Node1.x - focusNode.x) +
      (descreteCom2Node1.y - focusNode.y) * (descreteCom2Node1.y - focusNode.y);
    const descreteCom2Node2 = data.nodes[4];
    const DistFnToDescreteCom2Node2 =
      (descreteCom2Node2.x - focusNode.x) * (descreteCom2Node2.x - focusNode.x) +
      (descreteCom2Node2.y - focusNode.y) * (descreteCom2Node2.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteCom1Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom1Node2, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node2, 4 * unitRadius * unitRadius)).toEqual(true);

    // non overlap
    const overlapDist1 =
      (descreteCom1Node1.x - descreteCom2Node1.x) * (descreteCom1Node1.x - descreteCom2Node1.x) +
      (descreteCom1Node1.y - descreteCom2Node1.y) * (descreteCom1Node1.y - descreteCom2Node1.y);
    expect(overlapDist1 > nodeSize * nodeSize).toEqual(true);
  });

  it('preventOverlap, node size is array', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    const nodeSize = [40, 20];
    data.nodes.forEach((node: any) => {
      node.size = nodeSize;
    });

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      preventOverlap: true
    });
    radial.layout(data);

    const descreteCom1Node1 = data.nodes[0];
    const DistFnToDescreteCom1Node1 =
      (descreteCom1Node1.x - focusNode.x) * (descreteCom1Node1.x - focusNode.x) +
      (descreteCom1Node1.y - focusNode.y) * (descreteCom1Node1.y - focusNode.y);
    const descreteCom1Node2 = data.nodes[1];
    const DistFnToDescreteCom1Node2 =
      (descreteCom1Node2.x - focusNode.x) * (descreteCom1Node2.x - focusNode.x) +
      (descreteCom1Node2.y - focusNode.y) * (descreteCom1Node2.y - focusNode.y);
    const descreteCom2Node1 = data.nodes[3];
    const DistFnToDescreteCom2Node1 =
      (descreteCom2Node1.x - focusNode.x) * (descreteCom2Node1.x - focusNode.x) +
      (descreteCom2Node1.y - focusNode.y) * (descreteCom2Node1.y - focusNode.y);
    const descreteCom2Node2 = data.nodes[4];
    const DistFnToDescreteCom2Node2 =
      (descreteCom2Node2.x - focusNode.x) * (descreteCom2Node2.x - focusNode.x) +
      (descreteCom2Node2.y - focusNode.y) * (descreteCom2Node2.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteCom1Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom1Node2, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node2, 4 * unitRadius * unitRadius)).toEqual(true);

    // non overlap
    const overlapDist1 =
      (descreteCom1Node1.x - descreteCom2Node1.x) * (descreteCom1Node1.x - descreteCom2Node1.x) +
      (descreteCom1Node1.y - descreteCom2Node1.y) * (descreteCom1Node1.y - descreteCom2Node1.y);
    expect(overlapDist1 > nodeSize[0] * nodeSize[0]).toEqual(true);
    expect(overlapDist1 > nodeSize[1] * nodeSize[1]).toEqual(true);
  });

  it('preventOverlap, no nodeSize, no data size', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    data.nodes.forEach((node: any) => {
      node.size = undefined;
    });

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      preventOverlap: true
    });
    radial.layout(data);

    const descreteCom1Node1 = data.nodes[0];
    const DistFnToDescreteCom1Node1 =
      (descreteCom1Node1.x - focusNode.x) * (descreteCom1Node1.x - focusNode.x) +
      (descreteCom1Node1.y - focusNode.y) * (descreteCom1Node1.y - focusNode.y);
    const descreteCom1Node2 = data.nodes[1];
    const DistFnToDescreteCom1Node2 =
      (descreteCom1Node2.x - focusNode.x) * (descreteCom1Node2.x - focusNode.x) +
      (descreteCom1Node2.y - focusNode.y) * (descreteCom1Node2.y - focusNode.y);
    const descreteCom2Node1 = data.nodes[3];
    const DistFnToDescreteCom2Node1 =
      (descreteCom2Node1.x - focusNode.x) * (descreteCom2Node1.x - focusNode.x) +
      (descreteCom2Node1.y - focusNode.y) * (descreteCom2Node1.y - focusNode.y);
    const descreteCom2Node2 = data.nodes[4];
    const DistFnToDescreteCom2Node2 =
      (descreteCom2Node2.x - focusNode.x) * (descreteCom2Node2.x - focusNode.x) +
      (descreteCom2Node2.y - focusNode.y) * (descreteCom2Node2.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteCom1Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom1Node2, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node1, unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteCom2Node2, 4 * unitRadius * unitRadius)).toEqual(true);

    // non overlap
    const overlapDist1 =
      (descreteCom1Node1.x - descreteCom2Node1.x) * (descreteCom1Node1.x - descreteCom2Node1.x) +
      (descreteCom1Node1.y - descreteCom2Node1.y) * (descreteCom1Node1.y - descreteCom2Node1.y);
    expect(overlapDist1 > 100).toEqual(true);
    expect(overlapDist1 > 100).toEqual(true);
  });

  it('sort by data', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    const nodeSize = 40;

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      sortBy: 'data',
      preventOverlap: true,
      nodeSize,
      maxPreventOverlapIteration: 1200
    });
    radial.layout(data);

    const node1 = data.nodes[1];
    const node2 = data.nodes[2];
    const node4 = data.nodes[4];
    const overlapDist1 = (node1.x - node2.x) * (node1.x - node2.x) + (node1.y - node2.y) * (node1.y - node2.y);
    const overlapDist2 = (node1.x - node4.x) * (node1.x - node4.x) + (node1.y - node4.y) * (node1.y - node4.y);
    expect(overlapDist1 < overlapDist2).toEqual(true);
  });

  it('sort by sortProperty', () => {
    const unitRadius = 100;
    const focusNode = data.nodes[5];
    const nodeSize = 40;

    const radial = new Layouts['radial']({
      focusNode,
      unitRadius,
      sortBy: 'sortProperty',
      preventOverlap: true,
      maxPreventOverlapIteration: 1200,
      nodeSize
    });
    data.nodes.forEach((node: any, i: number) => {
      node['sortProperty'] = i % 2;
    });
    radial.layout(data);

    const node1 = data.nodes[1];
    const node2 = data.nodes[2];
    const node4 = data.nodes[4];
    const overlapDist1 = (node1.x - node2.x) * (node1.x - node2.x) + (node1.y - node2.y) * (node1.y - node2.y);
    const overlapDist2 = (node2.x - node4.x) * (node2.x - node4.x) + (node2.y - node4.y) * (node2.y - node4.y);
    expect(overlapDist1 > overlapDist2).toEqual(true);
  });
});

describe('radial layout', () => {
  it('new graph with radial layout, with focusnode id', () => {
    const unitRadius = 100;
    const focusNodeId = '3';

    const radial = new Layouts['radial']({
      focusNode: focusNodeId,
      unitRadius,
      nodeSize: 30
    });
    radial.layout(data);

    let focusNode: any;
    data.nodes.forEach((node: any) => {
      if (node.id === focusNodeId) focusNode = node;
    });

    const descreteNode = data.nodes[5];
    const DistFnToDescreteNode =
      (descreteNode.x - focusNode.x) * (descreteNode.x - focusNode.x) +
      (descreteNode.y - focusNode.y) * (descreteNode.y - focusNode.y);
    const descreteComNode1 = data.nodes[0];
    const DistFnToDescreteComNode1 =
      (descreteComNode1.x - focusNode.x) * (descreteComNode1.x - focusNode.x) +
      (descreteComNode1.y - focusNode.y) * (descreteComNode1.y - focusNode.y);
    const descreteComNode2 = data.nodes[1];
    const DistFnToDescreteComNode2 =
      (descreteComNode2.x - focusNode.x) * (descreteComNode2.x - focusNode.x) +
      (descreteComNode2.y - focusNode.y) * (descreteComNode2.y - focusNode.y);
    const descreteComNode3 = data.nodes[2];
    const DistFnToDescreteComNode3 =
      (descreteComNode3.x - focusNode.x) * (descreteComNode3.x - focusNode.x) +
      (descreteComNode3.y - focusNode.y) * (descreteComNode3.y - focusNode.y);
    expect(mathEqual(DistFnToDescreteNode, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteComNode1, 4 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteComNode2, 9 * unitRadius * unitRadius)).toEqual(true);
    expect(mathEqual(DistFnToDescreteComNode3, 9 * unitRadius * unitRadius)).toEqual(true);
  });

  it('focus node does not exist', () => {
    const unitRadius = 100;
    const focusNodeId = 'test'; // does not exist in data

    const radial = new Layouts['radial']({
      focusNode: focusNodeId,
      unitRadius,
      nodeSize: 30
    });
    radial.layout(data);
    expect((radial.focusNode as any).id).toEqual('0');
  });

  it('focus node undefined', () => {
    const unitRadius = 100;
    const radial = new Layouts['radial']({
      focusNode: undefined,
      unitRadius,
      nodeSize: 30
    });
    radial.layout(data);
    expect((radial.focusNode as any).id).toEqual('0');
  });

  it('instantiate layout', () => {
    const unitRadius = 50;
    const radial = new Layouts['radial']({
      unitRadius,
      preventOverlap: true,
      maxPreventOverlapIteration: null,
      sortBy: 'sortProperty',
      center: [250, 250]
    });
    data.nodes.forEach((node: any, i: number) => {
      node['sortProperty'] = '' + (i % 3);
    });
    radial.layout(data);
    const focusNode = data.nodes[0];

    const descreteNode = data.nodes[5];
    const DistFnToDescreteNode =
      (descreteNode.x - focusNode.x) * (descreteNode.x - focusNode.x) +
      (descreteNode.y - focusNode.y) * (descreteNode.y - focusNode.y);
    const descreteComNode1 = data.nodes[1];
    const DistFnToDescreteComNode1 =
      (descreteComNode1.x - focusNode.x) * (descreteComNode1.x - focusNode.x) +
      (descreteComNode1.y - focusNode.y) * (descreteComNode1.y - focusNode.y);
    const descreteComNode2 = data.nodes[4];
    const DistFnToDescreteComNode2 =
      (descreteComNode2.x - focusNode.x) * (descreteComNode2.x - focusNode.x) +
      (descreteComNode2.y - focusNode.y) * (descreteComNode2.y - focusNode.y);
    const descreteComNode3 = data.nodes[2];
    const DistFnToDescreteComNode3 =
      (descreteComNode3.x - focusNode.x) * (descreteComNode3.x - focusNode.x) +
      (descreteComNode3.y - focusNode.y) * (descreteComNode3.y - focusNode.y);
    expect(mathEqual(Math.sqrt(DistFnToDescreteNode), 2 * unitRadius)).toEqual(true);
    expect(mathEqual(Math.sqrt(DistFnToDescreteComNode1), unitRadius)).toEqual(true);
    expect(mathEqual(Math.sqrt(DistFnToDescreteComNode2), 3 * unitRadius)).toEqual(true);
    expect(mathEqual(Math.sqrt(DistFnToDescreteComNode3), unitRadius)).toEqual(true);
  });
  it('instantiate layout with center on the left', () => {
    const radial = new Layouts['radial']({
      center: [0, 250]
    });
    radial.layout(data);
    expect(data.nodes[0].x).not.toEqual(NaN);
    expect(data.nodes[0].y).not.toEqual(NaN);
  });

  it('instantiate layout with center on the top', () => {
    data.nodes.forEach((node: any) => {
      delete node.size;
    });
    const radial = new Layouts['radial']({
      center: [250, 0],
      preventOverlap: true
    });
    radial.layout(data);

    expect(data.nodes[0].x).not.toEqual(NaN);
    expect(data.nodes[0].y).not.toEqual(NaN);
  });

  it('mds try catch', () => {
    const mds = new MDS({
      distances: [[0, 0]],
      linkDistance: 10
    });
    const positions = mds.layout();
    expect(positions[0][0]).not.toEqual(NaN);
    expect(positions[0][1]).not.toEqual(NaN);
  });

  it('radial with data sort', () => {
    const data2: any = {
      nodes: [
        {
          id: '0',
          label: '0',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '1',
          label: '1',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '2',
          label: '2',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '3',
          label: '3',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '4',
          label: '4',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '5',
          label: '5',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '6',
          label: '6',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '7',
          label: '7',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '8',
          label: '8',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '9',
          label: '9',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '10',
          label: '10',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '11',
          label: '11',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '12',
          label: '12',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '13',
          label: '13',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '14',
          label: '14',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '15',
          label: '15',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '16',
          label: '16',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '17',
          label: '17',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '18',
          label: '18',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '19',
          label: '19',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '20',
          label: '20',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '21',
          label: '21',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '22',
          label: '22',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '23',
          label: '23',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '24',
          label: '24',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '25',
          label: '25',
          sortAttr: 0,
          sortAttr2: 'a'
        },
        {
          id: '26',
          label: '26',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '27',
          label: '27',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '28',
          label: '28',
          sortAttr: 3,
          sortAttr2: 'd'
        },
        {
          id: '29',
          label: '29',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '30',
          label: '30',
          sortAttr: 2,
          sortAttr2: 'c'
        },
        {
          id: '31',
          label: '31',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '32',
          label: '32',
          sortAttr: 1,
          sortAttr2: 'b'
        },
        {
          id: '33',
          label: '33',
          sortAttr: 0,
          sortAttr2: 'a'
        }
      ],
      edges: [
        {
          source: '0',
          target: '1'
        },
        {
          source: '0',
          target: '2'
        },
        {
          source: '0',
          target: '3'
        },
        {
          source: '0',
          target: '4'
        },
        {
          source: '0',
          target: '5'
        },
        {
          source: '0',
          target: '7'
        },
        {
          source: '0',
          target: '8'
        },
        {
          source: '0',
          target: '9'
        },
        {
          source: '0',
          target: '10'
        },
        {
          source: '0',
          target: '11'
        },
        {
          source: '0',
          target: '13'
        },
        {
          source: '0',
          target: '14'
        },
        {
          source: '0',
          target: '15'
        },
        {
          source: '0',
          target: '16'
        },
        {
          source: '2',
          target: '3'
        },
        {
          source: '4',
          target: '5'
        },
        {
          source: '4',
          target: '6'
        },
        {
          source: '5',
          target: '6'
        },
        {
          source: '7',
          target: '13'
        },
        {
          source: '8',
          target: '14'
        },
        {
          source: '9',
          target: '10'
        },
        {
          source: '10',
          target: '22'
        },
        {
          source: '10',
          target: '14'
        },
        {
          source: '10',
          target: '12'
        },
        {
          source: '10',
          target: '24'
        },
        {
          source: '10',
          target: '21'
        },
        {
          source: '10',
          target: '20'
        },
        {
          source: '11',
          target: '24'
        },
        {
          source: '11',
          target: '22'
        },
        {
          source: '11',
          target: '14'
        },
        {
          source: '12',
          target: '13'
        },
        {
          source: '16',
          target: '17'
        },
        {
          source: '16',
          target: '18'
        },
        {
          source: '16',
          target: '21'
        },
        {
          source: '16',
          target: '22'
        },
        {
          source: '17',
          target: '18'
        },
        {
          source: '17',
          target: '20'
        },
        {
          source: '18',
          target: '19'
        },
        {
          source: '19',
          target: '20'
        },
        {
          source: '19',
          target: '33'
        },
        {
          source: '19',
          target: '22'
        },
        {
          source: '19',
          target: '23'
        },
        {
          source: '20',
          target: '21'
        },
        {
          source: '21',
          target: '22'
        },
        {
          source: '22',
          target: '24'
        },
        {
          source: '22',
          target: '25'
        },
        {
          source: '22',
          target: '26'
        },
        {
          source: '22',
          target: '23'
        },
        {
          source: '22',
          target: '28'
        },
        {
          source: '22',
          target: '30'
        },
        {
          source: '22',
          target: '31'
        },
        {
          source: '22',
          target: '32'
        },
        {
          source: '22',
          target: '33'
        },
        {
          source: '23',
          target: '28'
        },
        {
          source: '23',
          target: '27'
        },
        {
          source: '23',
          target: '29'
        },
        {
          source: '23',
          target: '30'
        },
        {
          source: '23',
          target: '31'
        },
        {
          source: '23',
          target: '33'
        },
        {
          source: '32',
          target: '33'
        }
      ]
    };

    const colors = ['#e5e5e5', 'green', '#5AD8A6', 'rgb(95, 149, 255)'];
    const colorsObj: any = { a: '#e5e5e5', b: 'green', c: '#5AD8A6', d: 'rgb(95, 149, 255)' };
    data2.nodes.forEach((node: any) => {
      node.size = 15;
      node.label = ' ';
      node.style = {
        lineWidth: 3,
        fill: '#fff',
        stroke: colors[node.sortAttr2] || colorsObj[node.sortAttr2]
      };
    });

    const radial = new Layouts['radial']({
      center: [250, 250],
      preventOverlap: true,
      sortBy: 'sortAttr2',
      sortStrength: 100
    });
    radial.layout(data);
  });
});
