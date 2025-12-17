import { RadialLayout } from '@antv/layout-npm';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'radial',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: RadialLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {},
  shouldRender: true,
};

export const radialAntvNpmJsTiny = createTest(commonConfig, TestScale.TINY);

export const radialAntvNpmJsSmall = createTest(commonConfig, TestScale.SMALL);

export const radialAntvNpmJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const radialAntvNpmJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const radialAntvNpmJsXlarge = createTest(commonConfig, TestScale.XLARGE);
