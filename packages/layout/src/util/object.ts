import { Node, Edge } from '../types';
import { isNumber } from './number';

export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === "object";

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
  if (typeof target === "object" && Object.keys(target).length) {
    const cp = { ...(target as { [key: string]: any }) } as {
      [key: string]: any;
    };
    Object.keys(cp).forEach((k) => {
      cp[k] = clone<any>(cp[k]);
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
export const cloneFormatData = <T extends Node | Edge>(target: T, initRange?: [number, number]): T => {
  const cloned = clone(target);
  cloned.data = cloned.data || {};
  if (initRange) {
    if (!isNumber(cloned.data.x)) cloned.data.x = Math.random() * initRange[0];
    if (!isNumber(cloned.data.y)) cloned.data.y = Math.random() * initRange[1];
  }
  return cloned;
};
