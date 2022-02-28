import { SafeAny } from '../layout';
export const isObject = (val: unknown): val is Record<SafeAny, SafeAny> => val !== null && typeof val === 'object';

export const clone = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as SafeAny;
  }
  if (target instanceof Array) {
    const cp = [] as SafeAny[];
    (target as SafeAny[]).forEach(v => {
      cp.push(v);
    });
    return cp.map((n: SafeAny) => clone<SafeAny>(n)) as SafeAny;
  }
  if (typeof target === 'object' && target !== {}) {
    const cp = { ...(target as { [key: string]: SafeAny }) } as {
      [key: string]: SafeAny;
    };
    Object.keys(cp).forEach(k => {
      cp[k] = clone<SafeAny>(cp[k]);
    });
    return cp as T;
  }
  return target;
};
