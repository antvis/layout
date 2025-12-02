import { RandomLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'random',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: RandomLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const randomAntvNpmJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
randomAntvNpmJsTiny.iteration = 20;

export const randomAntvNpmJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
randomAntvNpmJsSmall.iteration = 20;

export const randomAntvNpmJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
randomAntvNpmJsMedium.iteration = 20;

export const randomAntvNpmJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
randomAntvNpmJsLarge.iteration = 20;

export const randomAntvNpmJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
randomAntvNpmJsXlarge.iteration = 20;
