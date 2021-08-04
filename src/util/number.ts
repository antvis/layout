export const isNumber = (val: unknown): val is Number => typeof val === 'number';

export const isNaN = (num: unknown) => Number.isNaN(Number(num));

export const toNumber = (val: any): any => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};