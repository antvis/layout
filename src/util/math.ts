import { Matrix, Model, IndexMap, Edge, Node, OutNode, Degree, NodeMap } from '../layout/types';
import { isArray } from './array';
import { isNumber } from './number';
import { isObject } from './object';

export const getEdgeTerminal = (edge: Edge, type: 'source' | 'target') => {
  const terminal = edge[type];
  if (isObject(terminal)) {
    return terminal.cell;
  }
  return terminal;
};

export const getDegree = (n: number, nodeIdxMap: IndexMap, edges: Edge[] | null) => {
  const degrees: Degree[] = [];
  for (let i = 0; i < n; i++) {
    degrees[i] = {
      in: 0,
      out: 0,
      all: 0
    };
  }
  if (!edges) return degrees;
  edges.forEach((e) => {
    const source = getEdgeTerminal(e, 'source');
    const target = getEdgeTerminal(e, 'target');
    if (source && degrees[nodeIdxMap[source]]) {
      degrees[nodeIdxMap[source]].out += 1;
      degrees[nodeIdxMap[source]].all += 1;
    }
    if (target && degrees[nodeIdxMap[target]]) {
      degrees[nodeIdxMap[target]].in += 1;
      degrees[nodeIdxMap[target]].all += 1;
    }
  });
  return degrees;
};

export const getDegreeMap = (nodes: Node[], edges: Edge[] | null) => {
  const degreesMap: { [id: string]: Degree } = {};
  nodes.forEach((node) => {
    degreesMap[node.id] = {
      in: 0,
      out: 0,
      all: 0
    };
  });

  if (!edges) return degreesMap;
  edges.forEach((e) => {
    const source = getEdgeTerminal(e, 'source');
    const target = getEdgeTerminal(e, 'target');
    if (source) {
      degreesMap[source].out += 1;
      degreesMap[source].all += 1;
    }
    if (target) {
      degreesMap[target].in += 1;
      degreesMap[target].all += 1;
    }
  });
  return degreesMap;
};

export const floydWarshall = (adjMatrix: Matrix[]): Matrix[] => {
  // initialize
  const dist: Matrix[] = [];
  const size = adjMatrix.length;
  for (let i = 0; i < size; i += 1) {
    dist[i] = [];
    for (let j = 0; j < size; j += 1) {
      if (i === j) {
        dist[i][j] = 0;
      } else if (adjMatrix[i][j] === 0 || !adjMatrix[i][j]) {
        dist[i][j] = Infinity;
      } else {
        dist[i][j] = adjMatrix[i][j];
      }
    }
  }
  // floyd
  for (let k = 0; k < size; k += 1) {
    for (let i = 0; i < size; i += 1) {
      for (let j = 0; j < size; j += 1) {
        if (dist[i][j] > dist[i][k] + dist[k][j]) {
          dist[i][j] = dist[i][k] + dist[k][j];
        }
      }
    }
  }
  return dist;
};

export const getAdjMatrix = (data: Model, directed: boolean): Matrix[] => {
  const {
    nodes,
    edges
  } = data;
  const matrix: Matrix[] = [];
  // map node with index in data.nodes
  const nodeMap: {
    [key: string]: number;
  } = {};

  if (!nodes) {
    throw new Error('invalid nodes data!');
  }
  if (nodes) {
    nodes.forEach((node, i) => {
      nodeMap[node.id] = i;
      const row: number[] = [];
      matrix.push(row);
    });
  }

  edges?.forEach((e) => {
    const source = getEdgeTerminal(e, 'source');
    const target = getEdgeTerminal(e, 'target');
    const sIndex = nodeMap[source as string];
    const tIndex = nodeMap[target as string];
    if (sIndex === undefined || tIndex === undefined) return;
    matrix[sIndex][tIndex] = 1;
    if (!directed) {
      matrix[tIndex][sIndex] = 1;
    }
  });
  return matrix;
};

/**
 * scale matrix
 * @param matrix [ [], [], [] ]
 * @param ratio
 */
export const scaleMatrix = (matrix: Matrix[], ratio: number) => {
  const result: Matrix[] = [];
  matrix.forEach((row) => {
    const newRow: number[] = [];
    row.forEach((v) => {
      newRow.push(v * ratio);
    });
    result.push(newRow);
  });
  return result;
};

/**
 * depth first traverse, from leaves to root, children in inverse order
 *  if the fn returns false, terminate the traverse
 */
const traverseUp = <T extends { children?: T[] }>(data: T, fn: (param: T) => boolean) => {
  if (data && data.children) {
    for (let i = data.children.length - 1; i >= 0; i--) {
      if (!traverseUp(data.children[i], fn)) return;
    }
  }

  if (!fn(data)) {
    return false;
  }
  return true;
};

/**
 * depth first traverse, from leaves to root, children in inverse order
 * if the fn returns false, terminate the traverse
 */
