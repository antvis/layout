"use strict";

var _ = require("../lodash");

module.exports = initDataOrder;


/**
 * 按照数据中的结果设置fixorder
 */
function initDataOrder(g, nodeOrder) {
  var simpleNodes = _.filter(g.nodes(), function(v) {
    return !g.children(v).length;
  });
  var maxRank = _.max(_.map(simpleNodes, function(v) { return g.node(v).rank; }));
  var layers = _.map(_.range(maxRank + 1), function() { return []; });
  _.forEach(nodeOrder, function(n) {
    var node = g.node(n);
    // 只考虑原有节点，dummy节点需要按照后续算法排出
    if (node.dummy) {
      return;
    }
    node.fixorder = layers[node.rank].length; // 设置fixorder为当层的顺序
    layers[node.rank].push(n);
  });
}