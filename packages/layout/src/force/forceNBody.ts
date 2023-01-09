import { quadtree } from 'd3-quadtree';
import { Point } from '../types';
import { CalcGraph } from './types';

const theta2 = 0.81; // Barnes-Hut approximation threshold
const epsilon = 0.1; // 为了防止出现除0的情况，加一个epsilon

interface InternalNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weight: number;
  size: number;
}

export function forceNBody(
  calcGraph: CalcGraph,
  factor: number,
  coulombDisScale2: number,
  accMap: { [id: string]: Point }
) {
  const weightParam = factor / coulombDisScale2;
  const calcNodes = calcGraph.getAllNodes();
  const data = calcNodes.map((calcNode, i) => {
    const { nodeStrength, x, y, size } = calcNode.data;
    return {
      x,
      y,
      size,
      index: i,
      vx: 0,
      vy: 0,
      weight: weightParam * nodeStrength,
    };
  });

  const tree = quadtree(
    data,
    (d: any) => d.x,
    (d: any) => d.y,
  ).visitAfter(accumulate); // init internal node

  data.forEach((n) => {
    // @ts-ignore
    computeForce(n, tree);
  });

  data.map((n, i) => {
    const { id, data } = calcNodes[i];
    const { mass = 1 } = data;
    // 从 0 开始，= 初始化 + 加斥力
    accMap[id] = {
      x: n.vx / mass,
      y: n.vy / mass
    };
  });
  return accMap;
}

// @ts-ignore
function accumulate(quad) {
  let accWeight = 0;
  let accX = 0;
  let accY = 0;

  if (quad.length) {
    // internal node, accumulate 4 child quads
    for (let i = 0; i < 4; i++) {
      const q = quad[i];
      if (q && q.weight) {
        accWeight += q.weight;
        accX += q.x * q.weight;
        accY += q.y * q.weight;
      }
    }
    quad.x = accX / accWeight;
    quad.y = accY / accWeight;
    quad.weight = accWeight;
  } else {
    // leaf node
    const q = quad;
    quad.x = q.data.x;
    quad.y = q.data.y;
    quad.weight = q.data.weight;
  }
}

// @ts-ignore
const apply = (quad, x1: number, y1: number, x2: number, y2: number, node: InternalNode) => {
  const dx = (node.x - quad.x) || epsilon;
  const dy = (node.y - quad.y) || epsilon;
  const width = x2 - x1;
  const len2 = dx * dx + dy * dy;
  const len3 = Math.sqrt(len2) * len2;

  // far node, apply Barnes-Hut approximation
  if ((width * width) * theta2 < len2) {
    const param = quad.weight / len3;
    node.vx += dx * param;
    node.vy += dy * param;
    return true;
  }
  // near quad, compute force directly
  if (quad.length) return false; // internal node, visit children

  // leaf node

  if (quad.data !== node) {
    const param = quad.data.weight / len3;
    node.vx += dx * param;
    node.vy += dy * param;
  }
};

// @ts-ignore
function computeForce(node: InternalNode, tree) {
  // @ts-ignore
  tree.visit((quad, x1, y1, x2, y2) => apply(quad, x1, y1, x2, y2, node));
}