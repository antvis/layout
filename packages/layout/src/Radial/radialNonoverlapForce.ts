import { Graph } from "@antv/graphlib";
import { Point } from "../types";
import { Node, Edge, OutNode } from "../types";

const SPEED_DIVISOR = 800;

export type RadialNonoverlapForceOptions = {
  positions: OutNode[];
  focusID: number;
  radii: number[];
  iterations?: number;
  height?: number;
  width?: number;
  speed?: number;
  gravity?: number;
  k: number;
  strictRadial: boolean;
  nodes: any[];
  nodeSizeFunc: (node: Node) => number;
};

const DEFAULTS_LAYOUT_OPTIONS: Partial<RadialNonoverlapForceOptions> = {
  iterations: 10,
  height: 10,
  width: 10,
  speed: 100,
  gravity: 10,
  k: 5
}

export const radialNonoverlapForce = (graph: Graph<Node, Edge>, options: RadialNonoverlapForceOptions): OutNode[] => {
  const mergedOptions = { ...DEFAULTS_LAYOUT_OPTIONS, ...options };
  const { positions, iterations, width, k, speed, strictRadial, focusId, radii = [], nodeSizeFunc } = mergedOptions;

  const nodes = graph.getAllNodes();

  const disp: Point[] = [];
  const maxDisplace = width / 10;

  for (let i = 0; i < iterations; i++) {
    positions.forEach((_: OutNode, k: number) => {
      disp[k] = { x: 0, y: 0 };
    });
    // 给重叠的节点增加斥力
    getRepulsion(nodes, positions, disp, k, radii, nodeSizeFunc);
    updatePositions(positions, disp, speed, strictRadial, focusId, maxDisplace, width, radii);
  }
  return positions;
}

const getRepulsion = (nodes: Node[], positions: OutNode[], disp: Point[], k: number, radii: number[], nodeSizeFunc: (node: Node) => number) => {
  positions.forEach((v: OutNode, i: number) => {
    disp[i] = { x: 0, y: 0 };
    positions.forEach((u: OutNode, j: number) => {
      if (i === j) {
        return;
      }
      // v and u are not on the same circle, return
      if (radii[i] !== radii[j]) {
        return;
      }
      let vecx = v.x - u.x;
      let vecy = v.y - u.y;
      let vecLength = Math.sqrt(vecx * vecx + vecy * vecy);
      if (vecLength === 0) {
        vecLength = 1;
        const sign = i > j ? 1 : -1;
        vecx = 0.01 * sign;
        vecy = 0.01 * sign;
      }
      // these two nodes overlap
      if (vecLength < nodeSizeFunc(nodes[i]) / 2 + nodeSizeFunc(nodes[j]) / 2) {
        const common = (k * k) / vecLength;
        disp[i].x += (vecx / vecLength) * common;
        disp[i].y += (vecy / vecLength) * common;
      }
    });
  });
}

const updatePositions = (positions: OutNode[], disp: Point[], speed: number, strictRadial: boolean, focusId: number, maxDisplace: number, width: number, radii: number[]) => {
  const maxDisp = maxDisplace || width / 10;
  if (strictRadial) {
    disp.forEach((di, i) => {
      const vx = positions[i].x - positions[focusId].x;
      const vy = positions[i].y - positions[focusId].y;
      const vLength = Math.sqrt(vx * vx + vy * vy);
      let vpx = vy / vLength;
      let vpy = -vx / vLength;
      const diLength = Math.sqrt(di.x * di.x + di.y * di.y);
      let alpha = Math.acos((vpx * di.x + vpy * di.y) / diLength);
      if (alpha > Math.PI / 2) {
        alpha -= Math.PI / 2;
        vpx *= -1;
        vpy *= -1;
      }
      const tdispLength = Math.cos(alpha) * diLength;
      di.x = vpx * tdispLength;
      di.y = vpy * tdispLength;
    });
  }

  // move
  positions.forEach((n, i) => {
    if (i === focusId) {
      return;
    }
    const distLength = Math.sqrt(disp[i].x * disp[i].x + disp[i].y * disp[i].y);
    if (distLength > 0 && i !== focusId) {
      const limitedDist = Math.min(maxDisp * (speed / SPEED_DIVISOR), distLength);
      n.x += (disp[i].x / distLength) * limitedDist;
      n.y += (disp[i].y / distLength) * limitedDist;
      if (strictRadial) {
        let vx = n.x - positions[focusId].x;
        let vy = n.y - positions[focusId].y;
        const nfDis = Math.sqrt(vx * vx + vy * vy);
        vx = (vx / nfDis) * radii[i];
        vy = (vy / nfDis) * radii[i];
        n.x = positions[focusId].x + vx;
        n.y = positions[focusId].y + vy;
      }
    }
  });
  return positions;
}