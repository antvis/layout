import { RandomLayout } from '@antv/layout';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'random',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: RandomLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const randomAntvDevJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
randomAntvDevJsTiny.iteration = 20;

export const randomAntvDevJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
randomAntvDevJsSmall.iteration = 20;

export const randomAntvDevJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
randomAntvDevJsMedium.iteration = 20;

export const randomAntvDevJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
randomAntvDevJsLarge.iteration = 20;

export const randomAntvDevJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
randomAntvDevJsXlarge.iteration = 20;
