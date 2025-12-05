import { ConcentricLayout } from '@/src';
import type { GUI } from 'lil-gui';
import { countries as data } from '../dataset';
import { GraphRenderer } from '../utils/renderer';

export function render(gui?: GUI) {
  const renderer = new GraphRenderer();

  const concentric = new ConcentricLayout({
    center: [250, 250],
    nodeSize: 20,
  });

  const relayout = async (options = {}) => {
    await concentric.execute(data, options);
    renderer.render(concentric, {
      nodeRadius: 10,
      nodeStyle: { stroke: '#F875AA', lineWidth: 1 },
    });
  };

  relayout();

  if (gui) {
    const folder = gui.addFolder('params');
    const config = {
      centerX: 250,
      centerY: 250,
      nodeSize: 30,
      nodeSpacing: 10,
      preventOverlap: false,
      equidistant: false,
      startAngle: (3 / 2) * Math.PI,
      clockwise: true,
      sortBy: 'degree',
    };

    const options: any = config;

    folder.add(config, 'centerX', 0, 500).onChange((centerX: number) => {
      options.center = [centerX, options.center ? options.center[1] : 250];
      console.log(options);
      relayout(options);
    });

    folder.add(config, 'centerY', 0, 500).onChange((centerY: number) => {
      options.center = [options.center ? options.center[0] : 250, centerY];
      relayout(options);
    });

    folder.add(config, 'nodeSize', 0, 50).onChange((nodeSize: number) => {
      options.nodeSize = nodeSize;
      relayout(options);
    });

    folder.add(config, 'nodeSpacing', 0, 50).onChange((nodeSpacing: number) => {
      options.nodeSpacing = nodeSpacing;
      relayout(options);
    });

    folder.add(config, 'preventOverlap').onChange((preventOverlap: boolean) => {
      options.preventOverlap = preventOverlap;
      relayout(options);
    });

    // folder.add(config, 'sweep', 0, 2 * Math.PI).onChange((sweep: number) => {
    //   options.sweep = sweep === 0 ? undefined : sweep;
    //   relayout(options);
    // });

    folder.add(config, 'equidistant').onChange((equidistant: boolean) => {
      options.equidistant = equidistant;
      relayout(options);
    });

    folder
      .add(config, 'startAngle', 0, 2 * Math.PI)
      .onChange((startAngle: number) => {
        options.startAngle = startAngle;
        relayout(options);
      });

    folder.add(config, 'clockwise').onChange((clockwise: boolean) => {
      options.clockwise = clockwise;
      relayout(options);
    });

    // folder
    //   .add(config, 'maxLevelDiff', 0, 50)
    //   .onChange((maxLevelDiff: number) => {
    //     options.maxLevelDiff = maxLevelDiff === 0 ? undefined : maxLevelDiff;
    //     relayout(options);
    //   });

    folder.add(config, 'sortBy', ['degree']).onChange((sortBy: string) => {
      options.sortBy = sortBy;
      relayout(options);
    });
  }

  return renderer.getCanvas();
}
