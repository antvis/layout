import { D3ForceLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'd3force',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: D3ForceLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const d3forceAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const d3forceAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const d3forceAntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const d3forceAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const d3forceAntvDevJsXlarge = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
