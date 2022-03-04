import { DagreCompoundLayout } from '../../src';

import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const data = {
  nodes: [
    {
      id: 'A',
      label: 'A'
    },
    {
      id: 'B',
      label: 'B',
      comboId: 'GROUP4'
    },
    {
      id: 'C',
      label: 'C',
      comboId: 'GROUP1'
    },
    {
      id: 'D',
      label: 'D',
      comboId: 'GROUP1'
    },
    {
      id: 'E',
      label: 'E',
      comboId: 'GROUP1'
    },
    {
      id: 'F',
      label: 'F',
      comboId: 'GROUP1'
    },
    {
      id: 'G',
      label: 'G',
      comboId: 'GROUP0'
    }
  ],
  edges: [
    {
      source: 'A',
      target: 'B'
    },
    {
      source: 'A',
      target: 'G'
    },
    {
      source: 'B',
      target: 'C'
    },
    {
      source: 'B',
      target: 'D'
    },
    {
      source: 'B',
      target: 'E'
    },
    {
      source: 'B',
      target: 'F'
    }
  ],
  combos: [
    { id: 'GROUP2', label: 'GROUP2' },
    { id: 'GROUP1', label: 'GROUP1', parentId: 'GROUP2' },
    { id: 'GROUP0', label: 'GROUP0', parentId: 'GROUP2' },
    { id: 'GROUP4', label: 'GROUP4', parentId: 'GROUP0' }
  ]
};

describe('dagre compound layout', () => {
  it('dagre combo layout', () => {
    const layout = new DagreCompoundLayout({
      rankdir: 'LR'
    });
    const newData = JSON.parse(JSON.stringify(data));
    layout.layout(newData);
    // B is in GROUP4
    expect(newData.nodes[1].x === newData.combos[3].offsetX).toBe(true);
    // Node B and Node G are aligned
    expect(newData.nodes[1].x === newData.nodes[6].x).toBe(true);
  });
  it('dagre combo render', () => {
    const newData = JSON.parse(JSON.stringify(data));
    // render by G6
    const graph = new G6.Graph({
      container: div,
      width: 1000,
      height: 600,
      layout: {
        type: 'dagreCompound',
        rankdir: 'LR'
      },
      defaultNode: {
        size: [60, 30],
        type: 'rect'
      },
      defaultCombo: {
        type: 'rect',
        padding: [20, 20, 20, 20]
      },
      defaultEdge: {
        type: 'polyline',
        style: {
          lineWidth: 1,
          endArrow: true
        }
      },
      modes: {
        default: ['drag-canvas', 'zoom-canvas']
      }
    });

    graph.data(newData);
    graph.render();

    graph.getCombos().forEach(combo => {
      const model = combo.getModel();
      // correct combo position to make sure the graph is aligned
      combo.updatePosition({ x: model.offsetX as number, y: model.offsetY as number });
    });
  });
});
