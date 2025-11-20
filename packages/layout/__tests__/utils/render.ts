import type { LayoutMapping } from '@/src/types';
import { Canvas, Circle, Line, Text } from '@antv/g';

export async function renderNodesAndEdges(
  canvas: Canvas,
  positions: LayoutMapping,
  showLabel: boolean = false,
  nodeStyle = {},
) {
  await canvas.ready;
  canvas.removeChildren();

  displayEdges(canvas, positions);
  displayNodes(canvas, positions, showLabel, nodeStyle);
}

export async function renderNodes(
  canvas: Canvas,
  positions: LayoutMapping,
  showLabel: boolean = false,
  nodeStyle = {},
) {
  await canvas.ready;
  canvas.removeChildren();

  displayNodes(canvas, positions, showLabel, nodeStyle);
}

const displayNodes = async (
  canvas: Canvas,
  positions: LayoutMapping,
  showLabel: boolean = false,
  nodeStyle = {},
) => {
  positions.nodes.forEach((node) => {
    const circle = new Circle({
      style: {
        cx: node.data.x,
        cy: node.data.y,
        r: 10,
        fill: '#41C9E2',
        stroke: '#fff',
        lineWidth: 2,
        ...nodeStyle,
      },
    });
    canvas.appendChild(circle);

    if (showLabel) {
      const text = new Text({
        style: {
          x: node.data.x,
          y: node.data.y,
          text: node.data.name || node.id,
          fontSize: 12,
          textAlign: 'center',
          textBaseline: 'middle',
        },
      });
      canvas.appendChild(text);
    }
  });
};

const displayEdges = async (canvas: Canvas, positions: LayoutMapping) => {
  positions.edges.forEach(({ source, target, data }) => {
    const sourceNode = positions.nodes.find(({ id }) => id === source);
    const targetNode = positions.nodes.find(({ id }) => id === target);

    const line = new Line({
      style: {
        x1: sourceNode.data.x,
        y1: sourceNode.data.y,
        x2: targetNode.data.x,
        y2: targetNode.data.y,
        lineWidth: 1,
        stroke: '#bebebe',
      },
    });
    canvas.appendChild(line);
  });
};
