import { BaseLayout } from '../base-layout';
import type { LayoutNode } from '../types/data';
import {
  applySingleNodeLayout,
  normalizeViewport,
  orderByDegree,
  orderBySorter,
} from '../util';
import { formatNodeSizeFn } from '../util/format';
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
      nodeSize = DEFAULTS_LAYOUT_OPTIONS.nodeSize,
      nodeSpacing,
    } = this.options;

    let sortBy: ConcentricLayoutOptions['sortBy'] = propsSortBy;
    if (propsSortBy && typeof propsSortBy === 'function') {
      const testNode = this.model.firstNode();
      const testValue = propsSortBy(testNode._original);
      if (typeof testValue !== 'number') sortBy = 'degree';
    } else {
      sortBy = 'degree';
    }

    if (sortBy === 'degree') {
      orderByDegree(this.model);
    } else {
      const sorter = (nodeA, nodeB) => {
        const a = (sortBy as (node: LayoutNode) => number)(nodeA);
        const b = (sortBy as (node: LayoutNode) => number)(nodeB);
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

    const maxValueNode = this.model.firstNode();
    const maxLevelDiff = propsMaxLevelDiff || sortKeys.get(maxValueNode.id) / 4;

    let minDist = 0; // min dist between nodes

    const nodeSizeFn = formatNodeSizeFn(nodeSize, nodeSpacing);

    // put the values into levels
    const levels: { nodes: LayoutNode[]; r?: number; dTheta?: number }[] = [
      { nodes: [] },
    ];
    let currentLevel = levels[0];

    for (let i = 0; i < n; i++) {
      const node = nodes[i];
      minDist = Math.max(minDist, nodeSizeFn(node._original));

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

    // create positions for levels
    if (!preventOverlap) {
      // then strictly constrain to bb
      const firstLvlHasMulti = levels.length > 0 && levels[0].nodes.length > 1;
      const maxR = Math.min(width, height) / 2 - minDist;
      const rStep = maxR / (levels.length + (firstLvlHasMulti ? 1 : 0));

      minDist = Math.min(minDist, rStep);
    }

    // find the metrics for each level
    let r = 0;
    levels.forEach((level) => {
      const sweep =
        propsSweep === undefined
          ? 2 * Math.PI - (2 * Math.PI) / level.nodes.length
          : propsSweep;
      level.dTheta = sweep / Math.max(1, level.nodes.length - 1);

      // calculate the radius
      if (level.nodes.length > 1 && preventOverlap) {
        // but only if more than one node (can't overlap)
        const dcos = Math.cos(level.dTheta) - Math.cos(0);
        const dsin = Math.sin(level.dTheta) - Math.sin(0);
        const rMin = Math.sqrt(
          (minDist * minDist) / (dcos * dcos + dsin * dsin),
        ); // s.t. no nodes overlapping

        r = Math.max(rMin, r);
      }
      level.r = r;
      r += minDist;
    });

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
        const theta = startAngle + (clockwise ? 1 : -1) * dTheta * j;
        node.x = center[0] + rr * Math.cos(theta);
        node.y = center[1] + rr * Math.sin(theta);
      });
    });
  }
}
