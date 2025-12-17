import { D3Force3DLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'd3force3d',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: D3Force3DLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const d3force3dAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const d3force3dAntvDevJsSmall = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const d3force3dAntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const d3force3dAntvDevJsLarge = createTest(
//   commonConfig,
//   TestScale.LARGE,
// );

// export const d3force3dAntvDevJsXlarge = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
