import { SafeAny } from '../layout';

export const isNumber = (val: unknown): val is number => typeof val === 'number';

export const isNaN = (num: unknown): boolean => Number.isNaN(Number(num));

export const toNumber = (val: SafeAny): SafeAny => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
