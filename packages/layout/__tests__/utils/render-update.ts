import { Canvas, Circle, Line, Rect, Text } from '@antv/g';
import { Layout } from '../../src/core/types';

export async function renderNodesAndEdges(
  canvas: Canvas,
  layout: Layout,
  showLabel: boolean = false,
  nodeStyle = {},
) {
  await canvas.ready;
  canvas.removeChildren();

  displayEdges(canvas, layout);
  displayNodes(canvas, layout, showLabel, nodeStyle);
}

export async function renderNodes(
  canvas: Canvas,
  layout: Layout,
  showLabel: boolean = false,
  nodeStyle = {},
) {
  await canvas.ready;
  canvas.removeChildren();

  displayNodes(canvas, layout, showLabel, nodeStyle);
}

const displayNodes = (
  canvas: Canvas,
  layout: Layout,
  showLabel: boolean = false,
  nodeStyle: any = {},
) => {
  const nodeElements = new Map<string | number, any>();

  layout.forEachNode((node) => {
    if (nodeStyle.type === 'rect') {
      const rect = new Rect({
        style: {
          x: node.x - (nodeStyle.width || 10) / 2,
          y: node.y - (nodeStyle.height || 10) / 2,
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
          cx: node.x,
          cy: node.y,
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
          x: node.x,
          y: node.y,
          text: node.id,
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

const displayEdges = (canvas: Canvas, layout: Layout) => {
  const edgeElements = new Map<string | number, any>();

  layout.forEachEdge(({ id, sourceNode, targetNode }) => {
    const line = new Line({
      style: {
        x1: sourceNode.x,
        y1: sourceNode.y,
        x2: targetNode.x,
        y2: targetNode.y,
        lineWidth: 1,
        stroke: '#bebebe',
      },
    });
    canvas.appendChild(line);
    edgeElements.set(id, line);
  });

  return edgeElements;
};

export function calculatePositions(layout: Layout) {
  const results = {
    nodes: [],
    edges: [],
  };
  layout.forEachNode((node) => {
    results.nodes.push(node);
  });
  layout.forEachEdge((edge) => {
    results.edges.push(edge);
  });
  return results;
}
