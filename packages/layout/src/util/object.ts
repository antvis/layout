import { get, set } from '@antv/util';

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
