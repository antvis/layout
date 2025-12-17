import { RadialLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'radial',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: RadialLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const radialAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const radialAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const radialAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const radialAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const radialAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
