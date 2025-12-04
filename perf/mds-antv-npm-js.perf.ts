import { MDSLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'mds',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: MDSLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const mdsAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const mdsAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const mdsAntvNpmJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const mdsAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const mdsAntvNpmJsXlarge = createTest(commonConfig, TestScale.XLARGE);
