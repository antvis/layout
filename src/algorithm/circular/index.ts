import { normalizeViewport, orderByDegree, orderByTopology } from '../../util';
import { applySingleNodeLayout } from '../../util/common';
import { formatNodeSizeFn } from '../../util/format';
import { BaseLayout } from '../base-layout';
import type { CircularLayoutOptions } from './types';

export type { CircularLayoutOptions };

const DEFAULT_LAYOUT_OPTIONS: CircularLayoutOptions = {
  radius: null,
  startRadius: null,
  endRadius: null,
  startAngle: 0,
  endAngle: 2 * Math.PI,
  clockwise: true,
  divisions: 1,
  ordering: null,
  angleRatio: 1,
  nodeSize: 10,
  nodeSpacing: 0,
};

/**
 * <zh/> 环形布局
 *
 * <en/> Circular layout
 */
export class CircularLayout extends BaseLayout<CircularLayoutOptions> {
  id = 'circular';

  protected getDefaultOptions(): Partial<CircularLayoutOptions> {
    return DEFAULT_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      applySingleNodeLayout(this.model, center);
      return;
    }

    const {
      ordering,
      nodeSpacing,
      nodeSize,
      endAngle = 2 * Math.PI,
      startAngle = 0,
      divisions,
      angleRatio,
      clockwise,
    } = this.options;

    // Order nodes based on strategy
    if (ordering === 'topology') {
      // layout according to the graph topology ignoring edge directions
      orderByTopology(this.model, false);
    } else if (ordering === 'topology-directed') {
      // layout according to the graph topology considering edge directions
      orderByTopology(this.model, true);
    } else if (ordering === 'degree') {
      // layout according to the descent order of degrees
      orderByDegree(this.model, 'asc');
    }

    let { radius, startRadius, endRadius } = this.options;

    const nodes = this.model.nodes();
    const sizeFn = formatNodeSizeFn(
      nodeSize,
      nodeSpacing,
      DEFAULT_LAYOUT_OPTIONS.nodeSize as number,
      DEFAULT_LAYOUT_OPTIONS.nodeSpacing as number,
    );

    if (nodeSpacing) {
      let perimeter = 0;
      for (const node of nodes) {
        perimeter += Math.max(...sizeFn(node._original));
      }
      radius = perimeter / (2 * Math.PI);
    } else if (!radius && !startRadius && !endRadius) {
      radius = Math.min(height, width) / 2;
    } else if (!startRadius && endRadius) {
      startRadius = endRadius;
    } else if (startRadius && !endRadius) {
      endRadius = startRadius;
    }

    // Calculate node positions
    const angleStep = (endAngle - startAngle) / n;
    const adjustedStep = angleStep * angleRatio!;
    const nodesPerDivision = Math.ceil(n / divisions!);
    const divAngle = (2 * Math.PI) / divisions!;

    for (let i = 0; i < n; ) {
      const node = nodes[i];
      // Calculate radius for this node
      let r = radius;
      if (!r && startRadius !== null && endRadius !== null) {
        r = startRadius! + (i * (endRadius! - startRadius!)) / (n - 1);
      }
      if (!r) {
        r = 10 + (i * 100) / (n - 1);
      }

      // Calculate angle for this node
      const divisionIndex = Math.floor(i / nodesPerDivision);
      const indexInDivision = i % nodesPerDivision;
      const theta = indexInDivision * adjustedStep + divAngle * divisionIndex;
      let angle = startAngle + theta;
      if (!clockwise) {
        angle = endAngle - theta;
      }

      // Set position
      node.x = center[0] + Math.cos(angle) * r;
      node.y = center[1] + Math.sin(angle) * r;

      i++;
    }
  }
}
