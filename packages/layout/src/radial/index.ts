import { BaseLayout } from '../base-layout';
import { runMDS } from '../mds';
import type { Matrix } from '../types';
import type { LayoutNode, NodeData } from '../types/data';
import type { ID } from '../types/id';
import {
  formatNodeSizeToNumber,
  getAdjMatrix,
  getEuclideanDistance,
  johnson,
  LayoutModel,
  normalizeViewport,
} from '../util';
import { applySingleNodeLayout } from '../util/common';
import {
  radialNonoverlapForce,
  RadialNonoverlapForceOptions,
} from './radial-nonoverlap-force';
import type { RadialLayoutOptions } from './types';

export type { RadialLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<RadialLayoutOptions> = {
  focusNode: null,
  linkDistance: 50,
  maxIteration: 1000,
  maxPreventOverlapIteration: 200,
  preventOverlap: false,
  sortStrength: 10,
  strictRadial: true,
  unitRadius: null,
};

/**
 * <zh/> 径向布局
 *
 * <en/> Radial layout
 */
export class RadialLayout extends BaseLayout<RadialLayoutOptions> {
  id = 'radial';

  protected getDefaultOptions(): Partial<RadialLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      return applySingleNodeLayout(this.model, center);
    }

    const {
      focusNode: propsFocusNode,
      linkDistance = DEFAULTS_LAYOUT_OPTIONS.linkDistance,
      maxIteration = DEFAULTS_LAYOUT_OPTIONS.maxIteration,
      maxPreventOverlapIteration = DEFAULTS_LAYOUT_OPTIONS.maxPreventOverlapIteration,
      nodeSize,
      nodeSpacing,
      preventOverlap,
      sortBy,
      sortStrength = DEFAULTS_LAYOUT_OPTIONS.sortStrength,
      strictRadial,
      unitRadius: propsUnitRadius,
    } = this.options;

    const focusNode =
      (propsFocusNode && this.model.node(propsFocusNode)) ||
      this.model.firstNode();

    // the index of the focusNode in data
    const focusIndex = this.model.nodeIndexOf(focusNode.id);

    // the graph-theoretic distance (shortest path distance) matrix
    const adjMatrix = getAdjMatrix(this.model, false);
    const distances = johnson(adjMatrix);
    const maxDistance = maxToFocus(distances, focusIndex);

    // replace first node in unconnected component to the circle at (maxDistance + 1)
    handleInfinity(distances, focusIndex, maxDistance + 1);

    // the shortest path distance from each node to focusNode
    const focusNodeD = distances[focusIndex];
    const semiWidth =
      (width - center[0] > center[0] ? center[0] : width - center[0]) ||
      width / 2;
    const semiHeight =
      (height - center[1] > center[1] ? center[1] : height - center[1]) ||
      height / 2;

    // the maxRadius of the graph
    const maxRadius = Math.min(semiWidth, semiHeight);
    const maxD = Math.max(...focusNodeD);
    // the radius for each nodes away from focusNode
    const radii: number[] = [];
    const radiiMap: Map<ID, number> = new Map();
    const unitRadius = propsUnitRadius ?? maxRadius / maxD;
    focusNodeD.forEach((value, i) => {
      const v = value * unitRadius;
      radii.push(v);
      radiiMap.set(this.model.nodeAt(i).id, v);
    });

    const idealDistances = eIdealDisMatrix(
      this.model,
      distances,
      linkDistance,
      radii,
      unitRadius,
      sortBy,
      sortStrength,
    );

    // the initial positions from mds, move the graph to origin, centered at focusNode
    const mdsResult = runMDS(idealDistances, 2, linkDistance);
    const mdsFocus = mdsResult[focusIndex];

    let i = 0;
    this.model.forEachNode((node) => {
      const p = mdsResult[i];
      node.x = p[0] - mdsFocus[0];
      node.y = p[1] - mdsFocus[1];
      i++;
    });

    this.run(maxIteration, idealDistances, radii, focusNode);

    this.model.forEachNode((node) => {
      node.x += center[0];
      node.y += center[1];
    });

    // stagger the overlapped nodes
    if (preventOverlap) {
      const nodeSizeFunc = formatNodeSizeToNumber(nodeSize, nodeSpacing);
      const nonoverlapForceParams: RadialNonoverlapForceOptions = {
        nodeSizeFunc,
        radiiMap,
        width,
        strictRadial: Boolean(strictRadial),
        focusNode,
        maxIteration: maxPreventOverlapIteration,
        k: n / 4.5,
      };
      radialNonoverlapForce(this.model, nonoverlapForceParams);
    }
  }

  private run(
    maxIteration: number,
    idealDistances: Matrix[],
    radii: number[],
    focusNode: LayoutNode,
  ) {
    const weights = getWeightMatrix(idealDistances);

    for (let i = 0; i <= maxIteration; i++) {
      const param = i / maxIteration;
      this.oneIteration(
        this.model,
        param,
        radii,
        idealDistances,
        weights,
        focusNode,
      );
    }
  }

  private oneIteration(
    model: LayoutModel,
    param: number,
    radii: number[],
    distances: Matrix[],
    weights: Matrix[],
    focusNode: LayoutNode,
  ) {
    const vparam = 1 - param;
    let i = 0;

    model.forEachNode((v) => {
      // v
      const originDis = getEuclideanDistance(v, { x: 0, y: 0 });
      const reciODis = originDis === 0 ? 0 : 1 / originDis;
      if (v.id === focusNode.id) {
        i++;
        return;
      }
      let xMolecule = 0;
      let yMolecule = 0;
      let denominator = 0;

      let j = 0;
      model.forEachNode((u) => {
        // u
        if (i === j) {
          j++;
          return;
        }

        // the euclidean distance between v and u
        const edis = getEuclideanDistance(v, u);
        const reciEdis = edis === 0 ? 0 : 1 / edis;
        const idealDis = distances[j][i];
        // same for x and y
        denominator += weights[i][j];
        // x
        xMolecule += weights[i][j] * (u.x + idealDis * (v.x - u.x) * reciEdis);
        // y
        yMolecule += weights[i][j] * (u.y + idealDis * (v.y - u.y) * reciEdis);

        j++;
      });
      const reciR = radii[i] === 0 ? 0 : 1 / radii[i];
      denominator *= vparam;
      denominator += param * reciR * reciR;

      // x
      xMolecule *= vparam;
      xMolecule += param * reciR * v.x * reciODis;
      // y
      yMolecule *= vparam;
      yMolecule += param * reciR * v.y * reciODis;

      v.x = xMolecule / denominator;
      v.y = yMolecule / denominator;
      i++;
    });
  }
}
const eIdealDisMatrix = (
  model: LayoutModel,
  distances: Matrix[],
  linkDistance: number,
  radii: number[],
  unitRadius: number,
  sortBy: 'data' | ((d?: NodeData) => number | string) | undefined,
  sortStrength: number,
): Matrix[] => {
  if (!distances) return [];

  const n = model.nodeCount();
  const result: Matrix[] = new Array(n);

  const sortCache = new Map<ID, number>();

  const sortByFn: ((d?: NodeData) => number | string) | null =
    typeof sortBy === 'function' ? sortBy : null;

  const radiusScale = new Array<number>(n);
  for (let i = 0; i < n; i++) radiusScale[i] = radii[i] / unitRadius;

  const baseLink = (linkDistance + unitRadius) / 2;

  for (let i = 0; i < n; i++) {
    const row = distances[i];
    const newRow = new Array(n);
    const riScale = radiusScale[i] || 1;

    for (let j = 0; j < n; j++) {
      if (i === j) {
        newRow[j] = 0;
        continue;
      }

      const v = row[j];

      // same circle
      if (radii[i] === radii[j]) {
        if (sortBy === 'data') {
          // data ordering
          newRow[j] = (v * Math.abs(i - j) * sortStrength) / riScale;
        } else if (sortByFn) {
          // sort by custom attribute
          const iNode = model.nodeAt(i);
          let iv = sortCache.get(iNode.id);
          if (iv === undefined) {
            const raw = sortByFn(iNode._original) || 0;
            iv = typeof raw === 'string' ? raw.charCodeAt(0) : raw;
            sortCache.set(iNode.id, iv);
          }

          const jNode = model.nodeAt(j);
          let jv = sortCache.get(jNode.id);
          if (jv === undefined) {
            const raw = sortByFn(jNode._original) || 0;
            jv = typeof raw === 'string' ? raw.charCodeAt(0) : raw;
            sortCache.set(jNode.id, jv);
          }

          newRow[j] = (v * Math.abs(iv - jv) * sortStrength) / riScale;
        } else {
          // default same-circle
          newRow[j] = (v * linkDistance) / riScale;
        }
      } else {
        // different circles
        newRow[j] = v * baseLink;
      }
    }

    result[i] = newRow;
  }

  return result;
};