export const traverseTreeUp = <T extends { children?: T[] }>(
  data: T,
  fn: (param: T) => boolean,
) => {
  if (typeof fn !== 'function') {
    return;
  }
  traverseUp(data, fn);
};

/**
 * calculate the bounding box for the nodes according to their x, y, and size
 * @param nodes nodes in the layout
 * @returns 
 */
export const getLayoutBBox = (nodes: OutNode[]) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    let size = node.size;
    if (isArray(size)) {
      if (size.length === 1) size = [size[0], size[0]];
    }  else if (isNumber(size)) {
      size = [size, size];
    } else if (size === undefined || isNaN(size as any)) {
      size = [30, 30];
    }

    const halfSize = [size[0] / 2, size[1] / 2];
    const left = node.x - halfSize[0];
    const right = node.x + halfSize[0];
    const top = node.y - halfSize[1];
    const bottom = node.y + halfSize[1];

    if (minX > left) minX = left;
    if (minY > top) minY = top;
    if (maxX < right) maxX = right;
    if (maxY < bottom) maxY = bottom;
  });
  return { minX, minY, maxX, maxY };
};

/**
 * 获取节点集合的平均位置信息
 * @param nodes 节点集合
 * @returns 平局内置
 */
export const getAvgNodePosition = (nodes: OutNode[]) => {
  const totalNodes = { x: 0, y: 0 };
  nodes.forEach((node) => {
    totalNodes.x += node.x || 0;
    totalNodes.y += node.y || 0;
  });
  // 获取均值向量
  const length = nodes.length || 1;
  return {
    x: totalNodes.x / length,
    y: totalNodes.y / length,
  };
};

// 找出指定节点关联的边的起点或终点
const getCoreNode = (type: 'source' | 'target', node: Node, edges: Edge[]) => {
  if (type === 'source') {
    return (edges?.find((edge) => edge.target === node.id)?.source || {}) as Node;
  }
  return (edges?.find((edge) => edge.source === node.id)?.target || {}) as Node;
};

// 找出指定节点为起点或终点的所有一度叶子节点
const getRelativeNodeIds = (type: 'source' | 'target' | 'both', coreNode: Node, edges: Edge[]) => {
  let relativeNodes: string[] = [];
  switch (type) {
    case 'source':
      relativeNodes = edges?.filter((edge) => edge.source === coreNode.id).map((edge) => edge.target);
      break;
    case 'target':
      relativeNodes = edges?.filter((edge) => edge.target === coreNode.id).map((edge) => edge.source);
      break;
    case 'both':
      relativeNodes = edges
        ?.filter((edge) => edge.source === coreNode.id)
        .map((edge) => edge.target)
        .concat(edges?.filter((edge) => edge.target === coreNode.id).map((edge) => edge.source));
      break;
    default:
      break;
  }
  // 去重
  const set = new Set(relativeNodes);
  return Array.from(set);
};
// 找出同类型的节点
const getSameTypeNodes = (type: 'leaf' | 'all', nodeClusterBy: string, node: Node, relativeNodes: Node[], degreesMap: { [id: string]: Degree }) => {
  // @ts-ignore
  const typeName = node[nodeClusterBy] || '';
  // @ts-ignore
  let sameTypeNodes = relativeNodes?.filter((item) => item[nodeClusterBy] === typeName) || [];
  if (type === 'leaf') {
    sameTypeNodes = sameTypeNodes.filter((node) => degreesMap[node.id]?.in === 0 ||degreesMap[node.id]?.out === 0);
  }
  return sameTypeNodes;
};


// 找出与指定节点关联的边的起点或终点出发的所有一度叶子节点
export const getCoreNodeAndRelativeLeafNodes = (type: 'leaf' | 'all', node: Node, edges: Edge[], nodeClusterBy: string, degreesMap: { [id: string]: Degree }, nodeMap: NodeMap) => {
  const { in: inDegree, out: outDegree } = degreesMap[node.id];
  let coreNode: Node = node;
  let relativeLeafNodes: Node[] = [];
  if (inDegree === 0) {
    // 如果为没有出边的叶子节点，则找出与它关联的边的起点出发的所有一度节点
    coreNode = getCoreNode('source', node, edges);
    relativeLeafNodes = getRelativeNodeIds('both', coreNode, edges).map((nodeId) => nodeMap[nodeId]);
  } else if (outDegree === 0) {
    // 如果为没有入边边的叶子节点，则找出与它关联的边的起点出发的所有一度节点
    coreNode = getCoreNode('target', node, edges);
    relativeLeafNodes = getRelativeNodeIds('both', coreNode, edges).map((nodeId) => nodeMap[nodeId]);
  }
  relativeLeafNodes = relativeLeafNodes.filter(
    (node) => degreesMap[node.id] && (degreesMap[node.id].in === 0 || degreesMap[node.id].out === 0),
  );
  const sameTypeLeafNodes = getSameTypeNodes(type, nodeClusterBy, node, relativeLeafNodes, degreesMap);
  return { coreNode, relativeLeafNodes, sameTypeLeafNodes };
};