import { GridLayout } from '@antv/layout';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'grid',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: GridLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
  },
  shouldRender: true,
};

export const gridAntvDevJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
gridAntvDevJsTiny.iteration = 20;

export const gridAntvDevJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
gridAntvDevJsSmall.iteration = 20;

export const gridAntvDevJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
gridAntvDevJsMedium.iteration = 20;

export const gridAntvDevJsLarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
};
gridAntvDevJsLarge.iteration = 20;

export const gridAntvDevJsXlarge: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
};
gridAntvDevJsXlarge.iteration = 20;
