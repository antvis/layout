import { AntVDagreLayout } from '@/src';
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
    },
    {
      id: '2',
    },
    {
      id: '3',
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
  ],
  edges: [
    {
      id: 'edge-102',
      source: '0',
      target: '1',
    },
    {
      id: 'edge-161',
      source: '0',
      target: '2',
    },
    {
      id: 'edge-237',
      source: '1',
      target: '4',
    },
    {
      id: 'edge-253',
      source: '0',
      target: '3',
    },
    {
      id: 'edge-133',
      source: '3',
      target: '4',
    },
    {
      id: 'edge-320',
      source: '2',
      target: '5',
    },
    {
      id: 'edge-355',
      source: '1',
      target: '6',
    },
    {
      id: 'edge-823',
      source: '1',
      target: '7',
    },
    {
      id: 'edge-665',
      source: '3',
      target: '8',
    },
    {
      id: 'edge-884',
      source: '3',
      target: '9',
    },
    {
      id: 'edge-536',
      source: '5',
      target: '10',
    },
    {
      id: 'edge-401',
      source: '5',
      target: '11',
    },
  ],
  combos: [
    {
      id: 'A',
      style: {
        type: 'rect',
      },
    },
    {
      id: 'B',
      style: {
        type: 'rect',
      },
    },
    {
      id: 'C',
      style: {
        type: 'rect',
      },
    },
  ],
};

data.nodes.push(
  ...data.combos.map((combo: any) => ({ ...combo, isGroup: true })),
);

export function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 1000,
    height: 500,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);

  const dagre = new AntVDagreLayout({
    node: (d) => ({
      parentId: d.combo,
    }),
    nodeSize: [60, 30],
    ranksep: 40,
    nodesep: 10,
    sortByCombo: true,
    controlPoints: true,
  });

  const relayout = async (options = {}) => {
    await dagre.execute(data, options);

    renderer.render(dagre, {
      nodeShape: 'rect',
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      edgeShape: 'polyline',
      showLabel: true,
    });

    dagre.forEachNode((node) => {
      renderer.updateNodeAttributes(node.id, {
        x: node.x - node.size[0] / 2,
        y: node.y - node.size[1] / 2,
        width: node.size[0],
        height: node.size[1],
        zIndex: node._original.isGroup ? 0 : 1,
        fillOpacity: node._original.isGroup ? 0.3 : 1,
      });
    });
  };

  relayout();

  return renderer.getCanvas();
}
