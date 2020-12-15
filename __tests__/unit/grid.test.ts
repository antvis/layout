import { Layouts } from '../../src'
import { OutNode } from '../../src/layout/types'
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

const data = {
  nodes: [
    { id: '0' },
    { id: '1' },
    { id: '2' },
    { id: '3' },
    { id: '4' },
    { id: '5' },
    { id: '6' },
    { id: '7' },
  ],
  edges: [
    { source: '0', target: '1' },
    { source: '1', target: '2' },
    { source: '2', target: '3' },
    { source: '3', target: '4' },
    { source: '5', target: '6' },
    { source: '6', target: '7' },
  ],
};

describe('#GridLayout', () => {
  it('return correct default config', () => {
    const grid = new Layouts['grid']();
    expect(grid.getDefaultCfg()).toEqual({
      begin: [0, 0],
      cols: undefined,
      condense: false,
      nodeSize: 30,
      position: undefined,
      preventOverlap: true,
      preventOverlapPadding: 10,
      rows: undefined,
      sortBy: 'degree'
    });
    grid.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('grid layout without node', () => {
    const dataNoNode = {nodes: [], edges: []};
    const grid = new Layouts['grid']();
    grid.layout(dataNoNode);
    expect(dataNoNode.nodes).not.toBe(undefined);
  });
  it('grid layout without one node', () => {
    const dataOneNode = {nodes: [{id: 'node'}], edges: []};
    const grid = new Layouts['grid']({ begin: [10, 20] });
    grid.layout(dataOneNode);
    expect((dataOneNode.nodes[0] as OutNode).x).toBe(10);
    expect((dataOneNode.nodes[0] as OutNode).y).toBe(20);
  });
  it('grid layout with fixed columns', () => {
    const grid = new Layouts['grid']({
      cols: 2,
      sortBy: 'id',
      begin: [10, 20]
    });
    grid.layout(data);
    expect(!!((data.nodes[0] as OutNode).x && (data.nodes[0] as OutNode).y)).toEqual(true);
    expect(!!((data.nodes[2] as OutNode).y && (data.nodes[2] as OutNode).y)).toEqual(true);
    expect((data.nodes[0] as OutNode).x === (data.nodes[2] as OutNode).x).toEqual(true);
    expect((data.nodes[0] as OutNode).y > (data.nodes[2] as OutNode).y).toEqual(true);
  });
  it('grid layout with fixed rows', () => {
    const grid = new Layouts['grid']({
      rows: 2,
      sortBy: 'id',
      begin: [10 ,20]
    });
    grid.layout(data);

    expect(!!((data.nodes[0] as OutNode).x && (data.nodes[0] as OutNode).y)).toEqual(true);
    expect(!!((data.nodes[2] as OutNode).y && (data.nodes[2] as OutNode).y)).toEqual(true);
    expect((data.nodes[3] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
  });
  it('grid layout with fixed cols and rows, rows*cols>nodes, situation 1', () => {
    const grid = new Layouts['grid']({
      rows: 2,
      cols: 6,
      sortBy: 'id',
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[2] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[2] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
  });
  it('grid layout with fixed cols and rows, rows*cols>nodes, situation 2', () => {
    const grid = new Layouts['grid']({
      rows: 3,
      cols: 4,
      sortBy: 'id',
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[3] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
  });
  it('grid layout with fixed cols and rows, rows*cols<nodes, situation 1', () => {
    const grid = new Layouts['grid']({
      rows: 2,
      cols: 2,
      sortBy: 'id',
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[3] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
    expect((data.nodes[5] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[5] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
  });
  it('grid layout with fixed cols and rows, rows*cols<nodes, situation 2', () => {
    const grid = new Layouts['grid']({
      rows: 2,
      cols: 3,
      sortBy: 'id',
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[3] as OutNode).x === (data.nodes[7] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y > (data.nodes[7] as OutNode).y).toEqual(true);
  });
  it('grid layout with condense', () => {
    const grid = new Layouts['grid']({
      condense: true,
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[1] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[1] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
  });
  it('grid layout with preventOverlap', () => {
    const grid = new Layouts['grid']({
      preventOverlap: true,
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('grid layout with preventOverlap, nodeSize is an array', () => {
    const grid = new Layouts['grid']({
      preventOverlap: true,
      nodeSize: [20, 10],
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[1] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[1] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
  });
  it('grid layout with preventOverlap, nodeSize is null', () => {
    const grid = new Layouts['grid']({
      preventOverlap: true,
      nodeSize: null,
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[1] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[1] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
  });
  it('grid layout with position function', () => {
    let rows = 0;
    data.nodes.forEach((node, i) => {
      node['col'] = i % 3;
      node['row'] = rows;
      if (node['col'] === 2) rows++;
    });
    const grid = new Layouts['grid']({
      position: (d) => {
        return {
          row: d['row'],
          col: d['col'],
        };
      },
      begin: [10 ,20]
    });
    grid.layout(data);
    expect((data.nodes[0] as OutNode).x === (data.nodes[3] as OutNode).x).toEqual(true);
    expect((data.nodes[0] as OutNode).y < (data.nodes[3] as OutNode).y).toEqual(true);
    expect((data.nodes[3] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
  });
  it('grid layout with position function, col undefined', () => {
    const grid = new Layouts['grid']({
      position: (d) => {
        return {
          row: d['row'],
        };
      }
    });
    grid.layout(data);

    expect((data.nodes[1] as OutNode).x === (data.nodes[3] as OutNode).x).toEqual(true);
    expect((data.nodes[1] as OutNode).y < (data.nodes[3] as OutNode).y).toEqual(true);
    expect((data.nodes[3] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
  });
  it('grid layout with position function, row undefined', () => {
    const grid = new Layouts['grid']({
      position: (d) => {
        return {
          col: d['col'],
        };
      },
      begin: [10 ,20]
    });
    grid.layout(data);

    expect((data.nodes[3] as OutNode).x === (data.nodes[6] as OutNode).x).toEqual(true);
    expect((data.nodes[3] as OutNode).y < (data.nodes[6] as OutNode).y).toEqual(true);
    expect((data.nodes[6] as OutNode).x === (data.nodes[0] as OutNode).x).toEqual(true);
    expect((data.nodes[6] as OutNode).y < (data.nodes[0] as OutNode).y).toEqual(true);
  });
})