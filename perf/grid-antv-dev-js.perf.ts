import { GridLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'grid',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: GridLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {},
  shouldRender: true,
};

export const gridAntvDevJsTiny = createTest(commonConfig, TestScale.TINY);

export const gridAntvDevJsSmall = createTest(commonConfig, TestScale.SMALL);

export const gridAntvDevJsMedium = createTest(commonConfig, TestScale.MEDIUM);

export const gridAntvDevJsLarge = createTest(commonConfig, TestScale.LARGE);

export const gridAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
