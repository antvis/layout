import { isNumber } from '@antv/util';
import { quadtree } from 'd3-quadtree';
import type { ID } from '../../types';
import type { GraphLib } from '../../model/data';
import type { AccMap } from './types';

type CollideDatum2D = {
  id: ID;
  index: number;
  x: number;
  y: number;
  r: number;
  mass: number;
  fx?: number | null;
  fy?: number | null;
};

type CollideDatum3D = CollideDatum2D & {
  z: number;
  fz?: number | null;
};

const EPSILON = 1e-6;
const COLLIDE_SCALE = 500;

/**
 * Collision force to prevent node overlap.
 */
export function forceCollide(dimensions: number = 2) {
  let strength: number = 1;

  function force(model: GraphLib, accMap: AccMap) {
    const nodes = model.nodes();
    if (nodes.length < 2 || strength <= 0) return;

    if (dimensions === 2) {
      const data: CollideDatum2D[] = nodes.map((node, index) => {
        return {
          id: node.id,
          index,
          x: node.x,
          y: node.y,
          r: Number(node.size) / 2,
          mass: node.mass || 1,
          fx: node.fx,
          fy: node.fy,
        };
      });

      const tree = quadtree<CollideDatum2D>(
        data,
        (d) => d.x,
        (d) => d.y,
      ).visitAfter(accumulate2D);

      for (const node of data) {
        tree.visit(
          (quad: any, x0: number, y0: number, x1: number, y1: number) => {
            const quadR = quad.r || 0;
            const searchR = node.r + quadR;
            if (
              x0 > node.x + searchR ||
              x1 < node.x - searchR ||
              y0 > node.y + searchR ||
              y1 < node.y - searchR
            ) {
              return true;
            }

            if (!quad.data) return false;

            let q: any = quad;
            do {
              const other: CollideDatum2D = q.data;
              if (other && other.index > node.index) {
                collide2D(node, other, accMap);
              }
              q = q.next;
            } while (q);

            return false;
          },
        );
      }

      return;
    }

    const data3d: CollideDatum3D[] = nodes.map((node, index) => {
      return {
        id: node.id,
        index,
        x: node.x,
        y: node.y,
        z: node.z ?? 0,
        r: Number(node.size) / 2,
        mass: node.mass || 1,
        fx: node.fx,
        fy: node.fy,
        fz: node.fz,
      };
    });

    for (let i = 0; i < data3d.length; i++) {
      for (let j = i + 1; j < data3d.length; j++) {
        collide3D(data3d[i], data3d[j], accMap);
      }
    }
  }

  function invMass2D(d: CollideDatum2D): number {
    const fixed = isNumber(d.fx) && isNumber(d.fy);
    return fixed ? 0 : 1 / (d.mass || 1);
  }

  function invMass3D(d: CollideDatum3D): number {
    const fixed = isNumber(d.fx) && isNumber(d.fy) && isNumber(d.fz);
    return fixed ? 0 : 1 / (d.mass || 1);
  }

  function collide2D(a: CollideDatum2D, b: CollideDatum2D, accMap: AccMap) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dist = Math.hypot(dx, dy);

    const minDist = a.r + b.r;
    if (dist >= minDist) return;

    if (dist < EPSILON) {
      dx = a.index < b.index ? EPSILON : -EPSILON;
      dy = 0;
      dist = Math.abs(dx);
    }

    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    const f = overlap * strength * COLLIDE_SCALE;

    const ia = invMass2D(a);
    const ib = invMass2D(b);

    if (ia) {
      accMap[a.id].x += nx * f * ia;
      accMap[a.id].y += ny * f * ia;
    }
    if (ib) {
      accMap[b.id].x -= nx * f * ib;
      accMap[b.id].y -= ny * f * ib;
    }
  }

  function collide3D(a: CollideDatum3D, b: CollideDatum3D, accMap: AccMap) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dz = a.z - b.z;
    let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const minDist = a.r + b.r;
    if (dist >= minDist) return;

    if (dist < EPSILON) {
      dx = a.index < b.index ? EPSILON : -EPSILON;
      dy = 0;
      dz = 0;
      dist = Math.abs(dx);
    }

    const overlap = minDist - dist;
    const nx = dx / dist;
    const ny = dy / dist;
    const nz = dz / dist;
    const f = overlap * strength * COLLIDE_SCALE;

    const ia = invMass3D(a);
    const ib = invMass3D(b);

    if (ia) {
      accMap[a.id].x += nx * f * ia;
      accMap[a.id].y += ny * f * ia;
      accMap[a.id].z += nz * f * ia;
    }
    if (ib) {
      accMap[b.id].x -= nx * f * ib;
      accMap[b.id].y -= ny * f * ib;
      accMap[b.id].z -= nz * f * ib;
    }
  }

  force.dimensions = function (_?: number) {
    return arguments.length ? ((dimensions = _!), force) : dimensions;
  };

  force.strength = function (_?: number) {
    return arguments.length ? ((strength = _!), force) : strength;
  };

  return force;
}

function accumulate2D(quad: any) {
  let r = 0;

  if (quad.length) {
    for (let i = 0; i < quad.length; i++) {
      const c = quad[i];
      if (c && c.r > r) r = c.r;
    }
  } else if (quad.data) {
    r = quad.data.r || 0;
    let next = quad.next;
    while (next) {
      r = Math.max(r, next.data?.r || 0);
      next = next.next;
    }
  }

  quad.r = r;
}