const getWeightMatrix = (idealDistances: Matrix[]) => {
  const rows = idealDistances.length;
  const cols = idealDistances[0].length;
  const result: number[][] = [];
  for (let i = 0; i < rows; i++) {
    const row: number[] = [];
    for (let j = 0; j < cols; j++) {
      if (idealDistances[i][j] !== 0) {
        row.push(1 / (idealDistances[i][j] * idealDistances[i][j]));
      } else {
        row.push(0);
      }
    }
    result.push(row);
  }
  return result;
};

const handleInfinity = (matrix: Matrix[], focusIndex: number, step: number) => {
  const n = matrix.length;

  // 遍历 matrix 中遍历 focus 对应行
  for (let i = 0; i < n; i++) {
    // matrix 关注点对应行的 Inf 项
    if (matrix[focusIndex][i] === Infinity) {
      matrix[focusIndex][i] = step;
      matrix[i][focusIndex] = step;

      // 遍历 matrix 中的 i 行，i 行中非 Inf 项若在 focus 行为 Inf，则替换 focus 行的那个 Inf
      for (let j = 0; j < n; j++) {
        if (matrix[i][j] !== Infinity && matrix[focusIndex][j] === Infinity) {
          matrix[focusIndex][j] = step + matrix[i][j];
          matrix[j][focusIndex] = step + matrix[i][j];
        }
      }
    }
  }

  // 处理其他行的 Inf。根据该行对应点与 focus 距离以及 Inf 项点 与 focus 距离，决定替换值
  for (let i = 0; i < n; i++) {
    if (i === focusIndex) {
      continue;
    }
    for (let j = 0; j < n; j++) {
      if (matrix[i][j] === Infinity) {
        let minus = Math.abs(matrix[focusIndex][i] - matrix[focusIndex][j]);
        minus = minus === 0 ? 1 : minus;
        matrix[i][j] = minus;
      }
    }
  }
};

/**
 * Get the maximum finite distance from the focus node to other nodes
 */
const maxToFocus = (matrix: Matrix[], focusIndex: number): number => {
  const row = matrix[focusIndex];

  let max = 0;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === Infinity) continue;

    max = Math.max(max, row[i]);
  }
  return max;
};
