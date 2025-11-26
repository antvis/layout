import type { PointTuple } from '../types';

/**
 * Viewport configuration such as width, height and center point.
 */
export const normalizeViewport = (options: {
  width?: number;
  height?: number;
  center?: PointTuple;
}): {
  width: number;
  height: number;
  center: PointTuple;
} => {
  const { width, height, center } = options;
  const normalizedWidth =
    width ?? (typeof window !== 'undefined' ? window.innerWidth : 0);
  const normalizedHeight =
    height ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
  const centerPoint = center ?? [normalizedWidth / 2, normalizedHeight / 2];

  return {
    width: normalizedWidth,
    height: normalizedHeight,
    center: centerPoint,
  };
};
