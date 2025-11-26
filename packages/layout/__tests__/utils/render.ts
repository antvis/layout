import type { LayoutMapping, Node } from '@/src/types';
import { Canvas, Circle, Line, Rect, Text } from '@antv/g';

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

const displayNodes = (
  canvas: Canvas,
  positions: LayoutMapping,
  showLabel: boolean = false,
  nodeStyle: any = {},
) => {
  const nodeElements = new Map<string | number, any>();

  positions.nodes.forEach((node: Node) => {
    if (nodeStyle.type === 'rect') {
      const rect = new Rect({
        style: {
          x: node.data.x - (nodeStyle.width || 10) / 2,
          y: node.data.y - (nodeStyle.height || 10) / 2,
          width: nodeStyle.width || 10,
          height: nodeStyle.height || 10,
          fill: '#41C9E2',
          stroke: '#fff',
          lineWidth: 2,
          ...nodeStyle,
        },
      });
      canvas.appendChild(rect);
      nodeElements.set(node.id, rect);
    } else {
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
      nodeElements.set(node.id, circle);
    }

    if (showLabel) {
      const text = new Text({
        style: {
          x: node.data.x,
          y: node.data.y,
          text: node.data.name || node.id,
          fill: '#fff',
          fontWeight: 'bolder',
          fontSize: 11,
          fontFamily: 'Roboto',
          textAlign: 'center',
          textBaseline: 'middle',
        },
      });
      canvas.appendChild(text);
    }
  });

  return nodeElements;
};

const displayEdges = (canvas: Canvas, positions: LayoutMapping) => {
  const edgeElements = new Map<string | number, any>();

  positions.edges.forEach(
    ({
      id,
      source,
      target,
    }: {
      id: string;
      source: string;
      target: string;
    }) => {
      const sourceNode = positions.nodes.find(
        (node: Node) => node.id === source,
      );
      const targetNode = positions.nodes.find(
        (node: Node) => node.id === target,
      );

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
      edgeElements.set(id, line);
    },
  );

  return edgeElements;
};
