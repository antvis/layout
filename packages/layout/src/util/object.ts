import { get, isNumber, set } from '@antv/util';
import { Edge, Node } from '../types';

export const clone = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[];
    (target as any[]).forEach((v) => {
      cp.push(v);
    });
    return cp.map((n: any) => clone<any>(n)) as any;
  }
  if (typeof target === 'object') {
    const cp = {} as { [key: string]: any };
    Object.keys(target).forEach((k) => {
      cp[k] = clone<any>((target as any)[k]);
    });
    return cp as T;
  }
  return target;
};

/**
 * Clone node or edge data and format it
 * @param target node/edge to be cloned
 * @param initRange whether init the x and y in data with the range, which means [xRange, yRange]
 * @returns cloned node/edge
 */
export const cloneFormatData = <T extends Node | Edge>(
  target: T,
  initRange?: [number, number],
): T => {
  const cloned = clone(target);
  cloned.data = cloned.data || {};
  if (initRange) {
    if (!isNumber(cloned.data.x)) cloned.data.x = Math.random() * initRange[0];
    if (!isNumber(cloned.data.y)) cloned.data.y = Math.random() * initRange[1];
  }
  return cloned;
};

/**
 * Get nested property value
 * For example: getNestedValue(obj, 'a.b.c') will return obj.a.b.c
 */
export function getNestedValue<T>(obj: T, path: keyof T | string): any {
  const keys = String(path).split('.');
  return get(obj, keys);
}

/**
 * Set nested property value
 * For example: setNestedValue(obj, 'a.b.c', value) will set obj.a.b.c = value
 */
export function setNestedValue<T>(
  obj: T,
  path: keyof T | string,
  value: any,
): void {
  const keys = String(path).split('.');
  set(obj, keys, value);
}

/**
 * Merge objects, but undefined values in source objects will not override existing values
 * @param target - The target object
 * @param sources - Source objects to merge
 * @returns A new merged object
 *
 * @example
 * assignDefined({ a: 1, b: 2 }, { b: undefined, c: 3 })
 * // Returns: { a: 1, b: 2, c: 3 }
 */
export function assignDefined<T extends object>(
  target: T,
  ...sources: Partial<T>[]
): T {
  sources.forEach((source) => {
    if (source) {
      Object.keys(source).forEach((key) => {
        const value = source[key as keyof T];
        if (value !== undefined) {
          target[key as keyof T] = value as T[keyof T];
        }
      });
    }
  });
  return target;
}
