import { D3Force3DLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE, createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'd3force3d',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: D3Force3DLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    center: {
      x: CANVAS_SIZE / 2,
      y: CANVAS_SIZE / 2,
    },
    x: {
      x: CANVAS_SIZE / 2,
    },
    y: {
      y: CANVAS_SIZE / 2,
    },
  },
  shouldRender: true,
};

export const d3force3dAntvNpmJsTiny: Test = createTest(
  commonConfig,
  TestScale.TINY,
);

export const d3force3dAntvNpmJsSmall: Test = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const d3force3dAntvNpmJsMedium: Test = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const d3force3dAntvNpmJsLarge: Test = createTest(
//   commonConfig,
//   TestScale.LARGE,
// );

// export const d3force3dAntvNpmJsXlarge: Test = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
