import { ComboCombinedLayout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { GraphRenderer } from '../utils/renderer';

const data = {
  nodes: [
    {
      id: '0',
    },
    {
      id: '1',
      // rank: 1,
      // order: 1,
    },
    {
      id: '2',
      // rank: 1,
      // order: 2,
    },
    {
      id: '3',
      // rank: 1,
      // order: 3,
    },
    {
      id: '4',
      combo: 'A',
    },
    {
      id: '5',
      combo: 'B',
    },
    {
      id: '6',
      combo: 'A',
    },
    {
      id: '7',
      combo: 'C',
    },
    {
      id: '8',
      combo: 'C',
    },
    {
      id: '9',
      combo: 'A',
    },
    {
      id: '10',
      combo: 'B',
    },
    {
      id: '11',
      combo: 'B',
    },
    {
      id: '12',
    },
  ],
  edges: [
    {
      source: '0',
      target: '1',
    },
    {
      source: '0',
      target: '2',
    },
    {
      source: '1',
      target: 'A',
    },
    {
      source: '0',
      target: '3',
    },
    {
      source: '3',
      target: 'C',
    },
    {
      source: '2',
      target: 'B',
    },
    {
      source: '5',
      target: '10',
    },
    {
      source: '5',
      target: '11',
    },
    {
      source: 'A',
      target: '12',
    },
    {
      source: 'B',
      target: '12',
    },
    {
      source: 'C',
      target: '12',
    },
  ],
  combos: [
    {
      id: 'A',
      // rank: 2,
      // order: 1,
      style: {
        type: 'rect',
      },
    },
    {
      id: 'B',
      // rank: 2,
      // order: 2,
      style: {
        type: 'rect',
      },
    },
    {
      id: 'C',
      // rank: 3,
      // order: 3,
      style: {
        type: 'rect',
      },
    },
  ],
};

data.combos.forEach((combo: any) => {
  (data.nodes as any).push({
    ...combo,
    id: combo.id,
    isCombo: true,
  });
});
delete data.combos;
console.log('combo combined data:', data);

export function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 800,
    height: 800,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);

  const layout = new ComboCombinedLayout({
    width: 800,
    height: 800,
    node: (d) => ({
      parentId: d.combo,
      isCombo: d.isCombo,
    }),
    layout: (comboId) => {
      return !comboId
        ? {
            type: 'dagre',
            rankdir: 'LR',
            ranksep: 60,
            nodesep: 50,
          }
        : {
            type: 'dagre',
            rankdir: 'LR',
            ranksep: 40,
            nodesep: 20,
          };
    },
  });

  const relayout = async (options = {}) => {
    await layout.execute(data, options);

    renderer.render(layout, {
      enableDrag: false,
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
      nodeShape: 'rect',
    });

    layout.forEachNode((node: any) => {
      console.log('node:', node);
      renderer.updateNodeAttributes(node.id, {
        // cx: node.x,
        // cy: node.y,
        // r: Math.max(...node.size) / 2,
        x: node.x - node.size[0] / 2,
        y: node.y - node.size[1] / 2,
        width: node.size[0],
        height: node.size[1],
        zIndex: node.isCombo ? 0 : 1,
        fillOpacity: node.isCombo ? 0.3 : 1,
        fill: node.isCombo ? '#91D5FF' : '#FFD666',
      });
    });

    layout.forEachEdge((edge) => {});
  };

  relayout();

  return renderer.getCanvas();
}
