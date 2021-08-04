export const isString = (val: unknown): val is string => typeof val === 'string';

const cacheStringFunction = <T extends (str: string) => string>(fn: T): T => {
  const cache: Record<string, string> = Object.create(null);
  return ((str: string) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  }) as any;
};

const camelizeRE = /-(\w)/g;
export const camelize = cacheStringFunction((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''));
});

// export const capitalize = cacheStringFunction(
//   (str: string) => str.charAt(0).toUpperCase() + str.slice(1),
// )
