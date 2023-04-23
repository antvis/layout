export function render(
  context: CanvasRenderingContext2D,
  nodes: number[],
  edges: number[]
) {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  // context.scale(0.2, 0.2);

  for (let i = 0; i < edges.length; i += 4) {
    context.moveTo(edges[i], edges[i + 1]);
    context.lineTo(edges[i + 2], edges[i + 3]);
    context.strokeStyle = "grey";
    context.lineWidth = 1;
    context.stroke();
  }
  for (let i = 0; i < nodes.length; i += 2) {
    context.beginPath();
    context.arc(nodes[i], nodes[i + 1], 5, 0, 2 * Math.PI, false);
    context.fillStyle = "red";
    context.fill();
    context.stroke();
  }
}
