import { CircularLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'circular',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: CircularLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const circularAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const circularAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const circularAntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const circularAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

export const circularAntvDevJsXlarge = createTest(
  commonConfig,
  TestScale.XLARGE,
);
