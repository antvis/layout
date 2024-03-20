export function render(
  context: CanvasRenderingContext2D,
  nodes: {
    id: string;
    data: {
      x: number;
      y: number;
    };
  }[],
  edges: {
    source: string;
    target: string;
    data: {
      x: number;
      y: number;
      controlPoints: {
        x: number;
        y: number;
      }[];
    };
  }[],
  scaling: number,
) {
  context.resetTransform();
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  const matrix = new DOMMatrix();
  context.setTransform(
    matrix
      .translate(context.canvas.width / 2, context.canvas.height / 2, 0)
      .scale(scaling, scaling)
      .translate(-context.canvas.width / 2, -context.canvas.height / 2, 0),
  );

  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const source = nodes.find(({ id }) => id === edge.source);
    const target = nodes.find(({ id }) => id === edge.target);

    context.moveTo(source.data.x, source.data.y);
    edge.data.controlPoints.forEach((point) => {
      context.lineTo(point.x, point.y);
    });

    context.lineTo(target.data.x, target.data.y);
    context.strokeStyle = 'grey';
    context.lineWidth = 1;
    context.stroke();
  }

  for (let i = 0; i < nodes.length; i++) {
    context.beginPath();
    context.arc(nodes[i].data.x, nodes[i].data.y, 10, 0, 2 * Math.PI, false);
    context.fillStyle = 'red';
    context.fill();
    context.stroke();
  }
}
