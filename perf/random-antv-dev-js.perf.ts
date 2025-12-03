import { RandomLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'random',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: RandomLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const randomAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const randomAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const randomAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

export const randomAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

export const randomAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
