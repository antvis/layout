import { MDSLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'mds',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: MDSLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const mdsAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const mdsAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const mdsAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

// export const mdsAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

// export const mdsAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
