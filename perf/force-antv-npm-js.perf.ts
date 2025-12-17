import { ForceLayout } from '@antv/layout-npm';
import type { Test } from 'iperf';
import { createTest, DataFormat, TestScale } from './utils';

const commonConfig = {
  layoutName: 'force',
  source: 'antv',
  version: '1.2.14_beta_8',
  implementation: 'js',
  LayoutClass: ForceLayout,
  dataFormat: DataFormat.GRAPHLIB,
  layoutOptions: {
    animate: false,
  },
  shouldRender: true,
  customExecute: async (layout: any, graph: any) => {
    layout.execute(graph);
    layout.stop();
    return await layout.tick(500);
  },
};

export const forceAntvNpmJsTiny: Test = createTest(
  commonConfig,
  TestScale.TINY,
);

export const forceAntvNpmJsSmall: Test = createTest(
  commonConfig,
  TestScale.SMALL,
);

export const forceAntvNpmJsMedium: Test = createTest(
  commonConfig,
  TestScale.MEDIUM,
);

// export const forceAntvNpmJsLarge: Test = createTest(
//   commonConfig,
//   TestScale.LARGE,
// );

// export const forceAntvNpmJsXlarge: Test = createTest(
//   commonConfig,
//   TestScale.XLARGE,
// );
