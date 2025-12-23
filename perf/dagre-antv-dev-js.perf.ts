import { DagreLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'dagre',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: DagreLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const dagreAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const dagreAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const dagreAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const dagreAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const dagreAntvDevJsXlarge = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
