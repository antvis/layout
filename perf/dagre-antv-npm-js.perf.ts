import { DagreLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'dagre',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: DagreLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const dagreAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const dagreAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const dagreAntvNpmJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const dagreAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const dagreAntvNpmJsXlarge = createTest(commonConfig, TestScale.XLARGE);
