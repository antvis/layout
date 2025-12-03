import { FruchtermanLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'fruchterman',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: FruchtermanLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    dimensions: 2,
    gravity: 1,
    speed: 5,
    animate: false,
  },
  shouldRender: true,
  // 自定义执行逻辑：使用 tick/stop 模式
  customExecute: async (layout: any, graph: any) => {
    layout.execute(graph);
    layout.stop();
    return await layout.tick(500);
  },
};

export const fruchtermanAntvNpmJsTiny: Test = createTest(
  commonConfig,
  TestScale.TINY,
);

export const fruchtermanAntvNpmJsSmall: Test = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const fruchtermanAntvNpmJsMedium: Test = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

export const fruchtermanAntvNpmJsLarge: Test = createTest(
  commonConfig,
  TestScale.LARGE,
);

// export const fruchtermanAntvNpmJsXlarge: Test = createTest(commonConfig, TestScale.XLARGE);
