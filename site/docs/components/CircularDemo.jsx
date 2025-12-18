import { CircularLayout } from '@antv/layout';
import { useEffect, useRef } from 'react';

export default function Demo() {
  const canvasRef = useRef(null);

  const data = {
    nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
    edges: [
      { source: 'node1', target: 'node2' },
      { source: 'node2', target: 'node3' },
    ],
  };

  const createCanvas = () => {};

  async function layout() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const width = 500;
    const height = 500;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);

    const layout = new CircularLayout({ center: [250, 250], radius: 150 });

    await layout.execute(data);

    layout.forEachEdge((edge) => {
      const { sourceNode, targetNode } = edge;

      ctx.beginPath();
      ctx.moveTo(sourceNode.x, sourceNode.y);
      ctx.lineTo(targetNode.x, targetNode.y);
      ctx.stroke();
    });

    layout.forEachNode((node) => {
      ctx.beginPath();

      ctx.arc(node.x, node.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#5B8FF9';
      ctx.fill();
    });
  }

  useEffect(() => {
    layout();
  }, []);

  return <canvas ref={canvasRef} style={{ border: '1px solid #ddd' }} />;
}
