var _ = require("../lodash");
var util = require("../util");

module.exports = sort;

function sort(entries, biasRight, usePrev) {
  var parts = util.partition(entries, function(entry) {
    // NOTE: 有fixorder的也可以排
    return (_.has(entry, "fixorder") && !isNaN(entry.fixorder)) || _.has(entry, "barycenter");
  });
  var sortable = parts.lhs,
    unsortable = _.sortBy(parts.rhs, function(entry) { return -entry.i; }),
    vs = [],
    sum = 0,
    weight = 0,
    vsIndex = 0;

  sortable.sort(compareWithBias(!!biasRight, !!usePrev));

  vsIndex = consumeUnsortable(vs, unsortable, vsIndex);

  _.forEach(sortable, function (entry) {
    vsIndex += entry.vs.length;
    vs.push(entry.vs);
    sum += entry.barycenter * entry.weight;
    weight += entry.weight;
    vsIndex = consumeUnsortable(vs, unsortable, vsIndex);
  });

  var result = { vs: _.flatten(vs, true) };
  if (weight) {
    result.barycenter = sum / weight;
    result.weight = weight;
  }
  return result;
}

function consumeUnsortable(vs, unsortable, index) {
  var last;
  while (unsortable.length && (last = _.last(unsortable)).i <= index) {
    unsortable.pop();
    vs.push(last.vs);
    index++;
  }
  return index;
}

/**
 * 配置是否考虑使用之前的布局结果
 */
function compareWithBias(bias, usePrev) {
  return function(entryV, entryW) {
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
