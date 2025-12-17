import { ConcentricLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'concentric',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: ConcentricLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const concentricAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const concentricAntvDevJsSmall = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const concentricAntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const concentricAntvDevJsLarge = createTest(
  commonConfig,
  TestScale.LARGE,
);

export const concentricAntvDevJsXlarge = createTest(
  commonConfig,
  TestScale.XLARGE,
);
