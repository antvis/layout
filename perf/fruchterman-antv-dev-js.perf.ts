import { FruchtermanLayout } from '@antv/layout';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'fruchterman',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: FruchtermanLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    gravity: 1,
    speed: 5,
    animate: false,
  },
  shouldRender: true,
};

export const fruchtermanAntvDevJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
fruchtermanAntvDevJsTiny.iteration = 10;

export const fruchtermanAntvDevJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
fruchtermanAntvDevJsSmall.iteration = 10;

export const fruchtermanAntvDevJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
fruchtermanAntvDevJsMedium.iteration = 10;

// export const fruchtermanAntvDevJsLarge: Test = async (context) => {
//   await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
// };
// fruchtermanAntvDevJsLarge.iteration =10;

// export const fruchtermanAntvDevJsXlarge: Test = async (context) => {
//   await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
// };
// fruchtermanAntvDevJsXlarge.iteration = 10;
