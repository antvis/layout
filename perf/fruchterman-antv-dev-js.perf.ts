import { FruchtermanLayout } from '@antv/layout';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'fruchterman',
  source: 'antv',
  version: 'dev',
  implementation: 'js',
  LayoutClass: FruchtermanLayout,
  dataFormat: DataFormat.PLAIN_OBJECT,
  layoutOptions: {
    gravity: 1,
    speed: 5,
    animate: false,
  },
  shouldRender: true,
};

export const fruchtermanAntvDevJsTiny = createTest(
  commonConfig,
  TestScale.TINY,
);

export const fruchtermanAntvDevJsSmall = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const fruchtermanAntvDevJsMedium = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const fruchtermanAntvDevJsLarge = createTest(
  commonConfig,
  TestScale.LARGE,
);

// export const fruchtermanAntvDevJsXlarge = createTest(commonConfig, TestScale.XLARGE);
