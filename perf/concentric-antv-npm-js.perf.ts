import { ConcentricLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'concentric',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: ConcentricLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const concentricAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const concentricAntvNpmJsSmall = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const concentricAntvNpmJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const concentricAntvNpmJsLarge = createTest(
  commonConfig,
  TestScale.LARGE,
);

export const concentricAntvNpmJsXlarge = createTest(
  commonConfig,
  TestScale.XLARGE,
);
