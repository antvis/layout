!(function (t) {
  if ("object" == typeof exports && "undefined" != typeof module)
    module.exports = t();
  else if ("function" == typeof define && define.amd) define([], t);
  else {
    ("undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : this
    ).graphologyLayoutForceatlas2 = t();
  }
})(function () {
  return (function () {
    return function t(e, o, n) {
      function r(a, s) {
        if (!o[a]) {
          if (!e[a]) {
            var u = "function" == typeof require && require;
            if (!s && u) return u(a, !0);
            if (i) return i(a, !0);
            var l = new Error("Cannot find module '" + a + "'");
            throw ((l.code = "MODULE_NOT_FOUND"), l);
          }
          var g = (o[a] = { exports: {} });
          e[a][0].call(
            g.exports,
            function (t) {
              return r(e[a][1][t] || t);
            },
            g,
            g.exports,
            t,
            e,
            o,
            n
          );
        }
        return o[a].exports;
      }
      for (
        var i = "function" == typeof require && require, a = 0;
        a < n.length;
        a++
      )
        r(n[a]);
      return r;
    };
  })()(
    {
      1: [
        function (t, e, o) {
          e.exports = {
            linLogMode: !1,
            outboundAttractionDistribution: !1,
            adjustSizes: !1,
            edgeWeightInfluence: 0,
            scalingRatio: 1,
            strongGravityMode: !1,
            gravity: 1,
            slowDown: 1,
            barnesHutOptimize: !1,
            barnesHutTheta: 0.5,
          };
        },
        {},
      ],
      2: [
        function (t, e, o) {
          (o.assign = function (t) {
            t = t || {};
            var e,
              o,
              n,
              r = Array.prototype.slice.call(arguments).slice(1);
            for (e = 0, n = r.length; e < n; e++)
              if (r[e]) for (o in r[e]) t[o] = r[e][o];
            return t;
          }),
            (o.validateSettings = function (t) {
              return "linLogMode" in t && "boolean" != typeof t.linLogMode
                ? { message: "the `linLogMode` setting should be a boolean." }
                : "outboundAttractionDistribution" in t &&
                  "boolean" != typeof t.outboundAttractionDistribution
                ? {
                    message:
                      "the `outboundAttractionDistribution` setting should be a boolean.",
                  }
                : "adjustSizes" in t && "boolean" != typeof t.adjustSizes
                ? { message: "the `adjustSizes` setting should be a boolean." }
                : "edgeWeightInfluence" in t &&
                  "number" != typeof t.edgeWeightInfluence &&
                  t.edgeWeightInfluence < 0
                ? {
                    message:
                      "the `edgeWeightInfluence` setting should be a number >= 0.",
                  }
                : "scalingRatio" in t &&
                  "number" != typeof t.scalingRatio &&
                  t.scalingRatio < 0
                ? {
                    message:
                      "the `scalingRatio` setting should be a number >= 0.",
                  }
                : "strongGravityMode" in t &&
                  "boolean" != typeof t.strongGravityMode
                ? {
                    message:
                      "the `strongGravityMode` setting should be a boolean.",
                  }
                : "gravity" in t &&
                  "number" != typeof t.gravity &&
                  t.gravity < 0
                ? { message: "the `gravity` setting should be a number >= 0." }
                : "slowDown" in t &&
                  "number" != typeof t.slowDown &&
                  t.slowDown < 0
                ? { message: "the `slowDown` setting should be a number >= 0." }
                : "barnesHutOptimize" in t &&
                  "boolean" != typeof t.barnesHutOptimize
                ? {
                    message:
                      "the `barnesHutOptimize` setting should be a boolean.",
                  }
                : "barnesHutTheta" in t &&
                  "number" != typeof t.barnesHutTheta &&
                  t.barnesHutTheta < 0
                ? {
                    message:
                      "the `barnesHutTheta` setting should be a number >= 0.",
                  }
                : null;
            }),
            (o.graphToByteArrays = function (t) {
              var e,
                o,
                n = t.nodes(),
                r = t.edges(),
                i = n.length,
                a = r.length,
                s = {},
                u = new Float32Array(10 * i),
                l = new Float32Array(3 * a);
              for (e = o = 0; e < i; e++)
                (s[n[e]] = o),
                  (u[o] = t.getNodeAttribute(n[e], "x")),
                  (u[o + 1] = t.getNodeAttribute(n[e], "y")),
                  (u[o + 2] = 0),
                  (u[o + 3] = 0),
                  (u[o + 4] = 0),
                  (u[o + 5] = 0),
                  (u[o + 6] = 1 + t.degree(n[e])),
                  (u[o + 7] = 1),
                  (u[o + 8] = t.getNodeAttribute(n[e], "size") || 1),
                  (u[o + 9] = 0),
                  (o += 10);
              for (e = o = 0; e < a; e++)
                (l[o] = s[t.source(r[e])]),
                  (l[o + 1] = s[t.target(r[e])]),
                  (l[o + 2] = t.getEdgeAttribute(r[e], "weight") || 0),
                  (o += 3);
              return { nodes: u, edges: l };
            }),
            (o.assignLayoutChanges = function (t, e) {
              for (
                var o = t.nodes(), n = 0, r = 0, i = e.length;
                n < i;
                n += 10
              )
                t.setNodeAttribute(o[r], "x", e[n]),
                  t.setNodeAttribute(o[r], "y", e[n + 1]),
                  r++;
            }),
            (o.collectLayoutChanges = function (t, e) {
              for (
                var o = t.nodes(),
                  n = Object.create(null),
                  r = 0,
                  i = 0,
                  a = e.length;
                r < a;
                r += 10
              )
                (n[o[i]] = { x: e[r], y: e[r + 1] }), i++;
              return n;
            }),
            (o.createWorker = function (t) {
              var e = window.URL || window.webkitURL,
                o = t.toString(),
                n = e.createObjectURL(
                  new Blob(["(" + o + ").call(this);"], {
                    type: "text/javascript",
                  })
                ),
                r = new Worker(n);
              return e.revokeObjectURL(n), r;
            });
        },
        {},
      ],
      3: [
        function (t, e, o) {
          var n = t("graphology-utils/is-graph"),
            r = t("./iterate.js"),
            i = t("./helpers.js"),
            a = t("./defaults.js");
          function s(t, e, o) {
            if (!n(e))
              throw new Error(
                "graphology-layout-forceatlas2: the given graph is not a valid graphology instance."
              );
            "number" == typeof o && (o = { iterations: o });
            var s = o.iterations;
            if ("number" != typeof s)
              throw new Error(
                "graphology-layout-forceatlas2: invalid number of iterations."
              );
            if (s <= 0)
              throw new Error(
                "graphology-layout-forceatlas2: you should provide a positive number of iterations."
              );
            var u = i.assign({}, a, o.settings),
              l = i.validateSettings(u);
            if (l)
              throw new Error("graphology-layout-forceatlas2: " + l.message);
            var g,
              f = i.graphToByteArrays(e);
            for (g = 0; g < s; g++) r(u, f.nodes, f.edges);
            if (!t) return i.collectLayoutChanges(e, f.nodes);
            i.assignLayoutChanges(e, f.nodes);
          }
          var u = s.bind(null, !1);
          (u.assign = s.bind(null, !0)),
            (u.inferSettings = function (t) {
              var e = t.order;
              return {
                barnesHutOptimize: e > 2e3,
                strongGravityMode: !0,
                gravity: 0.05,
                scalingRatio: 10,
                slowDown: 1 + Math.log(e),
              };
            }),
            (e.exports = u);
        },
        {
          "./defaults.js": 1,
          "./helpers.js": 2,
          "./iterate.js": 4,
          "graphology-utils/is-graph": 5,
        },
      ],
      4: [
        function (t, e, o) {
          e.exports = function (t, e, o) {
            var n,
              r,
              i,
              a,
              s,
              u,
              l,
              g,
              f,
              h,
              d,
              b,
              c,
              p,
              y,
              w,
              M,
              m,
              v,
              D,
              A,
              q,
              j,
              x = e.length,
              L = o.length,
              H = t.adjustSizes,
              R = t.barnesHutTheta * t.barnesHutTheta,
              z = [];
            for (i = 0; i < x; i += 10)
              (e[i + 4] = e[i + 2]),
                (e[i + 5] = e[i + 3]),
                (e[i + 2] = 0),
                (e[i + 3] = 0);
            if (t.outboundAttractionDistribution) {
              for (d = 0, i = 0; i < x; i += 10) d += e[i + 6];
              d /= x / 10;
            }
            if (t.barnesHutOptimize) {
              var O,
                T,
                k,
                S = 1 / 0,
                W = -1 / 0,
                E = 1 / 0,
                N = -1 / 0;
              for (i = 0; i < x; i += 10)
                (S = Math.min(S, e[i + 0])),
                  (W = Math.max(W, e[i + 0])),
                  (E = Math.min(E, e[i + 1])),
                  (N = Math.max(N, e[i + 1]));
              var U = W - S,
                G = N - E;
              for (
                U > G
                  ? (N = (E -= (U - G) / 2) + U)
                  : (W = (S -= (G - U) / 2) + G),
                  z[0] = -1,
                  z[1] = (S + W) / 2,
                  z[2] = (E + N) / 2,
                  z[3] = Math.max(W - S, N - E),
                  z[4] = -1,
                  z[5] = -1,
                  z[6] = 0,
                  z[7] = 0,
                  z[8] = 0,
                  n = 1,
                  i = 0;
                i < x;
                i += 10
              )
                for (r = 0, k = 3; ; ) {
                  if (!(z[r + 5] >= 0)) {
                    if (z[r + 0] < 0) {
                      z[r + 0] = i;
                      break;
                    }
                    if (
                      ((z[r + 5] = 9 * n),
                      (g = z[r + 3] / 2),
                      (z[(f = z[r + 5]) + 0] = -1),
                      (z[f + 1] = z[r + 1] - g),
                      (z[f + 2] = z[r + 2] - g),
                      (z[f + 3] = g),
                      (z[f + 4] = f + 9),
                      (z[f + 5] = -1),
                      (z[f + 6] = 0),
                      (z[f + 7] = 0),
                      (z[f + 8] = 0),
                      (z[(f += 9) + 0] = -1),
                      (z[f + 1] = z[r + 1] - g),
                      (z[f + 2] = z[r + 2] + g),
                      (z[f + 3] = g),
                      (z[f + 4] = f + 9),
                      (z[f + 5] = -1),
                      (z[f + 6] = 0),
                      (z[f + 7] = 0),
                      (z[f + 8] = 0),
                      (z[(f += 9) + 0] = -1),
                      (z[f + 1] = z[r + 1] + g),
                      (z[f + 2] = z[r + 2] - g),
                      (z[f + 3] = g),
                      (z[f + 4] = f + 9),
                      (z[f + 5] = -1),
                      (z[f + 6] = 0),
                      (z[f + 7] = 0),
                      (z[f + 8] = 0),
                      (z[(f += 9) + 0] = -1),
                      (z[f + 1] = z[r + 1] + g),
                      (z[f + 2] = z[r + 2] + g),
                      (z[f + 3] = g),
                      (z[f + 4] = z[r + 4]),
                      (z[f + 5] = -1),
                      (z[f + 6] = 0),
                      (z[f + 7] = 0),
                      (z[f + 8] = 0),
                      (n += 4),
                      (O =
                        e[z[r + 0] + 0] < z[r + 1]
                          ? e[z[r + 0] + 1] < z[r + 2]
                            ? z[r + 5]
                            : z[r + 5] + 9
                          : e[z[r + 0] + 1] < z[r + 2]
                          ? z[r + 5] + 18
                          : z[r + 5] + 27),
                      (z[r + 6] = e[z[r + 0] + 6]),
                      (z[r + 7] = e[z[r + 0] + 0]),
                      (z[r + 8] = e[z[r + 0] + 1]),
                      (z[O + 0] = z[r + 0]),
                      (z[r + 0] = -1),
                      O ===
                        (T =
                          e[i + 0] < z[r + 1]
                            ? e[i + 1] < z[r + 2]
                              ? z[r + 5]
                              : z[r + 5] + 9
                            : e[i + 1] < z[r + 2]
                            ? z[r + 5] + 18
                            : z[r + 5] + 27))
                    ) {
                      if (k--) {
                        r = O;
                        continue;
                      }
                      k = 3;
                      break;
                    }
                    z[T + 0] = i;
                    break;
                  }
                  (O =
                    e[i + 0] < z[r + 1]
                      ? e[i + 1] < z[r + 2]
                        ? z[r + 5]
                        : z[r + 5] + 9
                      : e[i + 1] < z[r + 2]
                      ? z[r + 5] + 18
                      : z[r + 5] + 27),
                    (z[r + 7] =
                      (z[r + 7] * z[r + 6] + e[i + 0] * e[i + 6]) /
                      (z[r + 6] + e[i + 6])),
                    (z[r + 8] =
                      (z[r + 8] * z[r + 6] + e[i + 1] * e[i + 6]) /
                      (z[r + 6] + e[i + 6])),
                    (z[r + 6] += e[i + 6]),
                    (r = O);
                }
            }
            if (t.barnesHutOptimize) {
              for (b = t.scalingRatio, i = 0; i < x; i += 10)
                for (r = 0; ; )
                  if (z[r + 5] >= 0) {
                    if (
                      ((w =
                        Math.pow(e[i + 0] - z[r + 7], 2) +
                        Math.pow(e[i + 1] - z[r + 8], 2)),
                      (4 * (h = z[r + 3]) * h) / w < R)
                    ) {
                      if (
                        ((c = e[i + 0] - z[r + 7]),
                        (p = e[i + 1] - z[r + 8]),
                        !0 === H
                          ? w > 0
                            ? ((M = (b * e[i + 6] * z[r + 6]) / w),
                              (e[i + 2] += c * M),
                              (e[i + 3] += p * M))
                            : w < 0 &&
                              ((M = (-b * e[i + 6] * z[r + 6]) / Math.sqrt(w)),
                              (e[i + 2] += c * M),
                              (e[i + 3] += p * M))
                          : w > 0 &&
                            ((M = (b * e[i + 6] * z[r + 6]) / w),
                            (e[i + 2] += c * M),
                            (e[i + 3] += p * M)),
                        (r = z[r + 4]) < 0)
                      )
                        break;
                      continue;
                    }
                    r = z[r + 5];
                  } else if (
                    ((u = z[r + 0]) >= 0 &&
                      u !== i &&
                      ((w =
                        (c = e[i + 0] - e[u + 0]) * c +
                        (p = e[i + 1] - e[u + 1]) * p),
                      !0 === H
                        ? w > 0
                          ? ((M = (b * e[i + 6] * e[u + 6]) / w),
                            (e[i + 2] += c * M),
                            (e[i + 3] += p * M))
                          : w < 0 &&
                            ((M = (-b * e[i + 6] * e[u + 6]) / Math.sqrt(w)),
                            (e[i + 2] += c * M),
                            (e[i + 3] += p * M))
                        : w > 0 &&
                          ((M = (b * e[i + 6] * e[u + 6]) / w),
                          (e[i + 2] += c * M),
                          (e[i + 3] += p * M))),
                    (r = z[r + 4]) < 0)
                  )
                    break;
            } else
              for (b = t.scalingRatio, a = 0; a < x; a += 10)
                for (s = 0; s < a; s += 10)
                  (c = e[a + 0] - e[s + 0]),
                    (p = e[a + 1] - e[s + 1]),
                    !0 === H
                      ? (w = Math.sqrt(c * c + p * p) - e[a + 8] - e[s + 8]) > 0
                        ? ((M = (b * e[a + 6] * e[s + 6]) / w / w),
                          (e[a + 2] += c * M),
                          (e[a + 3] += p * M),
                          (e[s + 2] += c * M),
                          (e[s + 3] += p * M))
                        : w < 0 &&
                          ((M = 100 * b * e[a + 6] * e[s + 6]),
                          (e[a + 2] += c * M),
                          (e[a + 3] += p * M),
                          (e[s + 2] -= c * M),
                          (e[s + 3] -= p * M))
                      : (w = Math.sqrt(c * c + p * p)) > 0 &&
                        ((M = (b * e[a + 6] * e[s + 6]) / w / w),
                        (e[a + 2] += c * M),
                        (e[a + 3] += p * M),
                        (e[s + 2] -= c * M),
                        (e[s + 3] -= p * M));
            for (
              f = t.gravity / t.scalingRatio, b = t.scalingRatio, i = 0;
              i < x;
              i += 10
            )
              (M = 0),
                (c = e[i + 0]),
                (p = e[i + 1]),
                (w = Math.sqrt(Math.pow(c, 2) + Math.pow(p, 2))),
                t.strongGravityMode
                  ? w > 0 && (M = b * e[i + 6] * f)
                  : w > 0 && (M = (b * e[i + 6] * f) / w),
                (e[i + 2] -= c * M),
                (e[i + 3] -= p * M);
            for (
              b = 1 * (t.outboundAttractionDistribution ? d : 1), l = 0;
              l < L;
              l += 3
            )
              (a = o[l + 0]),
                (s = o[l + 1]),
                (g = o[l + 2]),
                (y = Math.pow(g, t.edgeWeightInfluence)),
                (c = e[a + 0] - e[s + 0]),
                (p = e[a + 1] - e[s + 1]),
                !0 === H
                  ? ((w = Math.sqrt(
                      Math.pow(c, 2) + Math.pow(p, 2) - e[a + 8] - e[s + 8]
                    )),
                    t.linLogMode
                      ? t.outboundAttractionDistribution
                        ? w > 0 &&
                          (M = (-b * y * Math.log(1 + w)) / w / e[a + 6])
                        : w > 0 && (M = (-b * y * Math.log(1 + w)) / w)
                      : t.outboundAttractionDistribution
                      ? w > 0 && (M = (-b * y) / e[a + 6])
                      : w > 0 && (M = -b * y))
                  : ((w = Math.sqrt(Math.pow(c, 2) + Math.pow(p, 2))),
                    t.linLogMode
                      ? t.outboundAttractionDistribution
                        ? w > 0 &&
                          (M = (-b * y * Math.log(1 + w)) / w / e[a + 6])
                        : w > 0 && (M = (-b * y * Math.log(1 + w)) / w)
                      : t.outboundAttractionDistribution
                      ? ((w = 1), (M = (-b * y) / e[a + 6]))
                      : ((w = 1), (M = -b * y))),
                w > 0 &&
                  ((e[a + 2] += c * M),
                  (e[a + 3] += p * M),
                  (e[s + 2] -= c * M),
                  (e[s + 3] -= p * M));
            if (!0 === H)
              for (i = 0; i < x; i += 10)
                e[i + 9] ||
                  ((m = Math.sqrt(
                    Math.pow(e[i + 2], 2) + Math.pow(e[i + 3], 2)
                  )) > 10 &&
                    ((e[i + 2] = (10 * e[i + 2]) / m),
                    (e[i + 3] = (10 * e[i + 3]) / m)),
                  (v =
                    e[i + 6] *
                    Math.sqrt(
                      (e[i + 4] - e[i + 2]) * (e[i + 4] - e[i + 2]) +
                        (e[i + 5] - e[i + 3]) * (e[i + 5] - e[i + 3])
                    )),
                  (D =
                    Math.sqrt(
                      (e[i + 4] + e[i + 2]) * (e[i + 4] + e[i + 2]) +
                        (e[i + 5] + e[i + 3]) * (e[i + 5] + e[i + 3])
                    ) / 2),
                  (A = (0.1 * Math.log(1 + D)) / (1 + Math.sqrt(v))),
                  (q = e[i + 0] + e[i + 2] * (A / t.slowDown)),
                  (e[i + 0] = q),
                  (j = e[i + 1] + e[i + 3] * (A / t.slowDown)),
                  (e[i + 1] = j));
            else
              for (i = 0; i < x; i += 10)
                e[i + 9] ||
                  ((v =
                    e[i + 6] *
                    Math.sqrt(
                      (e[i + 4] - e[i + 2]) * (e[i + 4] - e[i + 2]) +
                        (e[i + 5] - e[i + 3]) * (e[i + 5] - e[i + 3])
                    )),
                  (D =
                    Math.sqrt(
                      (e[i + 4] + e[i + 2]) * (e[i + 4] + e[i + 2]) +
                        (e[i + 5] + e[i + 3]) * (e[i + 5] + e[i + 3])
                    ) / 2),
                  (A = (e[i + 7] * Math.log(1 + D)) / (1 + Math.sqrt(v))),
                  (e[i + 7] = Math.min(
                    1,
                    Math.sqrt(
                      (A * (Math.pow(e[i + 2], 2) + Math.pow(e[i + 3], 2))) /
                        (1 + Math.sqrt(v))
                    )
                  )),
                  (q = e[i + 0] + e[i + 2] * (A / t.slowDown)),
                  (e[i + 0] = q),
                  (j = e[i + 1] + e[i + 3] * (A / t.slowDown)),
                  (e[i + 1] = j));
            return {};
          };
        },
        {},
      ],
      5: [
        function (t, e, o) {
          e.exports = function (t) {
            return (
              null !== t &&
              "object" == typeof t &&
              "function" == typeof t.addUndirectedEdgeWithKey &&
              "function" == typeof t.dropNode &&
              "boolean" == typeof t.multi
            );
          };
        },
        {},
      ],
    },
    {},
    [3]
  )(3);
});
