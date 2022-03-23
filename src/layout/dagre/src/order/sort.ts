import { partition } from "../util";
import { ConflictEntry } from "./resolve-conflicts";

const sort = (entries: ConflictEntry[], biasRight?: boolean, usePrev?: boolean) => {
  const parts = partition(entries, (entry) => {
    // NOTE: 有fixorder的也可以排
    return (entry.hasOwnProperty("fixorder") && !isNaN(entry.fixorder!)) || entry.hasOwnProperty("barycenter");
  });
  const sortable = parts.lhs;
  const unsortable = parts.rhs.sort((a, b) => -a.i - (-b.i));
  const vs: string[][] = [];
  let sum = 0;
  let weight = 0;
  let vsIndex = 0;

  sortable?.sort(compareWithBias(!!biasRight, !!usePrev));

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

  sortable?.forEach((entry) => {
    vsIndex += entry.vs?.length;
    vs.push(entry.vs);
    sum += entry.barycenter! * entry.weight!;
    weight += entry.weight!;
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
  });

  const result: { vs: string[], barycenter?: number, weight?: number } = { vs: vs.flat() };
  if (weight) {
    result.barycenter = sum / weight;
    result.weight = weight;
  }
  return result;
};

const consumeUnsortable = (vs: string[][], unsortable: ConflictEntry[], index: number) => {
  let iindex = index;
  let last;
  while (unsortable.length && (last = unsortable[unsortable.length - 1]).i <= iindex) {
    unsortable.pop();
    vs?.push(last.vs);
    iindex++;
  }
  return iindex;
};

/**
 * 配置是否考虑使用之前的布局结果
 */
const compareWithBias = (bias: boolean, usePrev: boolean) => {
  return (entryV: ConflictEntry, entryW: ConflictEntry) => {
    // 排序的时候先判断fixorder，不行再判断重心
    if (entryV.fixorder !== undefined && entryW.fixorder !== undefined) {
      return entryV.fixorder - entryW.fixorder;
    }
    if (entryV.barycenter! < entryW.barycenter!) {
      return -1;
    }
    if (entryV.barycenter! > entryW.barycenter!) {
      return 1;
    }
    // 重心相同，考虑之前排好的顺序
    if (usePrev && entryV.order !== undefined && entryW.order !== undefined) {
      if (entryV.order < entryW.order) {
        return -1;
      }
      if (entryV.order > entryW.order) {
        return 1;
      }
    }

    return !bias ? entryV.i - entryW.i : entryW.i - entryV.i;
  };
};

export default sort;