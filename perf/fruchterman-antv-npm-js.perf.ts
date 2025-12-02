import { FruchtermanLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { CANVAS_SIZE } from './utils';
import { DataFormat, runPerfTest, TestScale } from './utils/createPerfTests';

const commonConfig = {
  layoutName: 'fruchterman',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: FruchtermanLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    dimensions: 2,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    gravity: 1,
    speed: 5,
    animate: false,
  },
  shouldRender: true,
  // 自定义执行逻辑：使用 tick/stop 模式
  customExecute: async (layout: any, graph: any) => {
    layout.execute(graph);
    layout.stop();
    return await layout.tick(500 - 1);
  },
};

export const fruchtermanAntvNpmJsTiny: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.TINY });
};
fruchtermanAntvNpmJsTiny.iteration = 10;

export const fruchtermanAntvNpmJsSmall: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.SMALL });
};
fruchtermanAntvNpmJsSmall.iteration = 10;

export const fruchtermanAntvNpmJsMedium: Test = async (context) => {
  await runPerfTest(context, { ...commonConfig, scale: TestScale.MEDIUM });
};
fruchtermanAntvNpmJsMedium.iteration = 10;

// export const fruchtermanAntvNpmJsLarge: Test = async (context) => {
//   await runPerfTest(context, { ...commonConfig, scale: TestScale.LARGE });
// };
// fruchtermanAntvNpmJsLarge.iteration = 10;

// export const fruchtermanAntvNpmJsXlarge: Test = async (context) => {
//   await runPerfTest(context, { ...commonConfig, scale: TestScale.XLARGE });
// };
// fruchtermanAntvNpmJsXlarge.iteration = 10;
