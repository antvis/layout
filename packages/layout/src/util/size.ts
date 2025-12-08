import { isNumber } from '@antv/util';
import type { Size, STDSize } from '../types/size';

export function parseSize(size?: Size): STDSize {
  if (!size) return [0, 0, 0];
  if (isNumber(size)) return [size, size, size];
  else if (Array.isArray(size) && size.length === 0) return [0, 0, 0];
  const [x, y = x, z = x] = size;
  return [x, y, z];
}
