!(function (r) {
  if ("object" == typeof exports && "undefined" != typeof module)
    module.exports = r();
  else if ("function" == typeof define && define.amd) define([], r);
  else {
    ("undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : this
    ).graphologyGenerators = r();
  }
})(function () {
  return (function () {
    return function r(e, o, n) {
      function t(a, s) {
        if (!o[a]) {
          if (!e[a]) {
            var d = "function" == typeof require && require;
            if (!s && d) return d(a, !0);
            if (i) return i(a, !0);
            var u = new Error("Cannot find module '" + a + "'");
            throw ((u.code = "MODULE_NOT_FOUND"), u);
          }
          var l = (o[a] = { exports: {} });
          e[a][0].call(
            l.exports,
            function (r) {
              return t(e[a][1][r] || r);
            },
            l,
            l.exports,
            r,
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
        t(n[a]);
      return t;
    };
  })()(
    {
      1: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/classic/complete: invalid Graph constructor."
              );
            var o,
              t,
              i = new r();
            for (o = 0; o < e; o++) i.addNode(o);
            for (o = 0; o < e; o++)
              for (t = o + 1; t < e; t++)
                "directed" !== i.type && i.addUndirectedEdge(o, t),
                  "undirected" !== i.type &&
                    (i.addDirectedEdge(o, t), i.addDirectedEdge(t, o));
            return i;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      2: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/classic/empty: invalid Graph constructor."
              );
            var o,
              t = new r();
            for (o = 0; o < e; o++) t.addNode(o);
            return t;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      3: [
        function (r, e, o) {
          (o.complete = r("./complete.js")),
            (o.empty = r("./empty.js")),
            (o.ladder = r("./ladder.js")),
            (o.path = r("./path.js"));
        },
        {
          "./complete.js": 1,
          "./empty.js": 2,
          "./ladder.js": 4,
          "./path.js": 5,
        },
      ],
      4: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/classic/ladder: invalid Graph constructor."
              );
            var o,
              t = new r();
            for (o = 0; o < e - 1; o++) t.mergeEdge(o, o + 1);
            for (o = e; o < 2 * e - 1; o++) t.mergeEdge(o, o + 1);
            for (o = 0; o < e; o++) t.addEdge(o, o + e);
            return t;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      5: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/classic/path: invalid Graph constructor."
              );
            for (var o = new r(), t = 0; t < e - 1; t++) o.mergeEdge(t, t + 1);
            return o;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      6: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = r("../classic/empty.js");
          e.exports = function (r, e, o) {
            if (!n(r))
              throw new Error(
                "graphology-generators/community/caveman: invalid Graph constructor."
              );
            var i,
              a,
              s,
              d = e * o,
              u = t(r, d);
            if (o < 2) return u;
            for (i = 0; i < d; i += o)
              for (a = i; a < i + o; a++)
                for (s = a + 1; s < i + o; s++) u.addEdge(a, s);
            return u;
          };
        },
        {
          "../classic/empty.js": 2,
          "graphology-utils/is-graph-constructor": 12,
        },
      ],
      7: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = r("../classic/empty.js");
          e.exports = function (r, e, o) {
            if (!n(r))
              throw new Error(
                "graphology-generators/community/connected-caveman: invalid Graph constructor."
              );
            var i,
              a,
              s,
              d = e * o,
              u = t(r, d);
            if (o < 2) return u;
            for (i = 0; i < d; i += o) {
              for (a = i; a < i + o; a++)
                for (s = a + 1; s < i + o; s++)
                  (a === i && a === s - 1) || u.addEdge(a, s);
              i > 0 && u.addEdge(i, (i - 1) % d);
            }
            return u.addEdge(0, d - 1), u;
          };
        },
        {
          "../classic/empty.js": 2,
          "graphology-utils/is-graph-constructor": 12,
        },
      ],
      8: [
        function (r, e, o) {
          (o.caveman = r("./caveman.js")),
            (o.connectedCaveman = r("./connected-caveman.js"));
        },
        { "./caveman.js": 6, "./connected-caveman.js": 7 },
      ],
      9: [
        function (r, e, o) {
          (o.classic = r("./classic")),
            (o.community = r("./community")),
            (o.random = r("./random")),
            (o.small = r("./small")),
            (o.social = r("./social"));
        },
        {
          "./classic": 3,
          "./community": 8,
          "./random": 18,
          "./small": 19,
          "./social": 22,
        },
      ],
      10: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph"),
            t = r("./simple-size.js");
          function i(r, e) {
            return (2 * e) / (r * (r - 1));
          }
          function a(r, e) {
            return e / (r * (r - 1));
          }
          function s(r, e) {
            var o = r * (r - 1);
            return e / (o + o / 2);
          }
          function d(r, e, o) {
            var d, u;
            if (arguments.length > 3) {
              if (((d = o), (u = arguments[3]), "number" != typeof d || d < 0))
                throw new Error(
                  "graphology-metrics/density: given order is not a valid number."
                );
              if ("number" != typeof u || u < 0)
                throw new Error(
                  "graphology-metrics/density: given size is not a valid number."
                );
            } else {
              if (!n(o))
                throw new Error(
                  "graphology-metrics/density: given graph is not a valid graphology instance."
                );
              (d = o.order), (u = o.size), o.multi && !1 === e && (u = t(o));
            }
            return d < 2
              ? 0
              : (null === r && (r = o.type),
                null === e && (e = o.multi),
                ("undirected" === r ? i : "directed" === r ? a : s)(d, u));
          }
          (o.abstractDensity = d),
            (o.density = d.bind(null, null, null)),
            (o.directedDensity = d.bind(null, "directed", !1)),
            (o.undirectedDensity = d.bind(null, "undirected", !1)),
            (o.mixedDensity = d.bind(null, "mixed", !1)),
            (o.multiDirectedDensity = d.bind(null, "directed", !0)),
            (o.multiUndirectedDensity = d.bind(null, "undirected", !0)),
            (o.multiMixedDensity = d.bind(null, "mixed", !0));
        },
        { "./simple-size.js": 11, "graphology-utils/is-graph": 13 },
      ],
      11: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph");
          e.exports = function (r) {
            if (!n(r))
              throw new Error(
                "graphology-metrics/simple-size: the given graph is not a valid graphology instance."
              );
            if (!r.multi) return r.size;
            var e = 0,
              o = 0;
            function t() {
              e++;
            }
            function i() {
              o++;
            }
            return (
              r.forEachNode(function (e) {
                "directed" !== r.type && r.forEachUndirectedNeighbor(e, t),
                  "undirected" !== r.type && r.forEachOutNeighbor(e, i);
              }),
              e / 2 + o
            );
          };
        },
        { "graphology-utils/is-graph": 13 },
      ],
      12: [
        function (r, e, o) {
          e.exports = function (r) {
            return (
              null !== r &&
              "function" == typeof r &&
              "object" == typeof r.prototype &&
              "function" == typeof r.prototype.addUndirectedEdgeWithKey &&
              "function" == typeof r.prototype.dropNode
            );
          };
        },
        {},
      ],
      13: [
        function (r, e, o) {
          e.exports = function (r) {
            return (
              null !== r &&
              "object" == typeof r &&
              "function" == typeof r.addUndirectedEdgeWithKey &&
              "function" == typeof r.dropNode &&
              "boolean" == typeof r.multi
            );
          };
        },
        {},
      ],
      14: [
        function (r, e, o) {
          e.exports = function (r, e) {
            if (0 !== e.length) {
              var o,
                n,
                t,
                i = e[0];
              for (r.mergeNode(i), n = 1, t = e.length; n < t; n++)
                (o = e[n]), r.mergeEdge(i, o);
            }
          };
        },
        {},
      ],
      15: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/random/clusters: invalid Graph constructor."
              );
            var o = "clusterDensity" in (e = e || {}) ? e.clusterDensity : 0.5,
              t = e.rng || Math.random,
              i = e.order,
              a = e.size,
              s = e.clusters;
            if ("number" != typeof o || o > 1 || o < 0)
              throw new Error(
                "graphology-generators/random/clusters: `clusterDensity` option should be a number between 0 and 1."
              );
            if ("function" != typeof t)
              throw new Error(
                "graphology-generators/random/clusters: `rng` option should be a function."
              );
            if ("number" != typeof i || i <= 0)
              throw new Error(
                "graphology-generators/random/clusters: `order` option should be a positive number."
              );
            if ("number" != typeof a || a <= 0)
              throw new Error(
                "graphology-generators/random/clusters: `size` option should be a positive number."
              );
            if ("number" != typeof s || s <= 0)
              throw new Error(
                "graphology-generators/random/clusters: `clusters` option should be a positive number."
              );
            var d = new r();
            if (!i) return d;
            var u,
              l,
              c,
              g,
              p,
              f,
              h = new Array(s);
            for (c = 0; c < s; c++) h[c] = [];
            for (c = 0; c < i; c++)
              (u = (t() * s) | 0), d.addNode(c, { cluster: u }), h[u].push(c);
            if (!a) return d;
            for (c = 0; c < a; c++) {
              if (t() < 1 - o) {
                g = (t() * i) | 0;
                do {
                  p = (t() * i) | 0;
                } while (g === p);
              } else {
                if (!(f = (l = h[(u = (t() * s) | 0)]).length) || f < 2)
                  continue;
                g = l[(t() * f) | 0];
                do {
                  p = l[(t() * f) | 0];
                } while (g === p);
              }
              d.multi ? d.addEdge(g, p) : d.mergeEdge(g, p);
            }
            return d;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      16: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = r("graphology-metrics/graph/density").abstractDensity;
          function i(r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid Graph constructor."
              );
            var o,
              i,
              a = e.order,
              s = e.probability,
              d = e.rng || Math.random,
              u = new r();
            if (
              ("number" == typeof e.approximateSize &&
                (s = t(u.type, !1, a, e.approximateSize)),
              "number" != typeof a || a <= 0)
            )
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `order`. Should be a positive number."
              );
            if ("number" != typeof s || s < 0 || s > 1)
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `probability`. Should be a number between 0 and 1. Or maybe you gave an `approximateSize` exceeding the graph's density."
              );
            if ("function" != typeof d)
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `rng`. Should be a function."
              );
            for (o = 0; o < a; o++) u.addNode(o);
            if (s <= 0) return u;
            for (o = 0; o < a; o++)
              for (i = o + 1; i < a; i++)
                "directed" !== u.type && d() < s && u.addUndirectedEdge(o, i),
                  "undirected" !== u.type &&
                    (d() < s && u.addDirectedEdge(o, i),
                    d() < s && u.addDirectedEdge(i, o));
            return u;
          }
          (i.sparse = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid Graph constructor."
              );
            var o = e.order,
              i = e.probability,
              a = e.rng || Math.random,
              s = new r();
            if (
              ("number" == typeof e.approximateSize &&
                (i = t(s.type, !1, o, e.approximateSize)),
              "number" != typeof o || o <= 0)
            )
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `order`. Should be a positive number."
              );
            if ("number" != typeof i || i < 0 || i > 1)
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `probability`. Should be a number between 0 and 1. Or maybe you gave an `approximateSize` exceeding the graph's density."
              );
            if ("function" != typeof a)
              throw new Error(
                "graphology-generators/random/erdos-renyi: invalid `rng`. Should be a function."
              );
            for (var d = 0; d < o; d++) s.addNode(d);
            if (i <= 0) return s;
            var u,
              l = -1,
              c = Math.log(1 - i);
            if ("undirected" !== s.type)
              for (u = 0; u < o; ) {
                for (
                  u === (l += 1 + ((Math.log(1 - a()) / c) | 0)) && l++;
                  u < o && o <= l;

                )
                  ++u == (l -= o) && l++;
                u < o && s.addDirectedEdge(u, l);
              }
            if (((l = -1), "directed" !== s.type))
              for (u = 1; u < o; ) {
                for (l += 1 + ((Math.log(1 - a()) / c) | 0); l >= u && u < o; )
                  (l -= u), u++;
                u < o && s.addUndirectedEdge(u, l);
              }
            return s;
          }),
            (e.exports = i);
        },
        {
          "graphology-metrics/graph/density": 10,
          "graphology-utils/is-graph-constructor": 12,
        },
      ],
      17: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor");
          e.exports = function (r, e) {
            if (!n(r))
              throw new Error(
                "graphology-generators/random/girvan-newman: invalid Graph constructor."
              );
            var o = e.zOut,
              t = e.rng || Math.random;
            if ("number" != typeof o)
              throw new Error(
                "graphology-generators/random/girvan-newman: invalid `zOut`. Should be a number."
              );
            if ("function" != typeof t)
              throw new Error(
                "graphology-generators/random/girvan-newman: invalid `rng`. Should be a function."
              );
            var i,
              a,
              s,
              d = o / 96,
              u = (16 - 96 * d) / 31,
              l = new r();
            for (a = 0; a < 128; a++) l.addNode(a);
            for (a = 0; a < 128; a++)
              for (s = a + 1; s < 128; s++)
                (i = t()),
                  a % 4 == s % 4
                    ? i < u && l.addEdge(a, s)
                    : i < d && l.addEdge(a, s);
            return l;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      18: [
        function (r, e, o) {
          (o.clusters = r("./clusters.js")),
            (o.erdosRenyi = r("./erdos-renyi.js")),
            (o.girvanNewman = r("./girvan-newman.js"));
        },
        {
          "./clusters.js": 15,
          "./erdos-renyi.js": 16,
          "./girvan-newman.js": 17,
        },
      ],
      19: [
        function (r, e, o) {
          o.krackhardtKite = r("./krackhardt-kite.js");
        },
        { "./krackhardt-kite.js": 20 },
      ],
      20: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = r("graphology-utils/merge-star"),
            i = [
              ["Andre", "Beverley", "Carol", "Diane", "Fernando"],
              ["Beverley", "Andre", "Ed", "Garth"],
              ["Carol", "Andre", "Diane", "Fernando"],
              [
                "Diane",
                "Andre",
                "Beverley",
                "Carol",
                "Ed",
                "Fernando",
                "Garth",
              ],
              ["Ed", "Beverley", "Diane", "Garth"],
              ["Fernando", "Andre", "Carol", "Diane", "Garth", "Heather"],
              ["Garth", "Beverley", "Diane", "Ed", "Fernando", "Heather"],
              ["Heather", "Fernando", "Garth", "Ike"],
              ["Ike", "Heather", "Jane"],
              ["Jane", "Ike"],
            ];
          e.exports = function (r) {
            if (!n(r))
              throw new Error(
                "graphology-generators/social/krackhardt-kite: invalid Graph constructor."
              );
            var e,
              o,
              a = new r();
            for (e = 0, o = i.length; e < o; e++) t(a, i[e]);
            return a;
          };
        },
        {
          "graphology-utils/is-graph-constructor": 12,
          "graphology-utils/merge-star": 14,
        },
      ],
      21: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = [
              ["Acciaiuoli", "Medici"],
              ["Castellani", "Peruzzi"],
              ["Castellani", "Strozzi"],
              ["Castellani", "Barbadori"],
              ["Medici", "Barbadori"],
              ["Medici", "Ridolfi"],
              ["Medici", "Tornabuoni"],
              ["Medici", "Albizzi"],
              ["Medici", "Salviati"],
              ["Salviati", "Pazzi"],
              ["Peruzzi", "Strozzi"],
              ["Peruzzi", "Bischeri"],
              ["Strozzi", "Ridolfi"],
              ["Strozzi", "Bischeri"],
              ["Ridolfi", "Tornabuoni"],
              ["Tornabuoni", "Guadagni"],
              ["Albizzi", "Ginori"],
              ["Albizzi", "Guadagni"],
              ["Bischeri", "Guadagni"],
              ["Guadagni", "Lamberteschi"],
            ];
          e.exports = function (r) {
            if (!n(r))
              throw new Error(
                "graphology-generators/social/florentine-families: invalid Graph constructor."
              );
            var e,
              o,
              i,
              a = new r();
            for (o = 0, i = t.length; o < i; o++)
              (e = t[o]), a.mergeEdge(e[0], e[1]);
            return a;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
      22: [
        function (r, e, o) {
          (o.florentineFamilies = r("./florentine-families.js")),
            (o.karateClub = r("./karate-club.js"));
        },
        { "./florentine-families.js": 21, "./karate-club.js": 23 },
      ],
      23: [
        function (r, e, o) {
          var n = r("graphology-utils/is-graph-constructor"),
            t = [
              "0111111110111100010101000000000100",
              "1011000100000100010101000000001000",
              "1101000111000100000000000001100010",
              "1110000100001100000000000000000000",
              "1000001000100000000000000000000000",
              "1000001000100000100000000000000000",
              "1000110000000000100000000000000000",
              "1111000000000000000000000000000000",
              "1010000000000000000000000000001011",
              "0010000000000000000000000000000001",
              "1000110000000000000000000000000000",
              "1000000000000000000000000000000000",
              "1001000000000000000000000000000000",
              "1111000000000000000000000000000001",
              "0000000000000000000000000000000011",
              "0000000000000000000000000000000011",
              "0000011000000000000000000000000000",
              "1100000000000000000000000000000000",
              "0000000000000000000000000000000011",
              "1100000000000000000000000000000001",
              "0000000000000000000000000000000011",
              "1100000000000000000000000000000000",
              "0000000000000000000000000000000011",
              "0000000000000000000000000101010011",
              "0000000000000000000000000101000100",
              "0000000000000000000000011000000100",
              "0000000000000000000000000000010001",
              "0010000000000000000000011000000001",
              "0010000000000000000000000000000101",
              "0000000000000000000000010010000011",
              "0100000010000000000000000000000011",
              "1000000000000000000000001100100011",
              "0010000010000011001010110000011101",
              "0000000011000111001110110011111110",
            ],
            i = new Set([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 12, 13, 16, 17, 19, 21,
            ]);
          e.exports = function (r) {
            if (!n(r))
              throw new Error(
                "graphology-generators/social/karate: invalid Graph constructor."
              );
            for (var e, o, a, s, d, u, l = new r(), c = 0; c < 34; c++)
              (e = i.has(c) ? "Mr. Hi" : "Officer"), l.addNode(c, { club: e });
            for (a = 0, d = t.length; a < d; a++)
              for (s = a + 1, u = (o = t[a].split("")).length; s < u; s++)
                +o[s] && l.addEdgeWithKey(a + "->" + s, a, s);
            return l;
          };
        },
        { "graphology-utils/is-graph-constructor": 12 },
      ],
    },
    {},
    [9]
  )(9);
});
