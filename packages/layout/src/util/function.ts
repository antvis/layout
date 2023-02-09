import { isFunction, isNumber, isObject } from "@antv/util";
import { Node } from "../types";
import { isArray } from ".";

/**
 * Format value with multiple types into a function returns number.
 * @param defaultValue default value when value is invalid
 * @param value value to be formatted
 * @returns formatted result, a function returns number
 */
export function formatNumberFn<T = unknown>(
  defaultValue: number,
  value: number | ((d?: T) => number) | undefined
): (d?: T | undefined) => number {
  let resultFunc;
  if (isFunction(value)) {
    resultFunc = value;
  } else if (isNumber(value)) {
    // value is number
    resultFunc = () => value;
  } else {
    // value is not number and function
    resultFunc = () => defaultValue;
  }
  return resultFunc;
}

/**
 * Format size config with multiple types into a function returns number
 * @param defaultValue default value when value is invalid
 * @param value value to be formatted
 * @param resultIsNumber whether returns number
 * @returns formatted result, a function returns number
 */
export function formatSizeFn<T extends Node>(
  defaultValue: number,
  value?:
    | number
    | number[]
    | { width: number; height: number }
    | ((d?: T) => number)
    | undefined,
  resultIsNumber: boolean = true
): (d: T) => number | number[] {
  if (!value && value !== 0) {
    return (d) => {
      const { size } = d.data || {};
      if (size) {
        if (isArray(size)) {
          return size[0] > size[1] ? size[0] : size[1];
        }
        if (isObject<{ width: number; height: number }>(size)) {
          return size.width > size.height ? size.width : size.height;
        }
        return size;
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
}
