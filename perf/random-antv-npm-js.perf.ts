import { RandomLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'random',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: RandomLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const randomAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const randomAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const randomAntvNpmJsMedium = createTest(commonConfig, TestScale.MEDIUM);

export const randomAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

export const randomAntvNpmJsXlarge = createTest(commonConfig, TestScale.XLARGE);
