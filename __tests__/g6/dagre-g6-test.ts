import { DagreLayout } from '../../src';

import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const data = {
  nodes: [
    {
      id: '0',
      label: '0'
    },
    {
      id: '1',
      label: '1'
    },
    {
      id: '2',
      label: '2',
      layer: 2
    },
    {
      id: '3',
      label: '3',
      layer: 4
    },
    {
      id: '4',
      label: '4'
    },
    {
      id: '5',
      label: '5'
    },
    {
      id: '6',
      label: '6'
    },
    {
      id: '7',
      label: '7'
    },
    {
      id: '8',
      label: '8'
    },
    {
      id: '9',
      label: '9'
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
      source: '1',
      target: '4'
    },
    {
      source: '0',
      target: '3'
    },
    {
      source: '3',
      target: '4'
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
      target: '7'
    },
    {
      source: '5',
      target: '8'
    },
    {
      source: '8',
      target: '9'
    },
    {
      source: '2',
      target: '9'
    },
    {
      source: '3',
      target: '9'
    }
  ]
};

describe('dagre layout', () => {
  it('dagre combo', () => {
    const comboData = {
      nodes: [
        {
          id: '0',
          label: '0'
        },
        {
          id: '1',
          label: '1'
        },
        {
          id: '2',
          label: '2'
        },
        {
          id: '3',
          label: '3'
        },
        {
          id: '4',
          label: '4',
          comboId: 'A'
        },
        {
          id: '5',
          label: '5',
          comboId: 'B'
        },
        {
          id: '6',
          label: '6',
          comboId: 'A'
        },
        {
          id: '7',
          label: '7',
          comboId: 'C'
        },
        {
          id: '8',
          label: '8',
          comboId: 'C'
        },
        {
          id: '9',
          label: '9',
          comboId: 'A'
        },
        {
          id: '10',
          label: '10',
          comboId: 'B'
        },
        {
          id: '11',
          label: '11',
          comboId: 'B'
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
          source: '1',
          target: '4'
        },
        {
          source: '0',
          target: '3'
        },
        {
          source: '3',
          target: '4'
        },
        {
          source: '2',
          target: '5'
        },
        {
          source: '1',
          target: '6'
        },
        {
          source: '1',
          target: '7'
        },
        {
          source: '3',
          target: '8'
        },
        {
          source: '3',
          target: '9'
        },
        {
          source: '5',
          target: '10'
        },
        {
          source: '5',
          target: '11'
        }
      ],
      combos: [
        {
          id: 'A',
          label: 'combo A',
          style: {
            fill: '#C4E3B2',
            stroke: '#C4E3B2'
          }
        },
        {
          id: 'B',
          label: 'combo B',
          style: {
            stroke: '#99C0ED',
            fill: '#99C0ED'
          }
        },
        {
          id: 'C',
          label: 'combo C',
          style: {
            stroke: '#eee',
            fill: '#eee'
          }
        }
      ]
    };
    const layout = new DagreLayout({
      sortByCombo: true,
      ranksep: 10,
      nodesep: 10
    });
    layout.layout(comboData);
    // @ts-ignore
    expect(comboData.nodes[9].x < comboData.nodes[7].x).toBe(true);
    // @ts-ignore
    expect(comboData.nodes[8].x < comboData.nodes[5].x).toBe(true);
  });
  it('assign layer', () => {
    const layout = new DagreLayout({ edgeLabelSpace: true });
    console.log('layout', layout);
    layout.layout(data);
    console.log(JSON.stringify(data));

    // const graph = new G6.Graph({
    //   container: div,
    //   width: 500,
    //   height: 500,
    //   modes: {
    //     default: ["drag-node", "zoom-canvas", "drag-canvas"],
    //   },
    //   defaultEdge: {
    //     style: {
    //       endArrow: true,
    //     },
    //   },
    // });

    // graph.data(data);
    // graph.render();
  });
  it('keep data order', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const layout = new DagreLayout();

    const data = {
      nodes: [
        {
          id: '0',
          label: '0'
        },
        {
          id: '1',
          label: '1'
        },
        {
          id: '2',
          label: '2'
        },
        {
          id: '4',
          label: '4'
        },
        {
          id: '3',
          label: '3'
        },
        {
          id: '5',
          label: '5'
        },
        {
          id: '6',
          label: '6'
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
          source: '1',
          target: '3'
        },
        {
          source: '2',
          target: '4'
        },
        {
          source: '3',
          target: '5'
        },
        {
          source: '4',
          target: '6'
        }
      ]
    };

    layout.updateCfg({
      keepNodeOrder: true,
      nodeOrder: data.nodes.map(n => n.id)
    });
    layout.layout(data);
    console.log(JSON.stringify(data));

    // const graph = new G6.Graph({
    //   container: div,
    //   width: 500,
    //   height: 500,
    //   modes: {
    //     default: ["drag-node", "zoom-canvas", "drag-canvas"],
    //   },
    //   defaultEdge: {
    //     style: {
    //       endArrow: true,
    //     },
    //   },
    // });

    // graph.data(data);
    // graph.render();
  });

  it('increment layout', () => {
    const layout = new DagreLayout();

    const originGraphData = {
      nodes: [
        {
          id: 'k79zNA0TkCwQPQWw4yn',
          label: 'ETL数据流',
          color: '#a6cee3'
        },
        {
          id: 'GWMF0chbHRKDkENg1hS',
          label: 'ETL数据流2',
          color: '#1f78b4'
        },
        {
          id: 'xCzXirgILRm9fF7gjeb',
          label: '报告',
          color: '#b2df8a'
        },
        {
          id: 'GxZeEGkky88xKxq1r22',
          label: '工厂输出表',
          color: '#33a02c'
        },
        {
          id: 'a',
          label: 'a',
          color: '#fb9a99'
        },
        {
          id: 'b',
          label: 'b',
          color: '#ff7f00'
        },
        {
          id: 'c',
          label: 'c',
          color: '#6a3d9a'
        },
        {
          id: 'AKl8iaVQamqiMaMCF7E',
          label: 'csv数据源',
          color: '#2a9d9a'
        }
      ],
      edges: [
        {
          source: 'k79zNA0TkCwQPQWw4yn',
          target: 'GxZeEGkky88xKxq1r22'
        },
        {
          source: 'GxZeEGkky88xKxq1r22',
          target: 'xCzXirgILRm9fF7gjeb'
        },
        {
          source: 'xCzXirgILRm9fF7gjeb',
          target: 'b'
        },
        {
          source: 'xCzXirgILRm9fF7gjeb',
          target: 'c'
        },
        {
          source: 'AKl8iaVQamqiMaMCF7E',
          target: 'xCzXirgILRm9fF7gjeb'
        },
        {
          source: 'GxZeEGkky88xKxq1r22',
          target: 'GWMF0chbHRKDkENg1hS'
        },
        {
          source: 'GWMF0chbHRKDkENg1hS',
          target: 'a'
        }
      ]
    };
    const addGraphData = {
      nodes: [
        {
          id: 'vm1234',
          label: '新增报告'
        }
      ],
      edges: [
        {
          source: 'a',
          target: 'vm1234'
        }
      ]
    };

    layout.updateCfg({
      rankdir: 'LR'
    });
    const originGraph = JSON.parse(JSON.stringify(originGraphData));
    layout.layout(originGraph);
    console.log(JSON.stringify(originGraph));

    // @ts-ignore: modified originGraph
    expect(originGraph.nodes.find(n => n.id === 'a')._order).toBe(0);
    // @ts-ignore
    expect(originGraph.nodes.find(n => n.id === 'b')._order).toBe(2);
    // @ts-ignore
    expect(originGraph.nodes.find(n => n.id === 'c')._order).toBe(1);

    // {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: ['drag-node', 'zoom-canvas', 'drag-canvas']
      },
      defaultEdge: {
        style: {
          endArrow: true
        }
      }
    });

    graph.data(originGraph);
    graph.render();
    // }

    graph.on('canvas:click', e => {
      const newGraph = {
        nodes: [...originGraphData.nodes, ...addGraphData.nodes],
        edges: [...originGraphData.edges, ...addGraphData.edges]
      };

      layout.updateCfg({
        preset: originGraph
      });
      layout.layout(newGraph);
      graph.changeData(newGraph);
      console.log(JSON.stringify(newGraph));
    });

    // {
    //   const div = document.createElement("div");
    //   document.body.appendChild(div);
    //   const graph = new G6.Graph({
    //     container: div,
    //     width: 500,
    //     height: 500,
    //     modes: {
    //       default: ["drag-node", "zoom-canvas", "drag-canvas"],
    //     },
    //     defaultEdge: {
    //       style: {
    //         endArrow: true,
    //       },
    //     },
    //   });

    //   graph.data(newGraph);
    //   graph.render();
    // }

    // // should keep origin order
    // // @ts-ignore: modified newGraph
    // expect(newGraph.nodes.find((n) => n.id === "a")._order).toBe(0);
    // // @ts-ignore
    // expect(newGraph.nodes.find((n) => n.id === "b")._order).toBe(1);
    // // @ts-ignore
    // expect(newGraph.nodes.find((n) => n.id === "c")._order).toBe(2);
  });
});
