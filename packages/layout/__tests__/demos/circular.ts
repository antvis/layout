import { CircularLayout } from '@/src';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import type { GUI } from 'lil-gui';
import { countries } from '../dataset';
import { renderNodes } from '../utils';

export function render(canvas: Canvas, gui?: GUI) {
  const { nodes, edges } = countries;

  const graph = new Graph({ nodes, edges });

  const circular = new CircularLayout({
    center: [250, 250],
    radius: 200,
  });

  const relayout = async (options = {}) => {
    const positions = await circular.execute(graph, options);
    await renderNodes(canvas, positions);
  };

  relayout();

  if (gui) {
    const folder = gui.addFolder('params');
    const config = {
      centerX: 250,
      centerY: 250,
      radius: 200,
      startRadius: 0,
      endRadius: 0,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      clockwise: true,
      divisions: 1,
      ordering: 'original',
    };
    folder.add(config, 'centerX', 0, 500).onChange((centerX: number) => {
      relayout({ ...config, center: [centerX, config.centerY] });
    });

    folder.add(config, 'centerY', 0, 500).onChange((centerY: number) => {
      relayout({ ...config, center: [config.centerX, centerY] });
    });

    folder.add(config, 'radius', 0, 500).onChange((radius: number) => {
      relayout({ ...config, radius });
    });

    folder
      .add(config, 'startRadius', 0, 500)
      .onChange((startRadius: number) => {
        relayout({ ...config, radius: 0, startRadius });
      });

    folder.add(config, 'endRadius', 0, 500).onChange((endRadius: number) => {
      relayout({ ...config, radius: 0, endRadius });
    });

    folder
      .add(config, 'startAngle', 0, 2 * Math.PI)
      .onChange((startAngle: number) => {
        relayout({ ...config, startAngle });
      });

    folder
      .add(config, 'endAngle', 0, 2 * Math.PI)
      .onChange((endAngle: number) => {
        relayout({ ...config, endAngle });
      });

    folder.add(config, 'clockwise').onChange((clockwise: boolean) => {
      relayout({
        ...config,
        clockwise,
        radius: 0,
      });
    });

    folder.add(config, 'divisions', 0, 10).onChange((divisions: number) => {
      relayout({ ...config, divisions });
    });

    folder
      .add(config, 'ordering', [
        'original',
        'degree',
        'topology',
        'topology-directed',
      ])
      .onChange((ordering) => {
        relayout({ ...config, ordering });
      });
  }

  return canvas;
}
