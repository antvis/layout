import { isNumber } from '@antv/util';
import type { Size, STDSize } from '../types';

export function parseSize(size?: Size): STDSize {
  if (!size) return [0, 0, 0];
  if (isNumber(size)) return [size, size, size];
  else if (Array.isArray(size) && size.length === 0) return [0, 0, 0];
  const [x, y = x, z = x] = size;
  return [x, y, z];
}

export function isSize(value: unknown): value is Size {
  if (isNumber(value)) return true;
  if (Array.isArray(value)) {
    return value.every((item) => isNumber(item));
  }
  return false;
}
