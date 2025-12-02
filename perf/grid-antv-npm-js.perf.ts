import { GridLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'grid',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: GridLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const gridAntvNpmJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
gridAntvNpmJsTiny.iteration = 20;

export const gridAntvNpmJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
gridAntvNpmJsSmall.iteration = 20;

export const gridAntvNpmJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
gridAntvNpmJsMedium.iteration = 20;

export const gridAntvNpmJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
gridAntvNpmJsLarge.iteration = 20;

export const gridAntvNpmJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
gridAntvNpmJsXlarge.iteration = 20;
