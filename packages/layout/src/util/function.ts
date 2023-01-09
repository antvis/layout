import { isArray, isObject } from ".";
import { isNumber } from "./number";

export const isFunction = (val: unknown): val is Function =>
  typeof val === "function";

/**
 * format number | Function type value into (d) => number type
 * @param  {number | Function}  value to be formatted
 * @param  {number}  defaultValue default value
 * @return {Function} result function
 */
export const getFunc = (
  value: number | Function | undefined,
  defaultValue: number,
  func?: ((d?: unknown) => number)
): Function => {
  let resultFunc;
  if (func) {
    // has function definition
    resultFunc = func;
  } else if (isFunction(value)) {
    // value is a function
    resultFunc = value;
  } else if (isNumber(value)) {
    // value is number
    resultFunc = () => value;
  } else {
    // value is not number and function
    resultFunc = () => defaultValue;
  }
  return resultFunc;
};

export const getFuncByUnknownType = (
  defaultValue: number,
  value?:
    | number
    | number[]
    | { width: number; height: number }
    | ((d?: any) => number)
    | undefined,
  resultIsNumber: boolean = true
): ((d?: any) => number | number[]) => {
  if (!value && value !== 0) {
    return (d) => {
      if (d.size) {
        if (isArray(d.size)) {
          return d.size[0] > d.size[1] ? d.size[0] : d.size[1];
        }
        if (isObject(d.size)) {
          return d.size.width > d.size.height ? d.size.width : d.size.height;
        }
        return d.size;
      }
      return defaultValue;
    };
  }
  if (isFunction(value)) {
    return value;
  }
  if (isNumber(value)) {
    return () => value;
  }
  if (isArray(value)) {
    return () => {
      if (resultIsNumber) {
        const max = Math.max(...(value as number[]));
        return isNaN(max) ? defaultValue : max;
      }
      return value;
    };
  }
  if (isObject(value)) {
    return () => {
      if (resultIsNumber) {
        const max = Math.max(value.width, value.height);
        return isNaN(max) ? defaultValue : max;
      }
      return [value.width, value.height];
    };
  }
  return () => defaultValue;
};
