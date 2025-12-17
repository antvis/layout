import { Graph } from '@antv/graphlib';
import type { LayoutMapping } from '@antv/layout';
import { Test } from 'iperf';
import { CANVAS_SIZE } from './constants';
import { loadRandomClusters } from './datasets';

/**
 * 数据格式类型
 */
export enum DataFormat {
  /** 纯对象格式：{ nodes: [], edges: [] } */
  PLAIN_OBJECT = 'plainObject',
  /** Graphlib 实例格式：new Graph({ nodes, edges }) */
  GRAPHLIB = 'graphlib',
}

export enum TestScale {
  TINY = 'tiny',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  XLARGE = 'xlarge',
}

/**
 * 测试数量级配置
 */
export interface ITestScale {
  /** 测试名称后缀 */
  name: string;
  /** 节点数量 */
  nodeCount: number;
  /** 边数量 */
  edgeCount: number;
}

/**
 * 布局配置选项
 */
export interface LayoutOptions {
  [key: string]: any;
}

/**
 * 高阶函数配置
 */
export interface CreatePerfTestsConfig<T = any> {
  /** 布局名称 */
  layoutName: string;
  /** 来源（如 antv, graphology 等） */
  source: string;
  /** 版本号 */
  version: string;
  /** 实现方式（如 js, gpu, wasm 等） */
  implementation: string;
  /** 布局类构造函数 */
  LayoutClass: new (options: LayoutOptions) => T;
  /** 数据格式 */
  dataFormat: DataFormat;
  /** 测试数量级 */
  scale: TestScale;
  /** 布局配置选项（不含 maxIteration） */
  layoutOptions?: LayoutOptions;
  /** 默认迭代次数 */
  defaultIterations?: number;
  /** 是否需要渲染结果 */
  shouldRender?: boolean;
  /** 导出函数名前缀（用于保证唯一性，默认从文件名生成） */
  exportPrefix?: string;
  /** 自定义执行方法（用于特殊的执行逻辑，如 tick/stop） */
  customExecute?: (layout: T, graph: any) => Promise<LayoutMapping>;
}

/**
 * 默认测试数量级配置
 */
export const DEFAULT_SCALES: Record<TestScale, ITestScale> = {
  [TestScale.TINY]: { name: 'tiny', nodeCount: 100, edgeCount: 100 },
  [TestScale.SMALL]: { name: 'small', nodeCount: 500, edgeCount: 500 },
  [TestScale.MEDIUM]: { name: 'medium', nodeCount: 2000, edgeCount: 2000 },
  [TestScale.LARGE]: { name: 'large', nodeCount: 10000, edgeCount: 10000 },
  [TestScale.XLARGE]: { name: 'xlarge', nodeCount: 20000, edgeCount: 20000 },
};

/**
 * 渲染结果到 canvas
 */
function renderToCanvas(result: LayoutMapping, container: HTMLElement) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;

  // Render nodes
  result.nodes.forEach((node: any) => {
    const x = node.data?.x || node.x;
    const y = node.data?.y || node.y;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#5B8FF9';
    ctx.fill();
  });

  // Render edges
  result.edges.forEach((edge) => {
    const sourceNode: any = result.nodes.find((n) => n.id === edge.source);
    const targetNode: any = result.nodes.find((n) => n.id === edge.target);
    if (sourceNode && targetNode) {
      const sourceX = sourceNode.data?.x || sourceNode.x;
      const sourceY = sourceNode.data?.y || sourceNode.y;
      const targetX = targetNode.data?.x || targetNode.x;
      const targetY = targetNode.data?.y || targetNode.y;
      ctx.beginPath();
      ctx.moveTo(sourceX, sourceY);
      ctx.lineTo(targetX, targetY);
      ctx.strokeStyle = '#CCC';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

/**
 * 创建单个性能测试函数的辅助函数
 */
export async function runPerfTest<T = any>(
  context: { perf: any; container: HTMLElement },
  config: {
    scale: TestScale;
    layoutName: string;
    source: string;
    version: string;
    implementation: string;
    LayoutClass: new (options: LayoutOptions) => T;
    dataFormat: DataFormat;
    layoutOptions?: LayoutOptions;
    shouldRender?: boolean;
    customExecute?: (layout: T, graph: any) => Promise<LayoutMapping>;
  },
): Promise<void> {
  const { perf, container } = context;
  const {
    scale,
    layoutName,
    source,
    version,
    implementation,
    LayoutClass,
    dataFormat,
    layoutOptions = {},
    shouldRender = true,
    customExecute,
  } = config;

  // 生成测试图数据
  const scaleConfig = DEFAULT_SCALES[scale];
  let graph = loadRandomClusters(scaleConfig.nodeCount, scaleConfig.edgeCount);

  const layout = new LayoutClass({
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    ...layoutOptions,
  });

  let result: LayoutMapping;

  // 测试名称
  const perfTestName = `${layoutName}-${source}-${version}-${implementation} (${scaleConfig.name}: ${scaleConfig.nodeCount} nodes, ${scaleConfig.edgeCount} edges)`;

  // 执行性能测试
  await perf.evaluate(perfTestName, async () => {
    if (dataFormat === DataFormat.GRAPHLIB) {
      graph = new Graph(graph);
    }
    if (customExecute) {
      result = await customExecute(layout, graph);
    } else {
      result = await (layout as any).execute(graph);
    }
  });

  if (!result) {
    result = calculatePositions(layout);
  }

  console.log(`Layout ${perfTestName} completed.`, result);

  // 渲染结果
  if (shouldRender && result!) {
    renderToCanvas(result, container);
  }
}

export function calculatePositions(layout: any) {
  const results: any = {
    nodes: [],
    edges: [],
  };
  layout.forEachNode((node: any) => {
    results.nodes.push(node);
  });
  layout.forEachEdge((edge: any) => {
    results.edges.push(edge);
  });
  return results;
}

/**
 * 从文件名解析布局信息
 * 文件名格式: layoutName-source-version-implementation.perf.ts
 *
 * @example
 * parseLayoutFileName('fruchterman-antv-dev-js.perf.ts')
 * // 返回: { layoutName: 'fruchterman', source: 'antv', version: 'dev', implementation: 'js' }
 */
export function parseLayoutFileName(fileName: string) {
  const match = fileName.match(/^(.+)-(.+)-(.+)-(.+)\.perf\.ts$/);
  if (!match) {
    throw new Error(
      `Invalid file name format: ${fileName}. Expected format: layoutName-source-version-implementation.perf.ts`,
    );
  }

  const [, layoutName, source, version, implementation] = match;
  return { layoutName, source, version, implementation };
}

export function createTest(config: any, scale: TestScale): Test {
  const test: Test = async (context) => {
    await runPerfTest(context, { ...config, scale });
  };
  test.iteration = 10;
  return test;
}
