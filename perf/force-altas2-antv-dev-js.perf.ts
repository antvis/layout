import { ForceAtlas2Layout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'forceAtlas2',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: ForceAtlas2Layout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    animate: false,
  },
  shouldRender: true,
};

export const forceAtlas2AntvDevJsTiny = createTest(
  commonConfig,
  TestScale.TINY,
);

export const forceAtlas2AntvDevJsSmall = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const forceAtlas2AntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const forceAtlas2AntvDevJsLarge = createTest(
//   commonConfig,
//   TestScale.LARGE,
// );

// export const forceAtlas2AntvDevJsXlarge = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
