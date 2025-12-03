import { CircularLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'circular',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: CircularLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const circularAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const circularAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const circularAntvNpmJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const circularAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

export const circularAntvNpmJsXlarge = createTest(
  commonConfig,
  TestScale.XLARGE,
);
