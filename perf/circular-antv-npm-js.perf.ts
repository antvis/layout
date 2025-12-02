import { CircularLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'circular',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: CircularLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const circularAntvNpmJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
circularAntvNpmJsTiny.iteration = 20;

export const circularAntvNpmJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
circularAntvNpmJsSmall.iteration = 20;

export const circularAntvNpmJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
circularAntvNpmJsMedium.iteration = 20;

export const circularAntvNpmJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
circularAntvNpmJsLarge.iteration = 20;

export const circularAntvNpmJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
circularAntvNpmJsXlarge.iteration = 20;
