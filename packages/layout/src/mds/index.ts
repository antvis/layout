import { Matrix as MLMatrix, SingularValueDecomposition } from 'ml-matrix';
import { BaseLayout } from '../base-layout';
import type { Matrix } from '../types';
import type { Point } from '../types/point';
import { floydWarshall, getAdjMatrix, scaleMatrix } from '../util';
import { applySingleNodeLayout } from '../util/common';
import type { MDSLayoutOptions } from './types';

export type { MDSLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<MDSLayoutOptions> = {
  center: [0, 0],
  linkDistance: 50,
};

/**
 * <zh/> 多维缩放算法布局
 *
 * <en/> Multidimensional scaling layout
 */
export class MDSLayout extends BaseLayout<MDSLayoutOptions> {
  id = 'mds';

  protected getDefaultOptions(): Partial<MDSLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const { center, linkDistance } = this.options;

    const n = this.model.nodeCount();
    if (n === 0 || n === 1) {
      return applySingleNodeLayout(this.model, center);
    }

    // the graph-theoretic distance (shortest path distance) matrix
    const adjMatrix = getAdjMatrix(this.model, false);
    const distances = floydWarshall(adjMatrix);
    handleInfinity(distances);

    // scale the ideal edge length acoording to linkDistance
    const scaledD = scaleMatrix(distances, linkDistance);

    // get positions by MDS
    const positions = runMDS(scaledD);

    this.model.forEachNode((node, i) => {
      const p = positions[i];
      node.x = p[0] + center[0];
      node.y = p[1] + center[1];
    });
  }
}

const handleInfinity = (distances: Matrix[]) => {
  let maxDistance = -999999;
  distances.forEach((row) => {
    row.forEach((value) => {
      if (value === Infinity) {
        return;
      }
      if (maxDistance < value) {
        maxDistance = value;
      }
    });
  });
  distances.forEach((row, i) => {
    row.forEach((value, j) => {
      if (value === Infinity) {
        distances[i][j] = maxDistance;
      }
    });
  });
};

/**
 * mds 算法
 * @return {array} positions 计算后的节点位置数组
 */
const runMDS = (distances: Matrix[]): Point[] => {
  const dimension = 2;

  // square distances
  const M = MLMatrix.mul(MLMatrix.pow(distances, 2), -0.5);

  // double centre the rows/columns
  const rowMeans = M.mean('row');
  const colMeans = M.mean('column');
  const totalMean = M.mean();
  M.add(totalMean).subRowVector(rowMeans).subColumnVector(colMeans);

  // take the SVD of the double centred matrix, and return the
  // points from it
  const ret = new SingularValueDecomposition(M);
  const eigenValues = MLMatrix.sqrt(ret.diagonalMatrix).diagonal();
  return ret.leftSingularVectors.toJSON().map((row: number[]) => {
    return MLMatrix.mul([row], [eigenValues])
      .toJSON()[0]
      .splice(0, dimension) as Point;
  });
};
