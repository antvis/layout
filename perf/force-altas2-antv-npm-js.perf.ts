import { ForceAtlas2Layout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'forceAtlas2',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: ForceAtlas2Layout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    animate: false,
  },
  shouldRender: true,
};

export const forceAtlas2AntvNpmJsTiny: Test = createTest(
  commonConfig,
  TestScale.TINY,
);

export const forceAtlas2AntvNpmJsSmall: Test = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const forceAtlas2AntvNpmJsMedium: Test = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const forceAtlas2AntvNpmJsLarge: Test = createTest(
//   commonConfig,
//   TestScale.LARGE,
// );

// export const forceAtlas2AntvNpmJsXlarge: Test = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
