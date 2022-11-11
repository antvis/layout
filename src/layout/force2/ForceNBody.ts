import { quadtree } from 'd3-quadtree';
import { NodeMap } from '..';

const theta2 = 0.81; // Barnes-Hut approximation threshold
const epsilon = 0.1; // 为了防止出现除0的情况，加一个epsilon

interface Node {
  x: number;
  y: number;
}

interface InternalNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  weight: number;
  size: number;
}

export function forceNBody(
  nodes: Node[],
  nodeMap: NodeMap,
  factor: number,
  coulombDisScale2: number,
  accArray: number[]
) {
  const weightParam = factor / coulombDisScale2;
  const data = nodes.map((n, i) => {
    // @ts-ignore
    const mappedNode = nodeMap[n.id];
    // @ts-ignore
    const { data: nodeData, x, y, size } = mappedNode;
    const { nodeStrength } = nodeData.layout.force;
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
    // @ts-ignore
    const mappedNode = nodeMap[nodes[i].id];
    // @ts-ignore
    const { mass = 1 } = mappedNode.data.layout.force;
    // 从 0 开始，= 初始化 + 加斥力
    accArray[2 * i] = n.vx / mass;
    accArray[2 * i + 1] = n.vy / mass;
  });
  return accArray;
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
