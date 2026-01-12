import type { LayoutNode, NodeData } from '../../types';
import {
  applySingleNodeLayout,
  normalizeViewport,
  orderByDegree,
  orderBySorter,
} from '../../util';
import { formatFn, formatNodeSizeFn } from '../../util/format';
import { BaseLayout } from '../base-layout';
import type { ConcentricLayoutOptions } from './types';

export type { ConcentricLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<ConcentricLayoutOptions> = {
  nodeSize: 30,
  nodeSpacing: 10,
  preventOverlap: false,
  sweep: undefined,
  equidistant: false,
  startAngle: (3 / 2) * Math.PI,
  clockwise: true,
  maxLevelDiff: undefined,
  sortBy: 'degree',
};

/**
 * <zh/> 同心圆布局
 *
 * <en/> Concentric layout
 */
export class ConcentricLayout extends BaseLayout<ConcentricLayoutOptions> {
  id = 'concentric';

  protected getDefaultOptions(): Partial<ConcentricLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      applySingleNodeLayout(this.model, center);
      return;
    }

    const {
      sortBy: propsSortBy,
      maxLevelDiff: propsMaxLevelDiff,
      sweep: propsSweep,
      clockwise,
      equidistant,
      preventOverlap,
      startAngle = DEFAULTS_LAYOUT_OPTIONS.startAngle,
      nodeSize,
      nodeSpacing,
    } = this.options;

    const sortBy =
      !propsSortBy || propsSortBy === 'degree'
        ? ('degree' as const)
        : (formatFn(propsSortBy, ['node']) as (node: NodeData) => number);

    if (sortBy === 'degree') {
      orderByDegree(this.model);
    } else {
      const sorter = (nodeA: NodeData, nodeB: NodeData) => {
        const a = sortBy(nodeA);
        const b = sortBy(nodeB);
        return a === b ? 0 : a > b ? -1 : 1;
      };
      orderBySorter(this.model, sorter);
    }

    const nodes = this.model.nodes();

    const sortKeys = new Map();
    for (const node of nodes) {
      const v =
        sortBy === 'degree'
          ? this.model.degree(node.id)
          : sortBy(node._original);
      sortKeys.set(node.id, v);
    }

    const maxValueNode = this.model.firstNode()!;
    const maxLevelDiff = propsMaxLevelDiff || sortKeys.get(maxValueNode.id) / 4;

    const sizeFn = formatNodeSizeFn(
      nodeSize,
      nodeSpacing,
      DEFAULTS_LAYOUT_OPTIONS.nodeSize as number,
      DEFAULTS_LAYOUT_OPTIONS.nodeSpacing as number,
    );

    const nodeDistances = new Map<LayoutNode['id'], number>();
    for (const node of nodes) {
      nodeDistances.set(node.id, Math.max(...sizeFn(node._original)));
    }

    // put the values into levels
    const levels: {
      nodes: LayoutNode[];
      r?: number;
      dTheta?: number;
      maxNodeSize?: number;
      nodeSizes?: number[];
    }[] = [{ nodes: [] }];
    let currentLevel = levels[0];

    for (let i = 0; i < n; i++) {
      const node = nodes[i];

      if (currentLevel.nodes.length > 0) {
        const firstNode = currentLevel.nodes[0];
        const diff = Math.abs(
          sortKeys.get(firstNode.id) - sortKeys.get(node.id),
        );

        if (maxLevelDiff && diff >= maxLevelDiff) {
          currentLevel = { nodes: [] };
          levels.push(currentLevel);
        }
      }
      currentLevel.nodes.push(node);
    }
    for (const level of levels) {
      const nodeSizes = level.nodes.map((node) => nodeDistances.get(node.id)!);
      level.nodeSizes = nodeSizes;
      level.maxNodeSize = Math.max(...nodeSizes);
    }

    // find the metrics for each level
    levels.forEach((level) => {
      const sweep =
        propsSweep === undefined
          ? 2 * Math.PI - (2 * Math.PI) / level.nodes.length
          : propsSweep;
      level.dTheta = sweep / Math.max(1, level.nodes.length - 1);
    });

    // calculate the radius
    if (preventOverlap) {
      let r = 0;
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];

        if (level.nodes.length > 1) {
          const nodeSizes = level.nodeSizes || [];
          let requiredDist = 0;
          for (let j = 0; j < nodeSizes.length - 1; j++) {
            requiredDist = Math.max(
              requiredDist,
              (nodeSizes[j] + nodeSizes[j + 1]) / 2,
            );
          }

          const dcos = Math.cos(level.dTheta!) - Math.cos(0);
          const dsin = Math.sin(level.dTheta!) - Math.sin(0);
          const denom = Math.sqrt(dcos * dcos + dsin * dsin);
          const rMin = denom > 0 ? requiredDist / denom : 0;

          r = Math.max(rMin, r);
        }

        level.r = r;
        if (i < levels.length - 1) {
          const nextLevel = levels[i + 1];
          const step =
            ((level.maxNodeSize || 0) + (nextLevel.maxNodeSize || 0)) / 2;
          r += Math.max(0, step);
        }
      }
    } else {
      // create radii by node sizes, then constrain to bb (without overlap guarantees)
      let r = 0;
      levels[0].r = 0;
      for (let i = 0; i < levels.length - 1; i++) {
        const level = levels[i];
        const nextLevel = levels[i + 1];
        const step =
          ((level.maxNodeSize || 0) + (nextLevel.maxNodeSize || 0)) / 2;
        r += Math.max(0, step);
        nextLevel.r = r;
      }

      const maxHalf = Math.min(width, height) / 2;
      let scale = 1;
      for (const level of levels) {
        const rr = level.r || 0;
        if (rr <= 0) continue;
        const allowed = maxHalf - (level.maxNodeSize || 0);
        if (allowed <= 0) {
          scale = 0;
          break;
        }
        scale = Math.min(scale, allowed / rr);
      }
      scale = Math.max(0, Math.min(1, scale));
      if (scale !== 1) {
        for (const level of levels) {
          level.r = (level.r || 0) * scale;
        }
      }
    }

    if (equidistant) {
      let rDeltaMax = 0;
      let rr = 0;
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const rDelta = (level.r || 0) - rr;
        rDeltaMax = Math.max(rDeltaMax, rDelta);
      }
      rr = 0;
      levels.forEach((level, i) => {
        if (i === 0) {
          rr = level.r || 0;
        }
        level.r = rr;
        rr += rDeltaMax;
      });
    }

    // calculate the node positions
    levels.forEach((level) => {
      const dTheta = level.dTheta || 0;
      const rr = level.r || 0;
      level.nodes.forEach((node: LayoutNode, j: number) => {
        const theta = startAngle! + (clockwise ? 1 : -1) * dTheta * j;
        node.x = center[0] + rr * Math.cos(theta);
        node.y = center[1] + rr * Math.sin(theta);
      });
    });
  }
}
