import type { PointTuple } from '../types';

/**
 * format the invalide width and height, and get the center position
 * @param width
 * @param height
 * @param center
 * @returns
 */
export const calculateCenter = (
  width: number | undefined,
  height: number | undefined,
  center: PointTuple | undefined,
): [number, number, PointTuple] => {
  let calculatedWidth = width;
  let calculatedHeight = height;
  let calculatedCenter = center;
  if (!calculatedWidth && typeof window !== 'undefined') {
    calculatedWidth = window.innerWidth;
  }
  if (!calculatedHeight && typeof window !== 'undefined') {
    calculatedHeight = window.innerHeight;
  }
  if (!calculatedCenter) {
    calculatedCenter = [calculatedWidth! / 2, calculatedHeight! / 2];
  }
  return [calculatedWidth!, calculatedHeight!, calculatedCenter];
};
