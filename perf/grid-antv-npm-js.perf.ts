import { GridLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'grid',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: GridLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const gridAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const gridAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const gridAntvNpmJsMedium = createTest(commonConfig, TestScale.MEDIUM);

export const gridAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

export const gridAntvNpmJsXlarge = createTest(commonConfig, TestScale.XLARGE);
