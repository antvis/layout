import { RadialLayout } from '@/src';
import type { GUI } from 'lil-gui';
import { radial as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

export function render(gui?: GUI) {
  const renderer = new GraphRenderer();

  const { width, height } = renderer.getCanvasSize();

  const radial = new RadialLayout({
    width,
    height,
    center: [width / 2, height / 2],
    nodeSize: 20,
    unitRadius: 50,
  });

  const relayout = async (options = {}) => {
    await radial.execute(data, options);

    renderer.render(radial, {
      showLabel: true,
      nodeRadius: 10,
      nodeStyle: { stroke: '#F875AA', lineWidth: 1 },
    });
  };

  relayout();

  if (gui) {
    const config = {
      preventOverlap: false,
      maxPreventOverlapIteration: 100,
      nodeSize: 20,
      strictRadial: false,
      linkDistance: 100,
      maxIteration: 500,
    };

    const folder = gui.addFolder('Radial Layout');
    folder.add(config, 'preventOverlap').onChange(() => relayout(config));
    folder
      .add(config, 'maxPreventOverlapIteration', 0, 500, 10)
      .onChange(() => relayout(config));
    folder.add(config, 'nodeSize', 10, 100, 5).onChange(() => relayout(config));
    folder.add(config, 'strictRadial').onChange(() => relayout(config));
    folder
      .add(config, 'linkDistance', 10, 200, 10)
      .onChange(() => relayout(config));
    folder
      .add(config, 'maxIteration', 100, 2000, 100)
      .onChange(() => relayout(config));
  }

  return renderer.getCanvas();
}
