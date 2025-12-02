import { CircularLayout } from '@antv/layout';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'circular',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: CircularLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const circularAntvDevJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
circularAntvDevJsTiny.iteration = 20;

export const circularAntvDevJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
circularAntvDevJsSmall.iteration = 20;

export const circularAntvDevJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
circularAntvDevJsMedium.iteration = 20;

export const circularAntvDevJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
circularAntvDevJsLarge.iteration = 20;

export const circularAntvDevJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
circularAntvDevJsXlarge.iteration = 20;
