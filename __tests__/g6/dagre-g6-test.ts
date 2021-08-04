import { DagreLayout } from '../../src';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const data = {
  nodes: [
    {
      id: "0",
      label: "0",
    },
    {
      id: "1",
      label: "1"
    },
    {
      id: "2",
      label: "2",
      layer: 2,
    },
    {
      id: "3",
      label: "3"
      layer: 4,
    },
    {
      id: "4",
      label: "4"
    },
    {
      id: "5",
      label: "5"
    },
    {
      id: "6",
      label: "6"
    },
    {
      id: "7",
      label: "7"
    },
    {
      id: "8",
      label: "8"
    },
    {
      id: "9",
      label: "9"
    }
  ],
  edges: [
    {
      source: "0",
      target: "1"
    },
    {
      source: "0",
      target: "2"
    },
    {
      source: "1",
      target: "4"
    },
    {
      source: "0",
      target: "3"
    },
    {
      source: "3",
      target: "4"
    },
    {
      source: "4",
      target: "5"
    },
    {
      source: "4",
      target: "6"
    },
    {
      source: "5",
      target: "7"
    },
    {
      source: "5",
      target: "8"
    },
    {
      source: "8",
      target: "9"
    },
    {
      source: "2",
      target: "9"
    },
    {
      source: "3",
      target: "9"
    }
  ]
};

describe('dagre layout', () => {
  it('assign layer', () => {
    const layout = new DagreLayout();
    layout.layout(data);
    console.log(data);
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: [ 'drag-node', 'zoom-canvas', 'drag-canvas' ]
      },
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    graph.data(data)
    graph.render();
  });
  it('keep data order', () => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    const layout = new DagreLayout();

    const data = {
      nodes: [
        {
          id: "0",
          label: "0",
        },
        {
          id: "1",
          label: "1"
        },
        {
          id: "2",
          label: "2",
        },
        {
          id: "4",
          label: "4"
        },
        {
          id: "3",
          label: "3"
        },
        {
          id: "5",
          label: "5"
        },
        {
          id: "6",
          label: "6"
        },
      ],
      edges: [
        {
          source: "0",
          target: "1"
        },
        {
          source: "0",
          target: "2"
        },
        {
          source: "1",
          target: "3"
        },
        {
          source: "2",
          target: "4"
        },
        {
          source: "3",
          target: "5"
        },
        {
          source: "4",
          target: "6"
        },
      ]
    };

    layout.updateCfg({
      keepNodeOrder: true,
      nodeOrder: data.nodes.map(n => n.id)
    })
    layout.layout(data);
    console.log(data);
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: [ 'drag-node', 'zoom-canvas', 'drag-canvas' ]
      },
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    graph.data(data)
    graph.render();
  });
});