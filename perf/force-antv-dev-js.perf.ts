import { ForceLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'force',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: ForceLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    animate: false,
  },
  shouldRender: true,
};

export const forceAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const forceAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const forceAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const forceAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const forceAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
