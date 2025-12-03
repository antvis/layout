import { D3ForceLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE, createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'd3force',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: D3ForceLayout,
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

export const d3forceAntvNpmJsTiny: Test = createTest(
  commonConfig,
  TestScale.TINY,
);

export const d3forceAntvNpmJsSmall: Test = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const d3forceAntvNpmJsMedium: Test = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const d3forceAntvNpmJsLarge: Test = createTest(
  commonConfig,
  TestScale.LARGE,
);

// export const d3forceAntvNpmJsXlarge: Test = createTest(commonConfig, TestScale.XLARGE);
