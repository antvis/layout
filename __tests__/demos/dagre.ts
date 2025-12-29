import { DagreLayout } from '@/src';
import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import type { GUI } from 'lil-gui';
import { dagre as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

// data.combos.forEach((combo: any) => {
//   (data.nodes as any).push({
//     id: combo.id,
//     isCombo: true,
//   });
// });

export function render(gui?: GUI) {
  const canvas = new Canvas({
    container: 'container',
    width: 850,
    height: 400,
    renderer: new Renderer(),
  });

  const renderer = new GraphRenderer(canvas);

  const dagre = new DagreLayout({
    node: (d) => ({
      parentId: d.comboId,
    }),
    // nodeSize: [60, 30],
    // ranksep: 50,

    rankdir: 'TB',
    nodeSize: [60, 30],
    ranksep: 50,
    nodesep: 50,
    edgeLabelSize: [50, 20],
    edgeLabelPos: 'c',
    edgeLabelOffset: 5,

    // rankdir: 'TB',
    // nodeSize: [60, 30],
    // ranksep: 50,
    // nodesep: 50,
    // edgeLabelSize: (d) => [50, 20],
    // edgeLabelPos: (d) => 'c',
    // edgeLabelOffset: (d) => 10,
  });

  const relayout = async (options = {}) => {
    await dagre.execute(data, options);

    renderer.render(dagre, {
      nodeShape: 'rect',
      nodeSize: { width: 60, height: 30 },
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
        zIndex: node._original.isCombo ? 0 : 1,
        fillOpacity: node._original.isCombo ? 0.3 : 1,
      });
    });

    dagre.forEachEdge((edge) => {
      console.log(edge);
    });
  };

  relayout();

  return renderer.getCanvas();
}
