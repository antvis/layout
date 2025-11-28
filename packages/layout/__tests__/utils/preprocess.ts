import { GraphData } from '@/src/types/data';

interface ViewportConfig {
  width: number;
  height: number;
}

const DEFAULT_COLORS = [
  '#BDD2FD',
  '#BDEFDB',
  '#C2C8D5',
  '#FBE5A2',
  '#F6C3B7',
  '#B6E3F5',
  '#D3C6EA',
  '#FFD8B8',
  '#AAD8D8',
  '#FFD6E7',
];

const DEFAULT_STROKES = [
  '#5B8FF9',
  '#5AD8A6',
  '#5D7092',
  '#F6BD16',
  '#E8684A',
  '#6DC8EC',
  '#9270CA',
  '#FF9D4D',
  '#269A99',
  '#FF99C3',
];

/**
 * 初始化节点位置（网格布局）
 */
export function initializeNodePositions(
  data: GraphData,
  viewport: ViewportConfig,
): void {
  const nodeLength = data.nodes.length;
  const width = viewport.width * 0.85;
  const height = viewport.height * 0.85;

  const horiNum = Math.ceil(Math.sqrt(nodeLength) * (width / height));
  const vertiNum = Math.ceil(nodeLength / horiNum);

  let horiGap = width / (horiNum - 1);
  let vertiGap = height / (vertiNum - 1);

  if (!isFinite(horiGap) || !horiGap) horiGap = 0;
  if (!isFinite(vertiGap) || !vertiGap) vertiGap = 0;

  const beginX = 0;
  const beginY = 0;

  data.nodes.forEach((node: any, i) => {
    if (isNaN(+node.x!)) {
      node.data ||= {};
      node.data.x = (i % horiNum) * horiGap + beginX;
    }
    if (isNaN(+node.y!)) {
      node.data ||= {};
      node.data.y = Math.floor(i / horiNum) * vertiGap + beginY;
    }
  });
}

/**
 * 根据聚类信息为节点分配颜色
 */
export function assignClusterColors(
  data: GraphData,
  colors: string[] = DEFAULT_COLORS,
  strokes: string[] = DEFAULT_STROKES,
): void {
  const clusterMap = new Map<string, number>();
  let clusterId = 0;

  data.nodes.forEach((node: any) => {
    if (node.cluster && clusterMap.get(node.cluster) === undefined) {
      clusterMap.set(node.cluster, clusterId);
      clusterId++;
    }

    const cid = clusterMap.get(node.cluster!);
    if (cid !== undefined) {
      node.style ||= {};
      node.style.fill = colors[cid % colors.length];
      node.style.stroke = strokes[cid % strokes.length];
    }
  });
}

/**
 * 预处理图数据
 */
export function preprocessGraphData(
  data: GraphData,
  viewport: ViewportConfig,
): GraphData {
  initializeNodePositions(data, viewport);
  assignClusterColors(data);
  return data;
}
