// const _ = require("../lodash");
// const util = require("../util");

import util from '../util';

const sort = (entries: any, biasRight: any, usePrev: any) => {
  const parts = util.partition(entries, (entry: any) => {
    // NOTE: 有fixorder的也可以排
    return (entry.hasOwnProperty("fixorder") && !isNaN(entry.fixorder)) || entry.hasOwnProperty("barycenter");
  });
  let sortable = parts.lhs,
    unsortable = parts.rhs.sort((a: any, b: any) => -a.i - (-b.i)),
    vs: any = [],
    sum = 0,
    weight = 0,
    vsIndex = 0;

  sortable.sort(compareWithBias(!!biasRight, !!usePrev));

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

  sortable.forEach((entry: any) => {
    vsIndex += entry.vs.length;
    vs.push(entry.vs);
    sum += entry.barycenter * entry.weight;
    weight += entry.weight;
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
  });

  const result: any = { vs: vs.flat() };
  if (weight) {
    result.barycenter = sum / weight;
    result.weight = weight;
  }
  return result;
}

const consumeUnsortable = (vs: any, unsortable: any, index: number) => {
  let last;
  while (unsortable.length && (last = unsortable[unsortable.length - 1]).i <= index) {
    unsortable.pop();
    vs.push(last.vs);
    index++;
  }
  return index;
}

/**
 * 配置是否考虑使用之前的布局结果
 */
const compareWithBias = (bias: any, usePrev: any) => {
  return (entryV: any, entryW: any) => {
    // 排序的时候先判断fixorder，不行再判断重心
    if (entryV.fixorder !== undefined && entryW.fixorder !== undefined) {
      return entryV.fixorder - entryW.fixorder;
    }
    if (entryV.barycenter < entryW.barycenter) {
      return -1;
    } else if (entryV.barycenter > entryW.barycenter) {
      return 1;
    }
    // 重心相同，考虑之前排好的顺序
    if (usePrev && entryV.order !== undefined && entryW.order !== undefined) {
      if (entryV.order < entryW.order) {
        return -1;
      } else if (entryV.order > entryW.order) {
        return 1;
      }
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
  };
}

export default sort;