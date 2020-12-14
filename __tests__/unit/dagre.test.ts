import { Layout } from '../../src'
import { mathEqual } from '../util';
// import G6 from '@antv/g6';

// const div = document.createElement('div');
// div.id = 'global-spec';
// document.body.appendChild(div);
// const graph = new G6.Graph({
//   container: div,
//   width: 500,
//   height: 500,
//   defaultEdge: {
//     type: 'polyline'
//   },
//   defaultCombo: {
//     type: 'rect'
//   },
//   modes: {
//     default: ['drag-canvas', 'drag-node', 'zoom-canvas']
//   }
// });


const data: any = {
  nodes: [
    {
      id: '2',
      type: 'alps',
      name: 'alps_file2',
      label: '2',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '1',
      type: 'alps',
      name: 'alps_file1',
      label: '1',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '4',
      type: 'sql',
      name: 'sql_file1',
      label: '4',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '5',
      type: 'sql',
      name: 'sql_file2',
      label: '5',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '6',
      type: 'feature_etl',
      name: 'feature_etl_1',
      label: '6',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '3',
      type: 'alps',
      name: 'alps_file3',
      label: '3',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '7',
      type: 'feature_etl',
      name: 'feature_etl_1',
      label: '7',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
    {
      id: '8',
      type: 'feature_extractor',
      name: 'feature_extractor',
      label: '8',
      conf: [
        {
          label: 'conf',
          value: 'pai_graph.conf',
        },
        {
          label: 'dot',
          value: 'pai_graph.dot',
        },
        {
          label: 'init',
          value: 'init.rc',
        },
      ],
    },
  ],
  edges: [
    {
      source: '1',
      target: '2',
    },
    {
      source: '1',
      target: '3',
    },
    {
      source: '2',
      target: '4',
    },
    {
      source: '3',
      target: '4',
    },
    {
      source: '4',
      target: '5',
    },
    {
      source: '5',
      target: '6',
    },
    {
      source: '6',
      target: '7',
    },
    {
      source: '7',
      target: '8',
    },
  ],
};

data.nodes.forEach(node => {
  node.label = node.id
  node.type = 'rect'
})

describe('#DagreLayout', () => {
  it('return correct default config', () => {
    const dagre = new Layout.DagreLayout();
    expect(dagre.getDefaultCfg()).toEqual({
      rankdir: 'TB', // layout 方向, 可选 TB, BT, LR, RL
      align: undefined, // 节点对齐方式，可选 UL, UR, DL, DR
      nodeSize: undefined, // 节点大小
      nodesepFunc: undefined, // 节点水平间距(px)
      ranksepFunc: undefined, // 每一层节点之间间距
      nodesep: 50, // 节点水平间距(px)
      ranksep: 50, // 每一层节点之间间距
      controlPoints: false, // 是否保留布局连线的控制点
    });
    dagre.layout(data);
    expect((data.nodes[0] as any).x).not.toBe(undefined);
    expect((data.nodes[0] as any).y).not.toBe(undefined);
  });
  it('dagre with number nodeSize and sepFunc', () => {
    data.edges.forEach((edgeItem) => {
      delete edgeItem.startPoint;
      delete edgeItem.endPoint;
      delete edgeItem.controlPoints;
      delete edgeItem.type;
    });

    const dagre = new Layout.DagreLayout({
      rankdir: 'LR',
      controlPoints: false,
      nodeSize: 30,
      nodesepFunc: () => {
        return 10;
      },
      ranksepFunc: () => {
        return 30;
      },
    });
    dagre.layout(data);

    const node = data.nodes[0];
    const edge = data.edges[0];

    expect(mathEqual(node.x, 185)).toEqual(true);
    expect(mathEqual(node.y, 25)).toEqual(true);
    expect(edge.controlPoints).toBe(undefined);
  });
  it('dagre with array nodeSize', () => {
    data.edges.forEach((edgeItem) => {
      delete edgeItem.startPoint;
      delete edgeItem.endPoint;
      delete edgeItem.controlPoints;
    });
    const nodeSize = [100, 50];
    const dagre = new Layout.DagreLayout({
      controlPoints: false,
      nodeSize,
      nodesepFunc: () => {
        return 10;
      },
      ranksepFunc: () => {
        return 30;
      },
    });
    dagre.layout(data);
    const node = data.nodes[0];
    const edge = data.edges[0];

    expect(mathEqual(node.x, 60)).toEqual(true);
    expect(mathEqual(node.y, 215)).toEqual(true);
    expect(edge.controlPoints).toEqual(undefined);
  });

  it('dagre with number size in node data, controlpoints', () => {
    data.edges.forEach((edgeItem) => {
      delete edgeItem.startPoint;
      delete edgeItem.endPoint;
      delete edgeItem.controlPoints;
    });
    data.nodes.forEach((node, i) => {
      node.size = 20 + i * 5;
    });
    const dagre = new Layout.DagreLayout({
      rankdir: 'LR',
      controlPoints: true,
    });
    dagre.layout(data);

    const node = data.nodes[0];
    const edge = data.edges[0];

    expect(mathEqual(node.x, 247.5)).toEqual(true);
    expect(mathEqual(node.y, 60)).toEqual(true);
    expect(edge.controlPoints).not.toEqual(undefined);
    expect(mathEqual(edge.controlPoints[0].x, 150)).toEqual(true);
    expect(mathEqual(edge.controlPoints[0].y, 60)).toEqual(true);
  });
  it('dagre with array size in node data', () => {
    data.edges.forEach((edgeItem) => {
      delete edgeItem.startPoint;
      delete edgeItem.endPoint;
      delete edgeItem.controlPoints;
    });
    data.nodes.forEach((node, i) => {
      node.size = [100, 70];
    });
    const dagre = new Layout.DagreLayout({
      rankdir: 'LR',
    });
    dagre.layout(data);
    const node = data.nodes[0];
    const edge = data.edges[0];

    expect(mathEqual(node.x, 350)).toEqual(true);
    expect(mathEqual(node.y, 85)).toEqual(true);
    expect(edge.controlPoints).toEqual(undefined);
  });
  it('dagre sortByCombo', () => {
    data.edges.forEach((edgeItem) => {
      delete edgeItem.startPoint;
      delete edgeItem.endPoint;
      delete edgeItem.controlPoints;
    });
    data.combos = [
      { id: 'combo1' },
      { id: 'combo2' },
    ];
    data.nodes[0].comboId = 'combo1';
    data.nodes[3].comboId = 'combo1';
    data.nodes[2].comboId = 'combo2';
    data.nodes[5].comboId = 'combo2';
    data.nodes[6].comboId = 'combo2';
    const dagre = new Layout.DagreLayout({
      rankdir: 'TB',
      sortByCombo: true
    });
    dagre.layout(data);
    const node = data.nodes[0];
    const edge = data.edges[0];

    expect(mathEqual(node.x, 100)).toEqual(true);
    expect(mathEqual(node.y, 305)).toEqual(true);
    expect(edge.controlPoints).toEqual(undefined);
  });
})