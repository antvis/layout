"use strict";

var _ = require("../lodash");

module.exports = {
  longestPath: longestPath,
  longestPathWithLayer: longestPathWithLayer,
  slack: slack,
};

/*
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (unnormalized) "rank" property.
 */
function longestPath(g) {
  var visited = {};

  function dfs(v) {
    var label = g.node(v);
    if (_.has(visited, v)) {
      return label.rank;
    }
    visited[v] = true;

    var rank = _.min(_.map(g.outEdges(v), function(e) {
      return dfs(e.w) - g.edge(e).minlen;
    }));

    if (rank === Number.POSITIVE_INFINITY || // return value of _.map([]) for Lodash 3
        rank === undefined || // return value of _.map([]) for Lodash 4
        rank === null) { // return value of _.map([null])
      rank = 0;
    }

    return (label.rank = rank);
  }

  _.forEach(g.sources(), dfs);
}

function longestPathWithLayer(g) {
  // 用longest path，找出最深的点
  var visited = {};
  var minRank = 0;

  function dfs(v) {
    var label = g.node(v);
    if (_.has(visited, v)) {
      return label.rank;
    }
    visited[v] = true;

    var rank = _.min(_.map(g.outEdges(v), function(e) {
      return dfs(e.w) - g.edge(e).minlen;
    }));

    if (rank === Number.POSITIVE_INFINITY || // return value of _.map([]) for Lodash 3
        rank === undefined || // return value of _.map([]) for Lodash 4
        rank === null) { // return value of _.map([null])
      rank = 0;
    }

    label.rank = rank;
    minRank = Math.min(label.rank, minRank);
    return label.rank;
  }

  _.forEach(g.sources(), dfs);

  minRank += 1; // NOTE: 最小的层级是dummy root，+1

  // forward一遍，赋值层级
  function dfsForward(v, nextRank) {
    var label = g.node(v);

    var currRank = !isNaN(label.layer) ? label.layer : nextRank;

    // 没有指定，取最大值
    if (label.rank === undefined || label.rank < currRank) {
      label.rank = currRank;
    }

    // DFS遍历子节点
    _.map(g.outEdges(v), function (e) {
      dfsForward(e.w, currRank + g.edge(e).minlen);
    });
  }

  // 指定层级的，更新下游
  g.nodes().forEach(function (n) {
    var label = g.node(n);
    if (!isNaN(label.layer)) {
      dfsForward(n, label.layer); // 默认的dummy root所在层的rank是-1
    } else {
      label.rank -= minRank;
    }
  });

  // g.sources().forEach(function (root) {
  //   dfsForward(root, -1); // 默认的dummy root所在层的rank是-1
  // });
  
  // 不这样做了，赋值的层级只影响下游
  /*
  // backward一遍，把父节点收紧
  function dfsBackward(v) {
    var label = g.node(v);

    // 有指定layer，不改动
    if (!isNaN(label.layer)) {
      label.rank = label.layer;
      return label.rank;
    }

    // 其它
    var rank = _.min(_.map(g.outEdges(v), function(e) {
      return dfsBackward(e.w) - g.edge(e).minlen;
    }));

    if (!isNaN(rank)) {
      label.rank = rank;
    }

    return label.rank;
  }

  _.forEach(g.sources(), dfsBackward);
  */
}

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
function slack(g, e) {
  return g.node(e.w).rank - g.node(e.v).rank - g.edge(e).minlen;
}
