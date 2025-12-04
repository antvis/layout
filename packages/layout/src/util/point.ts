import { Point, PointObject } from '../types/point';

export function parsePoint(point: PointObject): Point {
  return [point.x, point.y, point.z ?? 0];
}

export function toPointObject(point: Point): PointObject {
  return { x: point[0], y: point[1], z: point[2] ?? 0 };
}
