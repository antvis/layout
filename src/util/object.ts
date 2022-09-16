export const isObject = (val: unknown): val is Record<any, any> =>
  val !== null && typeof val === 'object';

export const clone = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[]
    ;(target as any[]).forEach((v) => {
      cp.push(v);
    });
    return cp.map((n: any) => clone<any>(n)) as any;
  }
  if (typeof target === 'object' && Object.keys(target).length) {
    const cp = { ...(target as { [key: string]: any }) } as {
      [key: string]: any
    };
    Object.keys(cp).forEach((k) => {
      cp[k] = clone<any>(cp[k]);
    });
    return cp as T;
  }
  return target;
};
