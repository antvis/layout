!(function (e) {
  if ("object" == typeof exports && "undefined" != typeof module)
    module.exports = e();
  else if ("function" == typeof define && define.amd) define([], e);
  else {
    ("undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : this
    ).graphology = e();
  }
})(function () {
  return (function () {
    return function e(t, r, n) {
      function i(a, d) {
        if (!r[a]) {
          if (!t[a]) {
            var u = "function" == typeof require && require;
            if (!d && u) return u(a, !0);
            if (o) return o(a, !0);
            var s = new Error("Cannot find module '" + a + "'");
            throw ((s.code = "MODULE_NOT_FOUND"), s);
          }
          var h = (r[a] = { exports: {} });
          t[a][0].call(
            h.exports,
            function (e) {
              return i(t[a][1][e] || e);
            },
            h,
            h.exports,
            e,
            t,
            r,
            n
          );
        }
        return r[a].exports;
      }
      for (
        var o = "function" == typeof require && require, a = 0;
        a < n.length;
        a++
      )
        i(n[a]);
      return i;
    };
  })()(
    {
      1: [
        function (e, t, r) {
          var n =
              Object.create ||
              function (e) {
                var t = function () {};
                return (t.prototype = e), new t();
              },
            i =
              Object.keys ||
              function (e) {
                var t = [];
                for (var r in e)
                  Object.prototype.hasOwnProperty.call(e, r) && t.push(r);
                return r;
              },
            o =
              Function.prototype.bind ||
              function (e) {
                var t = this;
                return function () {
                  return t.apply(e, arguments);
                };
              };
          function a() {
            (this._events &&
              Object.prototype.hasOwnProperty.call(this, "_events")) ||
              ((this._events = n(null)), (this._eventsCount = 0)),
              (this._maxListeners = this._maxListeners || void 0);
          }
          (t.exports = a),
            (a.EventEmitter = a),
            (a.prototype._events = void 0),
            (a.prototype._maxListeners = void 0);
          var d,
            u = 10;
          try {
            var s = {};
            Object.defineProperty &&
              Object.defineProperty(s, "x", { value: 0 }),
              (d = 0 === s.x);
          } catch (e) {
            d = !1;
          }
          function h(e) {
            return void 0 === e._maxListeners
              ? a.defaultMaxListeners
              : e._maxListeners;
          }
          function c(e, t, r, i) {
            var o, a, d;
            if ("function" != typeof r)
              throw new TypeError('"listener" argument must be a function');
            if (
              ((a = e._events)
                ? (a.newListener &&
                    (e.emit("newListener", t, r.listener ? r.listener : r),
                    (a = e._events)),
                  (d = a[t]))
                : ((a = e._events = n(null)), (e._eventsCount = 0)),
              d)
            ) {
              if (
                ("function" == typeof d
                  ? (d = a[t] = i ? [r, d] : [d, r])
                  : i
                  ? d.unshift(r)
                  : d.push(r),
                !d.warned && (o = h(e)) && o > 0 && d.length > o)
              ) {
                d.warned = !0;
                var u = new Error(
                  "Possible EventEmitter memory leak detected. " +
                    d.length +
                    ' "' +
                    String(t) +
                    '" listeners added. Use emitter.setMaxListeners() to increase limit.'
                );
                (u.name = "MaxListenersExceededWarning"),
                  (u.emitter = e),
                  (u.type = t),
                  (u.count = d.length),
                  "object" == typeof console &&
                    console.warn &&
                    console.warn("%s: %s", u.name, u.message);
              }
            } else (d = a[t] = r), ++e._eventsCount;
            return e;
          }
          function p() {
            if (!this.fired)
              switch (
                (this.target.removeListener(this.type, this.wrapFn),
                (this.fired = !0),
                arguments.length)
              ) {
                case 0:
                  return this.listener.call(this.target);
                case 1:
                  return this.listener.call(this.target, arguments[0]);
                case 2:
                  return this.listener.call(
                    this.target,
                    arguments[0],
                    arguments[1]
                  );
                case 3:
                  return this.listener.call(
                    this.target,
                    arguments[0],
                    arguments[1],
                    arguments[2]
                  );
                default:
                  for (
                    var e = new Array(arguments.length), t = 0;
                    t < e.length;
                    ++t
                  )
                    e[t] = arguments[t];
                  this.listener.apply(this.target, e);
              }
          }
          function f(e, t, r) {
            var n = {
                fired: !1,
                wrapFn: void 0,
                target: e,
                type: t,
                listener: r,
              },
              i = o.call(p, n);
            return (i.listener = r), (n.wrapFn = i), i;
          }
          function l(e, t, r) {
            var n = e._events;
            if (!n) return [];
            var i = n[t];
            return i
              ? "function" == typeof i
                ? r
                  ? [i.listener || i]
                  : [i]
                : r
                ? (function (e) {
                    for (var t = new Array(e.length), r = 0; r < t.length; ++r)
                      t[r] = e[r].listener || e[r];
                    return t;
                  })(i)
                : y(i, i.length)
              : [];
          }
          function g(e) {
            var t = this._events;
            if (t) {
              var r = t[e];
              if ("function" == typeof r) return 1;
              if (r) return r.length;
            }
            return 0;
          }
          function y(e, t) {
            for (var r = new Array(t), n = 0; n < t; ++n) r[n] = e[n];
            return r;
          }
          d
            ? Object.defineProperty(a, "defaultMaxListeners", {
                enumerable: !0,
                get: function () {
                  return u;
                },
                set: function (e) {
                  if ("number" != typeof e || e < 0 || e != e)
                    throw new TypeError(
                      '"defaultMaxListeners" must be a positive number'
                    );
                  u = e;
                },
              })
            : (a.defaultMaxListeners = u),
            (a.prototype.setMaxListeners = function (e) {
              if ("number" != typeof e || e < 0 || isNaN(e))
                throw new TypeError('"n" argument must be a positive number');
              return (this._maxListeners = e), this;
            }),
            (a.prototype.getMaxListeners = function () {
              return h(this);
            }),
            (a.prototype.emit = function (e) {
              var t,
                r,
                n,
                i,
                o,
                a,
                d = "error" === e;
              if ((a = this._events)) d = d && null == a.error;
              else if (!d) return !1;
              if (d) {
                if (
                  (arguments.length > 1 && (t = arguments[1]),
                  t instanceof Error)
                )
                  throw t;
                var u = new Error('Unhandled "error" event. (' + t + ")");
                throw ((u.context = t), u);
              }
              if (!(r = a[e])) return !1;
              var s = "function" == typeof r;
              switch ((n = arguments.length)) {
                case 1:
                  !(function (e, t, r) {
                    if (t) e.call(r);
                    else
                      for (var n = e.length, i = y(e, n), o = 0; o < n; ++o)
                        i[o].call(r);
                  })(r, s, this);
                  break;
                case 2:
                  !(function (e, t, r, n) {
                    if (t) e.call(r, n);
                    else
                      for (var i = e.length, o = y(e, i), a = 0; a < i; ++a)
                        o[a].call(r, n);
                  })(r, s, this, arguments[1]);
                  break;
                case 3:
                  !(function (e, t, r, n, i) {
                    if (t) e.call(r, n, i);
                    else
                      for (var o = e.length, a = y(e, o), d = 0; d < o; ++d)
                        a[d].call(r, n, i);
                  })(r, s, this, arguments[1], arguments[2]);
                  break;
                case 4:
                  !(function (e, t, r, n, i, o) {
                    if (t) e.call(r, n, i, o);
                    else
                      for (var a = e.length, d = y(e, a), u = 0; u < a; ++u)
                        d[u].call(r, n, i, o);
                  })(r, s, this, arguments[1], arguments[2], arguments[3]);
                  break;
                default:
                  for (i = new Array(n - 1), o = 1; o < n; o++)
                    i[o - 1] = arguments[o];
                  !(function (e, t, r, n) {
                    if (t) e.apply(r, n);
                    else
                      for (var i = e.length, o = y(e, i), a = 0; a < i; ++a)
                        o[a].apply(r, n);
                  })(r, s, this, i);
              }
              return !0;
            }),
            (a.prototype.addListener = function (e, t) {
              return c(this, e, t, !1);
            }),
            (a.prototype.on = a.prototype.addListener),
            (a.prototype.prependListener = function (e, t) {
              return c(this, e, t, !0);
            }),
            (a.prototype.once = function (e, t) {
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              return this.on(e, f(this, e, t)), this;
            }),
            (a.prototype.prependOnceListener = function (e, t) {
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              return this.prependListener(e, f(this, e, t)), this;
            }),
            (a.prototype.removeListener = function (e, t) {
              var r, i, o, a, d;
              if ("function" != typeof t)
                throw new TypeError('"listener" argument must be a function');
              if (!(i = this._events)) return this;
              if (!(r = i[e])) return this;
              if (r === t || r.listener === t)
                0 == --this._eventsCount
                  ? (this._events = n(null))
                  : (delete i[e],
                    i.removeListener &&
                      this.emit("removeListener", e, r.listener || t));
              else if ("function" != typeof r) {
                for (o = -1, a = r.length - 1; a >= 0; a--)
                  if (r[a] === t || r[a].listener === t) {
                    (d = r[a].listener), (o = a);
                    break;
                  }
                if (o < 0) return this;
                0 === o
                  ? r.shift()
                  : (function (e, t) {
                      for (
                        var r = t, n = r + 1, i = e.length;
                        n < i;
                        r += 1, n += 1
                      )
                        e[r] = e[n];
                      e.pop();
                    })(r, o),
                  1 === r.length && (i[e] = r[0]),
                  i.removeListener && this.emit("removeListener", e, d || t);
              }
              return this;
            }),
            (a.prototype.removeAllListeners = function (e) {
              var t, r, o;
              if (!(r = this._events)) return this;
              if (!r.removeListener)
                return (
                  0 === arguments.length
                    ? ((this._events = n(null)), (this._eventsCount = 0))
                    : r[e] &&
                      (0 == --this._eventsCount
                        ? (this._events = n(null))
                        : delete r[e]),
                  this
                );
              if (0 === arguments.length) {
                var a,
                  d = i(r);
                for (o = 0; o < d.length; ++o)
                  "removeListener" !== (a = d[o]) && this.removeAllListeners(a);
                return (
                  this.removeAllListeners("removeListener"),
                  (this._events = n(null)),
                  (this._eventsCount = 0),
                  this
                );
              }
              if ("function" == typeof (t = r[e])) this.removeListener(e, t);
              else if (t)
                for (o = t.length - 1; o >= 0; o--)
                  this.removeListener(e, t[o]);
              return this;
            }),
            (a.prototype.listeners = function (e) {
              return l(this, e, !0);
            }),
            (a.prototype.rawListeners = function (e) {
              return l(this, e, !1);
            }),
            (a.listenerCount = function (e, t) {
              return "function" == typeof e.listenerCount
                ? e.listenerCount(t)
                : g.call(e, t);
            }),
            (a.prototype.listenerCount = g),
            (a.prototype.eventNames = function () {
              return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
            });
        },
        {},
      ],
      2: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.attachAttributesMethods = function (e) {
              a.forEach(function (t) {
                var r = t.name,
                  n = t.attacher;
                n(e, r("Edge"), "mixed", o.DirectedEdgeData),
                  n(e, r("DirectedEdge"), "directed", o.DirectedEdgeData),
                  n(e, r("UndirectedEdge"), "undirected", o.UndirectedEdgeData);
              });
            });
          var n = e("./utils"),
            i = e("./errors"),
            o = e("./data");
          var a = [
            {
              name: function (e) {
                return "get" + e + "Attribute";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a) {
                  var d = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 2) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var u = "" + e,
                      s = "" + a;
                    if (
                      ((a = arguments[2]),
                      !(d = (0, n.getMatchingEdge)(this, u, s, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          u +
                          '" - "' +
                          s +
                          '").'
                      );
                  } else if (((e = "" + e), !(d = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("mixed" !== r && !(d instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return d.attributes[a];
                };
              },
            },
            {
              name: function (e) {
                return "get" + e + "Attributes";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e) {
                  var a = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 1) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var d = "" + e,
                      u = "" + arguments[1];
                    if (!(a = (0, n.getMatchingEdge)(this, d, u, r)))
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          d +
                          '" - "' +
                          u +
                          '").'
                      );
                  } else if (((e = "" + e), !(a = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("mixed" !== r && !(a instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return a.attributes;
                };
              },
            },
            {
              name: function (e) {
                return "has" + e + "Attribute";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a) {
                  var d = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 2) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var u = "" + e,
                      s = "" + a;
                    if (
                      ((a = arguments[2]),
                      !(d = (0, n.getMatchingEdge)(this, u, s, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          u +
                          '" - "' +
                          s +
                          '").'
                      );
                  } else if (((e = "" + e), !(d = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("mixed" !== r && !(d instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return d.attributes.hasOwnProperty(a);
                };
              },
            },
            {
              name: function (e) {
                return "set" + e + "Attribute";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a, d) {
                  var u = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 3) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var s = "" + e,
                      h = "" + a;
                    if (
                      ((a = arguments[2]),
                      (d = arguments[3]),
                      !(u = (0, n.getMatchingEdge)(this, s, h, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          s +
                          '" - "' +
                          h +
                          '").'
                      );
                  } else if (((e = "" + e), !(u = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("mixed" !== r && !(u instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return (
                    (u.attributes[a] = d),
                    this.emit("edgeAttributesUpdated", {
                      key: u.key,
                      type: "set",
                      meta: { name: a, value: d },
                    }),
                    this
                  );
                };
              },
            },
            {
              name: function (e) {
                return "update" + e + "Attribute";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a, d) {
                  var u = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 3) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var s = "" + e,
                      h = "" + a;
                    if (
                      ((a = arguments[2]),
                      (d = arguments[3]),
                      !(u = (0, n.getMatchingEdge)(this, s, h, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          s +
                          '" - "' +
                          h +
                          '").'
                      );
                  } else if (((e = "" + e), !(u = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("function" != typeof d)
                    throw new i.InvalidArgumentsGraphError(
                      "Graph." + t + ": updater should be a function."
                    );
                  if ("mixed" !== r && !(u instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return (
                    (u.attributes[a] = d(u.attributes[a])),
                    this.emit("edgeAttributesUpdated", {
                      key: u.key,
                      type: "set",
                      meta: { name: a, value: u.attributes[a] },
                    }),
                    this
                  );
                };
              },
            },
            {
              name: function (e) {
                return "remove" + e + "Attribute";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a) {
                  var d = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 2) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var u = "" + e,
                      s = "" + a;
                    if (
                      ((a = arguments[2]),
                      !(d = (0, n.getMatchingEdge)(this, u, s, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          u +
                          '" - "' +
                          s +
                          '").'
                      );
                  } else if (((e = "" + e), !(d = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if ("mixed" !== r && !(d instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return (
                    delete d.attributes[a],
                    this.emit("edgeAttributesUpdated", {
                      key: d.key,
                      type: "remove",
                      meta: { name: a },
                    }),
                    this
                  );
                };
              },
            },
            {
              name: function (e) {
                return "replace" + e + "Attributes";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a) {
                  var d = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 2) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var u = "" + e,
                      s = "" + a;
                    if (
                      ((a = arguments[2]),
                      !(d = (0, n.getMatchingEdge)(this, u, s, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          u +
                          '" - "' +
                          s +
                          '").'
                      );
                  } else if (((e = "" + e), !(d = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if (!(0, n.isPlainObject)(a))
                    throw new i.InvalidArgumentsGraphError(
                      "Graph." +
                        t +
                        ": provided attributes are not a plain object."
                    );
                  if ("mixed" !== r && !(d instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  var h = d.attributes;
                  return (
                    (d.attributes = a),
                    this.emit("edgeAttributesUpdated", {
                      key: d.key,
                      type: "replace",
                      meta: { before: h, after: a },
                    }),
                    this
                  );
                };
              },
            },
            {
              name: function (e) {
                return "merge" + e + "Attributes";
              },
              attacher: function (e, t, r, o) {
                e.prototype[t] = function (e, a) {
                  var d = void 0;
                  if ("mixed" !== this.type && "mixed" !== r && r !== this.type)
                    throw new i.UsageGraphError(
                      "Graph." +
                        t +
                        ": cannot find this type of edges in your " +
                        this.type +
                        " graph."
                    );
                  if (arguments.length > 2) {
                    if (this.multi)
                      throw new i.UsageGraphError(
                        "Graph." +
                          t +
                          ": cannot use a {source,target} combo when asking about an edge's attributes in a MultiGraph since we cannot infer the one you want information about."
                      );
                    var u = "" + e,
                      s = "" + a;
                    if (
                      ((a = arguments[2]),
                      !(d = (0, n.getMatchingEdge)(this, u, s, r)))
                    )
                      throw new i.NotFoundGraphError(
                        "Graph." +
                          t +
                          ': could not find an edge for the given path ("' +
                          u +
                          '" - "' +
                          s +
                          '").'
                      );
                  } else if (((e = "" + e), !(d = this._edges.get(e))))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" edge in the graph.'
                    );
                  if (!(0, n.isPlainObject)(a))
                    throw new i.InvalidArgumentsGraphError(
                      "Graph." +
                        t +
                        ": provided attributes are not a plain object."
                    );
                  if ("mixed" !== r && !(d instanceof o))
                    throw new i.NotFoundGraphError(
                      "Graph." +
                        t +
                        ': could not find the "' +
                        e +
                        '" ' +
                        r +
                        " edge in the graph."
                    );
                  return (
                    (0, n.assign)(d.attributes, a),
                    this.emit("edgeAttributesUpdated", {
                      key: d.key,
                      type: "merge",
                      meta: { data: a },
                    }),
                    this
                  );
                };
              },
            },
          ];
        },
        { "./data": 3, "./errors": 4, "./utils": 11 },
      ],
      3: [
        function (e, t, r) {
          "use strict";
          function n(e, t) {
            (this.key = e),
              (this.attributes = t || {}),
              (this.inDegree = 0),
              (this.outDegree = 0),
              (this.directedSelfLoops = 0),
              (this.in = {}),
              (this.out = {});
          }
          function i(e, t) {
            (this.key = e),
              (this.attributes = t || {}),
              (this.undirectedDegree = 0),
              (this.undirectedSelfLoops = 0),
              (this.undirected = {});
          }
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.MixedNodeData = function (e, t) {
              (this.key = e),
                (this.attributes = t),
                (this.inDegree = 0),
                (this.outDegree = 0),
                (this.undirectedDegree = 0),
                (this.directedSelfLoops = 0),
                (this.undirectedSelfLoops = 0),
                (this.in = {}),
                (this.out = {}),
                (this.undirected = {});
            }),
            (r.DirectedNodeData = n),
            (r.UndirectedNodeData = i),
            (r.DirectedEdgeData = function (e, t, r, n, i) {
              (this.key = e),
                (this.attributes = i),
                (this.source = r),
                (this.target = n),
                (this.generatedKey = t);
            }),
            (r.UndirectedEdgeData = function (e, t, r, n, i) {
              (this.key = e),
                (this.attributes = i),
                (this.source = r),
                (this.target = n),
                (this.generatedKey = t);
            }),
            (n.prototype.upgradeToMixed = function () {
              (this.undirectedDegree = 0),
                (this.undirectedSelfLoops = 0),
                (this.undirected = {});
            }),
            (i.prototype.upgradeToMixed = function () {
              (this.inDegree = 0),
                (this.outDegree = 0),
                (this.directedSelfLoops = 0),
                (this.in = {}),
                (this.out = {});
            });
        },
        {},
      ],
      4: [
        function (e, t, r) {
          "use strict";
          function n(e, t) {
            if (!(e instanceof t))
              throw new TypeError("Cannot call a class as a function");
          }
          function i(e, t) {
            if (!e)
              throw new ReferenceError(
                "this hasn't been initialised - super() hasn't been called"
              );
            return !t || ("object" != typeof t && "function" != typeof t)
              ? e
              : t;
          }
          function o(e, t) {
            if ("function" != typeof t && null !== t)
              throw new TypeError(
                "Super expression must either be null or a function, not " +
                  typeof t
              );
            (e.prototype = Object.create(t && t.prototype, {
              constructor: {
                value: e,
                enumerable: !1,
                writable: !0,
                configurable: !0,
              },
            })),
              t &&
                (Object.setPrototypeOf
                  ? Object.setPrototypeOf(e, t)
                  : (e.__proto__ = t));
          }
          Object.defineProperty(r, "__esModule", { value: !0 });
          var a = (r.GraphError = (function (e) {
            function t(r, o) {
              n(this, t);
              var a = i(this, e.call(this));
              return (
                (a.name = "GraphError"),
                (a.message = r || ""),
                (a.data = o || {}),
                a
              );
            }
            return o(t, e), t;
          })(Error));
          (r.InvalidArgumentsGraphError = (function (e) {
            function t(r, o) {
              n(this, t);
              var a = i(this, e.call(this, r, o));
              return (
                (a.name = "InvalidArgumentsGraphError"),
                "function" == typeof Error.captureStackTrace &&
                  Error.captureStackTrace(a, t.prototype.constructor),
                a
              );
            }
            return o(t, e), t;
          })(a)),
            (r.NotFoundGraphError = (function (e) {
              function t(r, o) {
                n(this, t);
                var a = i(this, e.call(this, r, o));
                return (
                  (a.name = "NotFoundGraphError"),
                  "function" == typeof Error.captureStackTrace &&
                    Error.captureStackTrace(a, t.prototype.constructor),
                  a
                );
              }
              return o(t, e), t;
            })(a)),
            (r.UsageGraphError = (function (e) {
              function t(r, o) {
                n(this, t);
                var a = i(this, e.call(this, r, o));
                return (
                  (a.name = "UsageGraphError"),
                  "function" == typeof Error.captureStackTrace &&
                    Error.captureStackTrace(a, t.prototype.constructor),
                  a
                );
              }
              return o(t, e), t;
            })(a));
        },
        {},
      ],
      5: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 });
          var n = e("events"),
            i = l(e("obliterator/iterator")),
            o = l(e("obliterator/take")),
            a = e("./errors"),
            d = e("./data"),
            u = e("./indices"),
            s = e("./attributes"),
            h = e("./iteration/edges"),
            c = e("./iteration/neighbors"),
            p = e("./serialization"),
            f = e("./utils");
          function l(e) {
            return e && e.__esModule ? e : { default: e };
          }
          var g = new Set(["directed", "undirected", "mixed"]),
            y = new Set(["domain", "_events", "_eventsCount", "_maxListeners"]),
            v = {
              allowSelfLoops: !0,
              edgeKeyGenerator: null,
              multi: !1,
              type: "mixed",
            };
          function b(e, t, r, n, i, o, s, h) {
            if (!n && "undirected" === e.type)
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ": you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead."
              );
            if (n && "directed" === e.type)
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ": you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead."
              );
            if (h && !(0, f.isPlainObject)(h))
              throw new a.InvalidArgumentsGraphError(
                "Graph." +
                  t +
                  ': invalid attributes. Expecting an object but got "' +
                  h +
                  '"'
              );
            if (
              ((o = "" + o),
              (s = "" + s),
              (h = h || {}),
              !e.allowSelfLoops && o === s)
            )
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ': source & target are the same ("' +
                  o +
                  "\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."
              );
            var c = e._nodes.get(o),
              p = e._nodes.get(s);
            if (!c)
              throw new a.NotFoundGraphError(
                "Graph." + t + ': source node "' + o + '" not found.'
              );
            if (!p)
              throw new a.NotFoundGraphError(
                "Graph." + t + ': target node "' + s + '" not found.'
              );
            var l = {
              key: null,
              undirected: n,
              source: o,
              target: s,
              attributes: h,
            };
            if (
              (r && (i = e._edgeKeyGenerator(l)), (i = "" + i), e._edges.has(i))
            )
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ': the "' +
                  i +
                  '" edge already exists in the graph.'
              );
            if (
              !e.multi &&
              (n ? void 0 !== c.undirected[s] : void 0 !== c.out[s])
            )
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ': an edge linking "' +
                  o +
                  '" to "' +
                  s +
                  "\" already exists. If you really want to add multiple edges linking those nodes, you should create a multi graph by using the 'multi' option."
              );
            var g = new (n ? d.UndirectedEdgeData : d.DirectedEdgeData)(
              i,
              r,
              c,
              p,
              h
            );
            return (
              e._edges.set(i, g),
              o === s
                ? n
                  ? c.undirectedSelfLoops++
                  : c.directedSelfLoops++
                : n
                ? (c.undirectedDegree++, p.undirectedDegree++)
                : (c.outDegree++, p.inDegree++),
              (0, u.updateStructureIndex)(e, n, g, o, s, c, p),
              n ? e._undirectedSize++ : e._directedSize++,
              (l.key = i),
              e.emit("edgeAdded", l),
              i
            );
          }
          function w(e, t, r, n, i, o, s, h) {
            if (!n && "undirected" === e.type)
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ": you cannot add a directed edge to an undirected graph. Use the #.addEdge or #.addUndirectedEdge instead."
              );
            if (n && "directed" === e.type)
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ": you cannot add an undirected edge to a directed graph. Use the #.addEdge or #.addDirectedEdge instead."
              );
            if (h && !(0, f.isPlainObject)(h))
              throw new a.InvalidArgumentsGraphError(
                "Graph." +
                  t +
                  ': invalid attributes. Expecting an object but got "' +
                  h +
                  '"'
              );
            if (
              ((o = "" + o),
              (s = "" + s),
              (h = h || {}),
              !e.allowSelfLoops && o === s)
            )
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ': source & target are the same ("' +
                  o +
                  "\"), thus creating a loop explicitly forbidden by this graph 'allowSelfLoops' option set to false."
              );
            var c = e._nodes.get(o),
              p = e._nodes.get(s),
              l = void 0,
              g = null;
            if (!r && (l = e._edges.get(i))) {
              if (
                l.source !== o ||
                l.target !== s ||
                (n && (l.source !== s || l.target !== o))
              )
                throw new a.UsageGraphError(
                  "Graph." +
                    t +
                    ': inconsistency detected when attempting to merge the "' +
                    i +
                    '" edge with "' +
                    o +
                    '" source & "' +
                    s +
                    '" target vs. (' +
                    l.source +
                    ", " +
                    l.target +
                    ")."
                );
              g = i;
            }
            var y = void 0;
            if (
              (g ||
                e.multi ||
                !c ||
                (n ? void 0 === c.undirected[s] : void 0 === c.out[s]) ||
                (y = (0, f.getMatchingEdge)(
                  e,
                  o,
                  s,
                  n ? "undirected" : "directed"
                )),
              y)
            )
              return h ? ((0, f.assign)(y.attributes, h), g) : g;
            var v = {
              key: null,
              undirected: n,
              source: o,
              target: s,
              attributes: h,
            };
            if (
              (r && (i = e._edgeKeyGenerator(v)), (i = "" + i), e._edges.has(i))
            )
              throw new a.UsageGraphError(
                "Graph." +
                  t +
                  ': the "' +
                  i +
                  '" edge already exists in the graph.'
              );
            return (
              c || (e.addNode(o), (c = e._nodes.get(o)), o === s && (p = c)),
              p || (e.addNode(s), (p = e._nodes.get(s))),
              (l = new (n ? d.UndirectedEdgeData : d.DirectedEdgeData)(
                i,
                r,
                c,
                p,
                h
              )),
              e._edges.set(i, l),
              o === s
                ? n
                  ? c.undirectedSelfLoops++
                  : c.directedSelfLoops++
                : n
                ? (c.undirectedDegree++, p.undirectedDegree++)
                : (c.outDegree++, p.inDegree++),
              (0, u.updateStructureIndex)(e, n, l, o, s, c, p),
              n ? e._undirectedSize++ : e._directedSize++,
              (v.key = i),
              e.emit("edgeAdded", v),
              i
            );
          }
          var m = (function (e) {
            function t(r) {
              !(function (e, t) {
                if (!(e instanceof t))
                  throw new TypeError("Cannot call a class as a function");
              })(this, t);
              var n = (function (e, t) {
                if (!e)
                  throw new ReferenceError(
                    "this hasn't been initialised - super() hasn't been called"
                  );
                return !t || ("object" != typeof t && "function" != typeof t)
                  ? e
                  : t;
              })(this, e.call(this));
              if (
                (r = (0, f.assign)({}, v, r)).edgeKeyGenerator &&
                "function" != typeof r.edgeKeyGenerator
              )
                throw new a.InvalidArgumentsGraphError(
                  "Graph.constructor: invalid 'edgeKeyGenerator' option. Expecting a function but got \"" +
                    r.edgeKeyGenerator +
                    '".'
                );
              if ("boolean" != typeof r.multi)
                throw new a.InvalidArgumentsGraphError(
                  "Graph.constructor: invalid 'multi' option. Expecting a boolean but got \"" +
                    r.multi +
                    '".'
                );
              if (!g.has(r.type))
                throw new a.InvalidArgumentsGraphError(
                  'Graph.constructor: invalid \'type\' option. Should be one of "mixed", "directed" or "undirected" but got "' +
                    r.type +
                    '".'
                );
              if ("boolean" != typeof r.allowSelfLoops)
                throw new a.InvalidArgumentsGraphError(
                  "Graph.constructor: invalid 'allowSelfLoops' option. Expecting a boolean but got \"" +
                    r.allowSelfLoops +
                    '".'
                );
              var i =
                "mixed" === r.type
                  ? d.MixedNodeData
                  : "directed" === r.type
                  ? d.DirectedNodeData
                  : d.UndirectedNodeData;
              return (
                (0, f.privateProperty)(n, "NodeDataClass", i),
                (0, f.privateProperty)(n, "_attributes", {}),
                (0, f.privateProperty)(n, "_nodes", new Map()),
                (0, f.privateProperty)(n, "_edges", new Map()),
                (0, f.privateProperty)(n, "_directedSize", 0),
                (0, f.privateProperty)(n, "_undirectedSize", 0),
                (0, f.privateProperty)(
                  n,
                  "_edgeKeyGenerator",
                  r.edgeKeyGenerator || (0, f.incrementalId)()
                ),
                (0, f.privateProperty)(n, "_options", r),
                y.forEach(function (e) {
                  return (0, f.privateProperty)(n, e, n[e]);
                }),
                (0, f.readOnlyProperty)(n, "order", function () {
                  return n._nodes.size;
                }),
                (0, f.readOnlyProperty)(n, "size", function () {
                  return n._edges.size;
                }),
                (0, f.readOnlyProperty)(n, "directedSize", function () {
                  return n._directedSize;
                }),
                (0, f.readOnlyProperty)(n, "undirectedSize", function () {
                  return n._undirectedSize;
                }),
                (0, f.readOnlyProperty)(n, "multi", n._options.multi),
                (0, f.readOnlyProperty)(n, "type", n._options.type),
                (0, f.readOnlyProperty)(
                  n,
                  "allowSelfLoops",
                  n._options.allowSelfLoops
                ),
                n
              );
            }
            return (
              (function (e, t) {
                if ("function" != typeof t && null !== t)
                  throw new TypeError(
                    "Super expression must either be null or a function, not " +
                      typeof t
                  );
                (e.prototype = Object.create(t && t.prototype, {
                  constructor: {
                    value: e,
                    enumerable: !1,
                    writable: !0,
                    configurable: !0,
                  },
                })),
                  t &&
                    (Object.setPrototypeOf
                      ? Object.setPrototypeOf(e, t)
                      : (e.__proto__ = t));
              })(t, e),
              (t.prototype.hasNode = function (e) {
                return this._nodes.has("" + e);
              }),
              (t.prototype.hasDirectedEdge = function (e, t) {
                if ("undirected" === this.type) return !1;
                if (1 === arguments.length) {
                  var r = "" + e,
                    n = this._edges.get(r);
                  return !!n && n instanceof d.DirectedEdgeData;
                }
                if (2 === arguments.length) {
                  (e = "" + e), (t = "" + t);
                  var i = this._nodes.get(e);
                  if (!i) return !1;
                  var o = i.out[t];
                  return !!o && (!this.multi || !!o.size);
                }
                throw new a.InvalidArgumentsGraphError(
                  "Graph.hasDirectedEdge: invalid arity (" +
                    arguments.length +
                    ", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."
                );
              }),
              (t.prototype.hasUndirectedEdge = function (e, t) {
                if ("directed" === this.type) return !1;
                if (1 === arguments.length) {
                  var r = "" + e,
                    n = this._edges.get(r);
                  return !!n && n instanceof d.UndirectedEdgeData;
                }
                if (2 === arguments.length) {
                  (e = "" + e), (t = "" + t);
                  var i = this._nodes.get(e);
                  if (!i) return !1;
                  var o = i.undirected[t];
                  return !!o && (!this.multi || !!o.size);
                }
                throw new a.InvalidArgumentsGraphError(
                  "Graph.hasDirectedEdge: invalid arity (" +
                    arguments.length +
                    ", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."
                );
              }),
              (t.prototype.hasEdge = function (e, t) {
                if (1 === arguments.length) {
                  var r = "" + e;
                  return this._edges.has(r);
                }
                if (2 === arguments.length) {
                  (e = "" + e), (t = "" + t);
                  var n = this._nodes.get(e);
                  if (!n) return !1;
                  var i = void 0 !== n.out && n.out[t];
                  return (
                    i || (i = void 0 !== n.undirected && n.undirected[t]),
                    !!i && (!this.multi || !!i.size)
                  );
                }
                throw new a.InvalidArgumentsGraphError(
                  "Graph.hasEdge: invalid arity (" +
                    arguments.length +
                    ", instead of 1 or 2). You can either ask for an edge id or for the existence of an edge between a source & a target."
                );
              }),
              (t.prototype.directedEdge = function (e, t) {
                if ("undirected" !== this.type) {
                  if (((e = "" + e), (t = "" + t), this.multi))
                    throw new a.UsageGraphError(
                      "Graph.directedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.directedEdges instead."
                    );
                  var r = this._nodes.get(e);
                  if (!r)
                    throw new a.NotFoundGraphError(
                      'Graph.directedEdge: could not find the "' +
                        e +
                        '" source node in the graph.'
                    );
                  if (!this._nodes.has(t))
                    throw new a.NotFoundGraphError(
                      'Graph.directedEdge: could not find the "' +
                        t +
                        '" target node in the graph.'
                    );
                  var n = (r.out && r.out[t]) || void 0;
                  return n ? n.key : void 0;
                }
              }),
              (t.prototype.undirectedEdge = function (e, t) {
                if ("directed" !== this.type) {
                  if (((e = "" + e), (t = "" + t), this.multi))
                    throw new a.UsageGraphError(
                      "Graph.undirectedEdge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.undirectedEdges instead."
                    );
                  var r = this._nodes.get(e);
                  if (!r)
                    throw new a.NotFoundGraphError(
                      'Graph.undirectedEdge: could not find the "' +
                        e +
                        '" source node in the graph.'
                    );
                  if (!this._nodes.has(t))
                    throw new a.NotFoundGraphError(
                      'Graph.undirectedEdge: could not find the "' +
                        t +
                        '" target node in the graph.'
                    );
                  var n = (r.undirected && r.undirected[t]) || void 0;
                  return n ? n.key : void 0;
                }
              }),
              (t.prototype.edge = function (e, t) {
                if (this.multi)
                  throw new a.UsageGraphError(
                    "Graph.edge: this method is irrelevant with multigraphs since there might be multiple edges between source & target. See #.edges instead."
                  );
                (e = "" + e), (t = "" + t);
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.edge: could not find the "' +
                      e +
                      '" source node in the graph.'
                  );
                if (!this._nodes.has(t))
                  throw new a.NotFoundGraphError(
                    'Graph.edge: could not find the "' +
                      t +
                      '" target node in the graph.'
                  );
                var n =
                  (r.out && r.out[t]) ||
                  (r.undirected && r.undirected[t]) ||
                  void 0;
                if (n) return n.key;
              }),
              (t.prototype.inDegree = function (e) {
                var t =
                  !(arguments.length > 1 && void 0 !== arguments[1]) ||
                  arguments[1];
                if ("boolean" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.inDegree: Expecting a boolean but got "' +
                      t +
                      '" for the second parameter (allowing self-loops to be counted).'
                  );
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.inDegree: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if ("undirected" === this.type) return 0;
                var n = t ? r.directedSelfLoops : 0;
                return r.inDegree + n;
              }),
              (t.prototype.outDegree = function (e) {
                var t =
                  !(arguments.length > 1 && void 0 !== arguments[1]) ||
                  arguments[1];
                if ("boolean" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.outDegree: Expecting a boolean but got "' +
                      t +
                      '" for the second parameter (allowing self-loops to be counted).'
                  );
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.outDegree: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if ("undirected" === this.type) return 0;
                var n = t ? r.directedSelfLoops : 0;
                return r.outDegree + n;
              }),
              (t.prototype.directedDegree = function (e) {
                var t =
                  !(arguments.length > 1 && void 0 !== arguments[1]) ||
                  arguments[1];
                if ("boolean" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.directedDegree: Expecting a boolean but got "' +
                      t +
                      '" for the second parameter (allowing self-loops to be counted).'
                  );
                if (((e = "" + e), !this.hasNode(e)))
                  throw new a.NotFoundGraphError(
                    'Graph.directedDegree: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return "undirected" === this.type
                  ? 0
                  : this.inDegree(e, t) + this.outDegree(e, t);
              }),
              (t.prototype.undirectedDegree = function (e) {
                var t =
                  !(arguments.length > 1 && void 0 !== arguments[1]) ||
                  arguments[1];
                if ("boolean" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.undirectedDegree: Expecting a boolean but got "' +
                      t +
                      '" for the second parameter (allowing self-loops to be counted).'
                  );
                if (((e = "" + e), !this.hasNode(e)))
                  throw new a.NotFoundGraphError(
                    'Graph.undirectedDegree: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if ("directed" === this.type) return 0;
                var r = this._nodes.get(e),
                  n = t ? 2 * r.undirectedSelfLoops : 0;
                return r.undirectedDegree + n;
              }),
              (t.prototype.degree = function (e) {
                var t =
                  !(arguments.length > 1 && void 0 !== arguments[1]) ||
                  arguments[1];
                if ("boolean" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.degree: Expecting a boolean but got "' +
                      t +
                      '" for the second parameter (allowing self-loops to be counted).'
                  );
                if (((e = "" + e), !this.hasNode(e)))
                  throw new a.NotFoundGraphError(
                    'Graph.degree: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                var r = 0;
                return (
                  "undirected" !== this.type &&
                    (r += this.directedDegree(e, t)),
                  "directed" !== this.type &&
                    (r += this.undirectedDegree(e, t)),
                  r
                );
              }),
              (t.prototype.source = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.source: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return t.source.key;
              }),
              (t.prototype.target = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.target: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return t.target.key;
              }),
              (t.prototype.extremities = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.extremities: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return [t.source.key, t.target.key];
              }),
              (t.prototype.opposite = function (e, t) {
                if (((e = "" + e), (t = "" + t), !this._nodes.has(e)))
                  throw new a.NotFoundGraphError(
                    'Graph.opposite: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                var r = this._edges.get(t);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.opposite: could not find the "' +
                      t +
                      '" edge in the graph.'
                  );
                var n = r.source,
                  i = r.target,
                  o = n.key,
                  d = i.key;
                if (e !== o && e !== d)
                  throw new a.NotFoundGraphError(
                    'Graph.opposite: the "' +
                      e +
                      '" node is not attached to the "' +
                      t +
                      '" edge (' +
                      o +
                      ", " +
                      d +
                      ")."
                  );
                return e === o ? d : o;
              }),
              (t.prototype.undirected = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.undirected: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return t instanceof d.UndirectedEdgeData;
              }),
              (t.prototype.directed = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.directed: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return t instanceof d.DirectedEdgeData;
              }),
              (t.prototype.selfLoop = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.selfLoop: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return t.source === t.target;
              }),
              (t.prototype.addNode = function (e, t) {
                if (t && !(0, f.isPlainObject)(t))
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.addNode: invalid attributes. Expecting an object but got "' +
                      t +
                      '"'
                  );
                if (((e = "" + e), (t = t || {}), this._nodes.has(e)))
                  throw new a.UsageGraphError(
                    'Graph.addNode: the "' +
                      e +
                      '" node already exist in the graph.'
                  );
                var r = new this.NodeDataClass(e, t);
                return (
                  this._nodes.set(e, r),
                  this.emit("nodeAdded", { key: e, attributes: t }),
                  e
                );
              }),
              (t.prototype.mergeNode = function (e, t) {
                if (t && !(0, f.isPlainObject)(t))
                  throw new a.InvalidArgumentsGraphError(
                    'Graph.mergeNode: invalid attributes. Expecting an object but got "' +
                      t +
                      '"'
                  );
                (e = "" + e), (t = t || {});
                var r = this._nodes.get(e);
                return r
                  ? (t && (0, f.assign)(r.attributes, t), e)
                  : ((r = new this.NodeDataClass(e, t)),
                    this._nodes.set(e, r),
                    this.emit("nodeAdded", { key: e, attributes: t }),
                    e);
              }),
              (t.prototype.dropNode = function (e) {
                if (((e = "" + e), !this.hasNode(e)))
                  throw new a.NotFoundGraphError(
                    'Graph.dropNode: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                for (var t = this.edges(e), r = 0, n = t.length; r < n; r++)
                  this.dropEdge(t[r]);
                var i = this._nodes.get(e);
                this._nodes.delete(e),
                  this.emit("nodeDropped", {
                    key: e,
                    attributes: i.attributes,
                  });
              }),
              (t.prototype.dropEdge = function (e) {
                var t = void 0;
                if (arguments.length > 1) {
                  var r = "" + arguments[0],
                    n = "" + arguments[1];
                  if (!(t = (0, f.getMatchingEdge)(this, r, n, this.type)))
                    throw new a.NotFoundGraphError(
                      'Graph.dropEdge: could not find the "' +
                        r +
                        '" -> "' +
                        n +
                        '" edge in the graph.'
                    );
                } else if (((e = "" + e), !(t = this._edges.get(e))))
                  throw new a.NotFoundGraphError(
                    'Graph.dropEdge: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                this._edges.delete(t.key);
                var i = t,
                  o = i.source,
                  s = i.target,
                  h = i.attributes,
                  c = t instanceof d.UndirectedEdgeData;
                return (
                  o === s
                    ? o.selfLoops--
                    : c
                    ? (o.undirectedDegree--, s.undirectedDegree--)
                    : (o.outDegree--, s.inDegree--),
                  (0, u.clearEdgeFromStructureIndex)(this, c, t),
                  c ? this._undirectedSize-- : this._directedSize--,
                  this.emit("edgeDropped", {
                    key: e,
                    attributes: h,
                    source: o.key,
                    target: s.key,
                    undirected: c,
                  }),
                  this
                );
              }),
              (t.prototype.clear = function () {
                this._edges.clear(), this._nodes.clear(), this.emit("cleared");
              }),
              (t.prototype.clearEdges = function () {
                this._edges.clear(),
                  this.clearIndex(),
                  this.emit("edgesCleared");
              }),
              (t.prototype.getAttribute = function (e) {
                return this._attributes[e];
              }),
              (t.prototype.getAttributes = function () {
                return this._attributes;
              }),
              (t.prototype.hasAttribute = function (e) {
                return this._attributes.hasOwnProperty(e);
              }),
              (t.prototype.setAttribute = function (e, t) {
                return (
                  (this._attributes[e] = t),
                  this.emit("attributesUpdated", {
                    type: "set",
                    meta: { name: e, value: t },
                  }),
                  this
                );
              }),
              (t.prototype.updateAttribute = function (e, t) {
                if ("function" != typeof t)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.updateAttribute: updater should be a function."
                  );
                return (
                  (this._attributes[e] = t(this._attributes[e])),
                  this.emit("attributesUpdated", {
                    type: "set",
                    meta: { name: e, value: this._attributes[e] },
                  }),
                  this
                );
              }),
              (t.prototype.removeAttribute = function (e) {
                return (
                  delete this._attributes[e],
                  this.emit("attributesUpdated", {
                    type: "remove",
                    meta: { name: e },
                  }),
                  this
                );
              }),
              (t.prototype.replaceAttributes = function (e) {
                if (!(0, f.isPlainObject)(e))
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.replaceAttributes: provided attributes are not a plain object."
                  );
                var t = this._attributes;
                return (
                  (this._attributes = e),
                  this.emit("attributesUpdated", {
                    type: "replace",
                    meta: { before: t, after: e },
                  }),
                  this
                );
              }),
              (t.prototype.mergeAttributes = function (e) {
                if (!(0, f.isPlainObject)(e))
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.mergeAttributes: provided attributes are not a plain object."
                  );
                return (
                  (this._attributes = (0, f.assign)(this._attributes, e)),
                  this.emit("attributesUpdated", {
                    type: "merge",
                    meta: { data: this._attributes },
                  }),
                  this
                );
              }),
              (t.prototype.getNodeAttribute = function (e, t) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.getNodeAttribute: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return r.attributes[t];
              }),
              (t.prototype.getNodeAttributes = function (e) {
                e = "" + e;
                var t = this._nodes.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.getNodeAttributes: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return t.attributes;
              }),
              (t.prototype.hasNodeAttribute = function (e, t) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.hasNodeAttribute: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return r.attributes.hasOwnProperty(t);
              }),
              (t.prototype.setNodeAttribute = function (e, t, r) {
                e = "" + e;
                var n = this._nodes.get(e);
                if (!n)
                  throw new a.NotFoundGraphError(
                    'Graph.setNodeAttribute: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if (arguments.length < 3)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.setNodeAttribute: not enough arguments. Either you forgot to pass the attribute's name or value, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead."
                  );
                return (
                  (n.attributes[t] = r),
                  this.emit("nodeAttributesUpdated", {
                    key: e,
                    type: "set",
                    meta: { name: t, value: r },
                  }),
                  this
                );
              }),
              (t.prototype.updateNodeAttribute = function (e, t, r) {
                e = "" + e;
                var n = this._nodes.get(e);
                if (!n)
                  throw new a.NotFoundGraphError(
                    'Graph.updateNodeAttribute: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if (arguments.length < 3)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.updateNodeAttribute: not enough arguments. Either you forgot to pass the attribute's name or updater, or you meant to use #.replaceNodeAttributes / #.mergeNodeAttributes instead."
                  );
                if ("function" != typeof r)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.updateAttribute: updater should be a function."
                  );
                var i = n.attributes;
                return (
                  (i[t] = r(i[t])),
                  this.emit("nodeAttributesUpdated", {
                    key: e,
                    type: "set",
                    meta: { name: t, value: i[t] },
                  }),
                  this
                );
              }),
              (t.prototype.removeNodeAttribute = function (e, t) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.hasNodeAttribute: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return (
                  delete r.attributes[t],
                  this.emit("nodeAttributesUpdated", {
                    key: e,
                    type: "remove",
                    meta: { name: t },
                  }),
                  this
                );
              }),
              (t.prototype.replaceNodeAttributes = function (e, t) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.replaceNodeAttributes: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if (!(0, f.isPlainObject)(t))
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.replaceNodeAttributes: provided attributes are not a plain object."
                  );
                var n = r.attributes;
                return (
                  (r.attributes = t),
                  this.emit("nodeAttributesUpdated", {
                    key: e,
                    type: "replace",
                    meta: { before: n, after: t },
                  }),
                  this
                );
              }),
              (t.prototype.mergeNodeAttributes = function (e, t) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    'Graph.mergeNodeAttributes: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                if (!(0, f.isPlainObject)(t))
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.mergeNodeAttributes: provided attributes are not a plain object."
                  );
                return (
                  (0, f.assign)(r.attributes, t),
                  this.emit("nodeAttributesUpdated", {
                    key: e,
                    type: "merge",
                    meta: { data: t },
                  }),
                  this
                );
              }),
              (t.prototype.forEach = function (e) {
                if ("function" != typeof e)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.forEach: expecting a callback."
                  );
                this._edges.forEach(function (t, r) {
                  var n = t.source,
                    i = t.target;
                  e(n.key, i.key, n.attributes, i.attributes, r, t.attributes);
                });
              }),
              (t.prototype.adjacency = function () {
                var e = this._edges.values();
                return new i.default(function () {
                  var t = e.next();
                  if (t.done) return t;
                  var r = t.value,
                    n = r.source,
                    i = r.target;
                  return {
                    done: !1,
                    value: [
                      n.key,
                      i.key,
                      n.attributes,
                      i.attributes,
                      r.key,
                      r.attributes,
                    ],
                  };
                });
              }),
              (t.prototype.nodes = function () {
                return (0, o.default)(this._nodes.keys(), this._nodes.size);
              }),
              (t.prototype.forEachNode = function (e) {
                if ("function" != typeof e)
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.forEachNode: expecting a callback."
                  );
                this._nodes.forEach(function (t, r) {
                  e(r, t.attributes);
                });
              }),
              (t.prototype.nodeEntries = function () {
                var e = this._nodes.values();
                return new i.default(function () {
                  var t = e.next();
                  if (t.done) return t;
                  var r = t.value;
                  return { value: [r.key, r.attributes], done: !1 };
                });
              }),
              (t.prototype.exportNode = function (e) {
                e = "" + e;
                var t = this._nodes.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.exportNode: could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return (0, p.serializeNode)(e, t);
              }),
              (t.prototype.exportEdge = function (e) {
                e = "" + e;
                var t = this._edges.get(e);
                if (!t)
                  throw new a.NotFoundGraphError(
                    'Graph.exportEdge: could not find the "' +
                      e +
                      '" edge in the graph.'
                  );
                return (0, p.serializeEdge)(e, t);
              }),
              (t.prototype.export = function () {
                var e = new Array(this._nodes.size),
                  t = 0;
                this._nodes.forEach(function (r, n) {
                  e[t++] = (0, p.serializeNode)(n, r);
                });
                var r = new Array(this._edges.size);
                return (
                  (t = 0),
                  this._edges.forEach(function (e, n) {
                    r[t++] = (0, p.serializeEdge)(n, e);
                  }),
                  { attributes: this.getAttributes(), nodes: e, edges: r }
                );
              }),
              (t.prototype.importNode = function (e) {
                var t =
                    arguments.length > 1 &&
                    void 0 !== arguments[1] &&
                    arguments[1],
                  r = (0, p.validateSerializedNode)(e);
                if (r) {
                  if ("not-object" === r)
                    throw new a.InvalidArgumentsGraphError(
                      'Graph.importNode: invalid serialized node. A serialized node should be a plain object with at least a "key" property.'
                    );
                  if ("no-key" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importNode: no key provided."
                    );
                  if ("invalid-attributes" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importNode: invalid attributes. Attributes should be a plain object, null or omitted."
                    );
                }
                var n = e.key,
                  i = e.attributes,
                  o = void 0 === i ? {} : i;
                return t ? this.mergeNode(n, o) : this.addNode(n, o), this;
              }),
              (t.prototype.importEdge = function (e) {
                var t =
                    arguments.length > 1 &&
                    void 0 !== arguments[1] &&
                    arguments[1],
                  r = (0, p.validateSerializedEdge)(e);
                if (r) {
                  if ("not-object" === r)
                    throw new a.InvalidArgumentsGraphError(
                      'Graph.importEdge: invalid serialized edge. A serialized edge should be a plain object with at least a "source" & "target" property.'
                    );
                  if ("no-source" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importEdge: missing souce."
                    );
                  if ("no-target" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importEdge: missing target."
                    );
                  if ("invalid-attributes" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importEdge: invalid attributes. Attributes should be a plain object, null or omitted."
                    );
                  if ("invalid-undirected" === r)
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.importEdge: invalid undirected. Undirected should be boolean or omitted."
                    );
                }
                var n = e.source,
                  i = e.target,
                  o = e.attributes,
                  d = void 0 === o ? {} : o,
                  u = e.undirected,
                  s = void 0 !== u && u;
                return (
                  "key" in e
                    ? (t
                        ? s
                          ? this.mergeUndirectedEdgeWithKey
                          : this.mergeDirectedEdgeWithKey
                        : s
                        ? this.addUndirectedEdgeWithKey
                        : this.addDirectedEdgeWithKey
                      ).call(this, e.key, n, i, d)
                    : (t
                        ? s
                          ? this.mergeUndirectedEdge
                          : this.mergeDirectedEdge
                        : s
                        ? this.addUndirectedEdge
                        : this.addDirectedEdge
                      ).call(this, n, i, d),
                  this
                );
              }),
              (t.prototype.import = function (e) {
                var t = this,
                  r =
                    arguments.length > 1 &&
                    void 0 !== arguments[1] &&
                    arguments[1];
                if ((0, f.isGraph)(e)) return this.import(e.export(), r), this;
                if (!(0, f.isPlainObject)(e))
                  throw new a.InvalidArgumentsGraphError(
                    "Graph.import: invalid argument. Expecting a serialized graph or, alternatively, a Graph instance."
                  );
                if (e.attributes) {
                  if (!(0, f.isPlainObject)(e.attributes))
                    throw new a.InvalidArgumentsGraphError(
                      "Graph.import: invalid attributes. Expecting a plain object."
                    );
                  r
                    ? this.mergeAttributes(e.attributes)
                    : this.replaceAttributes(e.attributes);
                }
                return (
                  e.nodes &&
                    e.nodes.forEach(function (e) {
                      return t.importNode(e, r);
                    }),
                  e.edges &&
                    e.edges.forEach(function (e) {
                      return t.importEdge(e, r);
                    }),
                  this
                );
              }),
              (t.prototype.emptyCopy = function () {
                return new t(this._options);
              }),
              (t.prototype.copy = function () {
                var e = new t(this._options);
                return e.import(this), e;
              }),
              (t.prototype.upgradeToMixed = function () {
                return "mixed" === this.type
                  ? this
                  : (this._nodes.forEach(function (e) {
                      return e.upgradeToMixed();
                    }),
                    (this._options.type = "mixed"),
                    (0, f.readOnlyProperty)(this, "type", this._options.type),
                    (0, f.privateProperty)(
                      this,
                      "NodeDataClass",
                      d.MixedNodeData
                    ),
                    this);
              }),
              (t.prototype.upgradeToMulti = function () {
                return this.multi
                  ? this
                  : ((this._options.multi = !0),
                    (0, f.readOnlyProperty)(this, "multi", !0),
                    (0, u.upgradeStructureIndexToMulti)(this),
                    this);
              }),
              (t.prototype.clearIndex = function () {
                return (0, u.clearStructureIndex)(this), this;
              }),
              (t.prototype.toJSON = function () {
                return this.export();
              }),
              (t.prototype.toString = function () {
                var e = this.order > 1 || 0 === this.order,
                  t = this.size > 1 || 0 === this.size;
                return (
                  "Graph<" +
                  (0, f.prettyPrint)(this.order) +
                  " node" +
                  (e ? "s" : "") +
                  ", " +
                  (0, f.prettyPrint)(this.size) +
                  " edge" +
                  (t ? "s" : "") +
                  ">"
                );
              }),
              (t.prototype.inspect = function () {
                var e = this,
                  t = {};
                this._nodes.forEach(function (e, r) {
                  t[r] = e.attributes;
                });
                var r = {},
                  n = {};
                this._edges.forEach(function (t, i) {
                  var o = t instanceof d.UndirectedEdgeData ? "--" : "->",
                    a = "",
                    u = "(" + t.source.key + ")" + o + "(" + t.target.key + ")";
                  t.generatedKey
                    ? e.multi &&
                      (void 0 === n[u] ? (n[u] = 0) : n[u]++,
                      (a += n[u] + ". "))
                    : (a += "[" + i + "]: "),
                    (r[(a += u)] = t.attributes);
                });
                var i = {};
                for (var o in this)
                  this.hasOwnProperty(o) &&
                    !y.has(o) &&
                    "function" != typeof this[o] &&
                    (i[o] = this[o]);
                return (
                  (i.attributes = this._attributes),
                  (i.nodes = t),
                  (i.edges = r),
                  (0, f.privateProperty)(i, "constructor", this.constructor),
                  i
                );
              }),
              t
            );
          })(n.EventEmitter);
          (r.default = m),
            "undefined" != typeof Symbol &&
              (m.prototype[Symbol.for("nodejs.util.inspect.custom")] =
                m.prototype.inspect),
            [
              {
                name: function (e) {
                  return e + "Edge";
                },
                generateKey: !0,
              },
              {
                name: function (e) {
                  return e + "DirectedEdge";
                },
                generateKey: !0,
                type: "directed",
              },
              {
                name: function (e) {
                  return e + "UndirectedEdge";
                },
                generateKey: !0,
                type: "undirected",
              },
              {
                name: function (e) {
                  return e + "EdgeWithKey";
                },
              },
              {
                name: function (e) {
                  return e + "DirectedEdgeWithKey";
                },
                type: "directed",
              },
              {
                name: function (e) {
                  return e + "UndirectedEdgeWithKey";
                },
                type: "undirected",
              },
            ].forEach(function (e) {
              ["add", "merge"].forEach(function (t) {
                var r = e.name(t),
                  n = "add" === t ? b : w;
                e.generateKey
                  ? (m.prototype[r] = function (t, i, o) {
                      return n(
                        this,
                        r,
                        !0,
                        "undirected" === (e.type || this.type),
                        null,
                        t,
                        i,
                        o
                      );
                    })
                  : (m.prototype[r] = function (t, i, o, a) {
                      return n(
                        this,
                        r,
                        !1,
                        "undirected" === (e.type || this.type),
                        t,
                        i,
                        o,
                        a
                      );
                    });
              });
            }),
            "undefined" != typeof Symbol &&
              (m.prototype[Symbol.iterator] = m.prototype.adjacency),
            (0, s.attachAttributesMethods)(m),
            (0, h.attachEdgeIterationMethods)(m),
            (0, c.attachNeighborIterationMethods)(m);
        },
        {
          "./attributes": 2,
          "./data": 3,
          "./errors": 4,
          "./indices": 7,
          "./iteration/edges": 8,
          "./iteration/neighbors": 9,
          "./serialization": 10,
          "./utils": 11,
          events: 1,
          "obliterator/iterator": 13,
          "obliterator/take": 14,
        },
      ],
      6: [
        function (e, t, r) {
          "use strict";
          var n,
            i = e("./utils"),
            o = e("./graph"),
            a = (n = o) && n.__esModule ? n : { default: n },
            d = e("./errors");
          function u(e, t) {
            if (!(e instanceof t))
              throw new TypeError("Cannot call a class as a function");
          }
          function s(e, t) {
            if (!e)
              throw new ReferenceError(
                "this hasn't been initialised - super() hasn't been called"
              );
            return !t || ("object" != typeof t && "function" != typeof t)
              ? e
              : t;
          }
          function h(e, t) {
            if ("function" != typeof t && null !== t)
              throw new TypeError(
                "Super expression must either be null or a function, not " +
                  typeof t
              );
            (e.prototype = Object.create(t && t.prototype, {
              constructor: {
                value: e,
                enumerable: !1,
                writable: !0,
                configurable: !0,
              },
            })),
              t &&
                (Object.setPrototypeOf
                  ? Object.setPrototypeOf(e, t)
                  : (e.__proto__ = t));
          }
          var c = (function (e) {
              function t(r) {
                return (
                  u(this, t),
                  s(this, e.call(this, (0, i.assign)({ type: "directed" }, r)))
                );
              }
              return h(t, e), t;
            })(a.default),
            p = (function (e) {
              function t(r) {
                return (
                  u(this, t),
                  s(
                    this,
                    e.call(this, (0, i.assign)({ type: "undirected" }, r))
                  )
                );
              }
              return h(t, e), t;
            })(a.default),
            f = (function (e) {
              function t(r) {
                return (
                  u(this, t),
                  s(
                    this,
                    e.call(
                      this,
                      (0, i.assign)({ multi: !0, type: "directed" }, r)
                    )
                  )
                );
              }
              return h(t, e), t;
            })(a.default),
            l = (function (e) {
              function t(r) {
                return (
                  u(this, t),
                  s(
                    this,
                    e.call(
                      this,
                      (0, i.assign)({ multi: !0, type: "undirected" }, r)
                    )
                  )
                );
              }
              return h(t, e), t;
            })(a.default);
          function g(e) {
            e.from = function (t, r) {
              var n = new e(r);
              return n.import(t), n;
            };
          }
          g(a.default),
            g(c),
            g(p),
            g(f),
            g(l),
            (a.default.Graph = a.default),
            (a.default.DirectedGraph = c),
            (a.default.UndirectedGraph = p),
            (a.default.MultiDirectedGraph = f),
            (a.default.MultiUndirectedGraph = l),
            (a.default.InvalidArgumentsGraphError =
              d.InvalidArgumentsGraphError),
            (a.default.NotFoundGraphError = d.NotFoundGraphError),
            (a.default.UsageGraphError = d.UsageGraphError),
            (t.exports = a.default);
        },
        { "./errors": 4, "./graph": 5, "./utils": 11 },
      ],
      7: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.updateStructureIndex = function (e, t, r, n, i, o, a) {
              var d = e.multi,
                u = t ? "undirected" : "out",
                s = t ? "undirected" : "in",
                h = o[u][i];
              void 0 === h && ((h = d ? new Set() : r), (o[u][i] = h));
              d && h.add(r);
              if (n === i) return;
              void 0 === a[s][n] && (a[s][n] = h);
            }),
            (r.clearEdgeFromStructureIndex = function (e, t, r) {
              var n = e.multi,
                i = r.source,
                o = r.target,
                a = i.key,
                d = o.key,
                u = i[t ? "undirected" : "out"],
                s = t ? "undirected" : "in";
              if (d in u)
                if (n) {
                  var h = u[d];
                  1 === h.size ? (delete u[d], delete o[s][a]) : h.delete(r);
                } else delete u[d];
              if (n) return;
              delete o[s][a];
            }),
            (r.clearStructureIndex = function (e) {
              e._nodes.forEach(function (e) {
                void 0 !== e.in && ((e.in = {}), (e.out = {})),
                  void 0 !== e.undirected && (e.undirected = {});
              });
            }),
            (r.upgradeStructureIndexToMulti = function (e) {
              e._nodes.forEach(function (t, r) {
                if (t.out)
                  for (var n in t.out) {
                    var i = new Set();
                    i.add(t.out[n]),
                      (t.out[n] = i),
                      (e._nodes.get(n).in[r] = i);
                  }
                if (t.undirected)
                  for (var o in t.undirected)
                    if (!(o > r)) {
                      var a = new Set();
                      a.add(t.undirected[o]),
                        (t.undirected[o] = a),
                        (e._nodes.get(o).undirected[r] = a);
                    }
              });
            });
        },
        {},
      ],
      8: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.attachEdgeIteratorCreator = y),
            (r.attachEdgeIterationMethods = function (e) {
              s.forEach(function (t) {
                !(function (e, t) {
                  var r = t.name,
                    n = t.type,
                    i = t.direction;
                  e.prototype[r] = function (e, t) {
                    if (
                      "mixed" !== n &&
                      "mixed" !== this.type &&
                      n !== this.type
                    )
                      return [];
                    if (!arguments.length)
                      return (function (e, t) {
                        if (0 === e.size) return [];
                        if ("mixed" === t || t === e.type)
                          return (0, o.default)(e._edges.keys(), e._edges.size);
                        var r =
                            "undirected" === t
                              ? e.undirectedSize
                              : e.directedSize,
                          n = new Array(r),
                          i = "undirected" === t,
                          a = 0;
                        return (
                          e._edges.forEach(function (e, t) {
                            e instanceof d.UndirectedEdgeData === i &&
                              (n[a++] = t);
                          }),
                          n
                        );
                      })(this, n);
                    if (1 === arguments.length) {
                      e = "" + e;
                      var u = this._nodes.get(e);
                      if (void 0 === u)
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ': could not find the "' +
                            e +
                            '" node in the graph.'
                        );
                      return (function (e, t, r) {
                        var n = [];
                        "undirected" !== e &&
                          ("out" !== t && h(n, r.in),
                          "in" !== t && h(n, r.out));
                        "directed" !== e && h(n, r.undirected);
                        return n;
                      })("mixed" === n ? this.type : n, i, u);
                    }
                    if (2 === arguments.length) {
                      (e = "" + e), (t = "" + t);
                      var s = this._nodes.get(e);
                      if (!s)
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ':  could not find the "' +
                            e +
                            '" source node in the graph.'
                        );
                      if (!this._nodes.has(t))
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ':  could not find the "' +
                            t +
                            '" target node in the graph.'
                        );
                      return (function (e, t, r, n) {
                        var i = [];
                        "undirected" !== e &&
                          (void 0 !== r.in && "out" !== t && f(i, r.in, n),
                          void 0 !== r.out && "in" !== t && f(i, r.out, n));
                        "directed" !== e &&
                          void 0 !== r.undirected &&
                          f(i, r.undirected, n);
                        return i;
                      })(n, i, s, t);
                    }
                    throw new a.InvalidArgumentsGraphError(
                      "Graph." +
                        r +
                        ": too many arguments (expecting 0, 1 or 2 and got " +
                        arguments.length +
                        ")."
                    );
                  };
                })(e, t),
                  (function (e, t) {
                    var r = t.name,
                      n = t.type,
                      i = t.direction,
                      o = "forEach" + r[0].toUpperCase() + r.slice(1, -1);
                    e.prototype[o] = function (e, t, r) {
                      if (
                        "mixed" === n ||
                        "mixed" === this.type ||
                        n === this.type
                      ) {
                        if (1 === arguments.length)
                          return (function (e, t, r) {
                            if (0 === e.size) return;
                            if ("mixed" === t || t === e.type)
                              e._edges.forEach(function (e, t) {
                                var n = e.attributes,
                                  i = e.source,
                                  o = e.target;
                                r(
                                  t,
                                  n,
                                  i.key,
                                  o.key,
                                  i.attributes,
                                  o.attributes
                                );
                              });
                            else {
                              var n = "undirected" === t;
                              e._edges.forEach(function (e, t) {
                                if (e instanceof d.UndirectedEdgeData === n) {
                                  var i = e.attributes,
                                    o = e.source,
                                    a = e.target;
                                  r(
                                    t,
                                    i,
                                    o.key,
                                    a.key,
                                    o.attributes,
                                    a.attributes
                                  );
                                }
                              });
                            }
                          })(this, n, (r = e));
                        if (2 === arguments.length) {
                          (e = "" + e), (r = t);
                          var u = this._nodes.get(e);
                          if (void 0 === u)
                            throw new a.NotFoundGraphError(
                              "Graph." +
                                o +
                                ': could not find the "' +
                                e +
                                '" node in the graph.'
                            );
                          return (function (e, t, r, n) {
                            "undirected" !== e &&
                              ("out" !== t && c(r.in, n),
                              "in" !== t && c(r.out, n));
                            "directed" !== e && c(r.undirected, n);
                          })("mixed" === n ? this.type : n, i, u, r);
                        }
                        if (3 === arguments.length) {
                          (e = "" + e), (t = "" + t);
                          var s = this._nodes.get(e);
                          if (!s)
                            throw new a.NotFoundGraphError(
                              "Graph." +
                                o +
                                ':  could not find the "' +
                                e +
                                '" source node in the graph.'
                            );
                          if (!this._nodes.has(t))
                            throw new a.NotFoundGraphError(
                              "Graph." +
                                o +
                                ':  could not find the "' +
                                t +
                                '" target node in the graph.'
                            );
                          return (function (e, t, r, n, i) {
                            "undirected" !== e &&
                              (void 0 !== r.in && "out" !== t && l(r.in, n, i),
                              void 0 !== r.out && "in" !== t && l(r.out, n, i));
                            "directed" !== e &&
                              void 0 !== r.undirected &&
                              l(r.undirected, n, i);
                          })(n, i, s, t, r);
                        }
                        throw new a.InvalidArgumentsGraphError(
                          "Graph." +
                            o +
                            ": too many arguments (expecting 1, 2 or 3 and got " +
                            arguments.length +
                            ")."
                        );
                      }
                    };
                  })(e, t),
                  y(e, t);
              });
            });
          var n = u(e("obliterator/iterator")),
            i = u(e("obliterator/chain")),
            o = u(e("obliterator/take")),
            a = e("../errors"),
            d = e("../data");
          function u(e) {
            return e && e.__esModule ? e : { default: e };
          }
          var s = [
            { name: "edges", type: "mixed" },
            { name: "inEdges", type: "directed", direction: "in" },
            { name: "outEdges", type: "directed", direction: "out" },
            { name: "inboundEdges", type: "mixed", direction: "in" },
            { name: "outboundEdges", type: "mixed", direction: "out" },
            { name: "directedEdges", type: "directed" },
            { name: "undirectedEdges", type: "undirected" },
          ];
          function h(e, t) {
            for (var r in t)
              t[r] instanceof Set
                ? t[r].forEach(function (t) {
                    return e.push(t.key);
                  })
                : e.push(t[r].key);
          }
          function c(e, t) {
            for (var r in e)
              if (e[r] instanceof Set)
                e[r].forEach(function (e) {
                  return t(
                    e.key,
                    e.attributes,
                    e.source.key,
                    e.target.key,
                    e.source.attributes,
                    e.target.attributes
                  );
                });
              else {
                var n = e[r];
                t(
                  n.key,
                  n.attributes,
                  n.source.key,
                  n.target.key,
                  n.source.attributes,
                  n.target.attributes
                );
              }
          }
          function p(e) {
            var t = Object.keys(e),
              r = t.length,
              i = null,
              o = 0;
            return new n.default(function n() {
              var a = void 0;
              if (i) {
                var d = i.next();
                if (d.done) return (i = null), o++, n();
                a = d.value;
              } else {
                if (o >= r) return { done: !0 };
                var u = t[o];
                if ((a = e[u]) instanceof Set) return (i = a.values()), n();
                o++;
              }
              return {
                done: !1,
                value: [
                  a.key,
                  a.attributes,
                  a.source.key,
                  a.target.key,
                  a.source.attributes,
                  a.target.attributes,
                ],
              };
            });
          }
          function f(e, t, r) {
            r in t &&
              (t[r] instanceof Set
                ? t[r].forEach(function (t) {
                    return e.push(t.key);
                  })
                : e.push(t[r].key));
          }
          function l(e, t, r) {
            if (t in e)
              if (e[t] instanceof Set)
                e[t].forEach(function (e) {
                  return r(
                    e.key,
                    e.attributes,
                    e.source.key,
                    e.target.key,
                    e.source.attributes,
                    e.target.attributes
                  );
                });
              else {
                var n = e[t];
                r(
                  n.key,
                  n.attributes,
                  n.source.key,
                  n.target.key,
                  n.source.attributes,
                  n.target.attributes
                );
              }
          }
          function g(e, t) {
            var r = e[t];
            if (r instanceof Set) {
              var i = r.values();
              return new n.default(function () {
                var e = i.next();
                if (e.done) return e;
                var t = e.value;
                return {
                  done: !1,
                  value: [
                    t.key,
                    t.attributes,
                    t.source.key,
                    t.target.key,
                    t.source.attributes,
                    t.target.attributes,
                  ],
                };
              });
            }
            return n.default.of([
              r.key,
              r.attributes,
              r.source.key,
              r.target.key,
              r.source.attributes,
              r.target.attributes,
            ]);
          }
          function y(e, t) {
            var r = t.name,
              o = t.type,
              u = t.direction,
              s = r.slice(0, -1) + "Entries";
            e.prototype[s] = function (e, t) {
              if ("mixed" !== o && "mixed" !== this.type && o !== this.type)
                return n.default.empty();
              if (!arguments.length)
                return (function (e, t) {
                  if (0 === e.size) return n.default.empty();
                  var r = void 0;
                  return "mixed" === t
                    ? ((r = e._edges.values()),
                      new n.default(function () {
                        var e = r.next();
                        if (e.done) return e;
                        var t = e.value;
                        return {
                          value: [
                            t.key,
                            t.attributes,
                            t.source.key,
                            t.target.key,
                            t.source.attributes,
                            t.target.attributes,
                          ],
                          done: !1,
                        };
                      }))
                    : ((r = e._edges.values()),
                      new n.default(function e() {
                        var n = r.next();
                        if (n.done) return n;
                        var i = n.value;
                        return i instanceof d.UndirectedEdgeData ==
                          ("undirected" === t)
                          ? {
                              value: [
                                i.key,
                                i.attributes,
                                i.source.key,
                                i.target.key,
                                i.source.attributes,
                                i.target.attributes,
                              ],
                              done: !1,
                            }
                          : e();
                      }));
                })(this, o);
              if (1 === arguments.length) {
                e = "" + e;
                var r = this._nodes.get(e);
                if (!r)
                  throw new a.NotFoundGraphError(
                    "Graph." +
                      s +
                      ': could not find the "' +
                      e +
                      '" node in the graph.'
                  );
                return (function (e, t, r) {
                  var o = n.default.empty();
                  return (
                    "undirected" !== e &&
                      ("out" !== t &&
                        void 0 !== r.in &&
                        (o = (0, i.default)(o, p(r.in))),
                      "in" !== t &&
                        void 0 !== r.out &&
                        (o = (0, i.default)(o, p(r.out)))),
                    "directed" !== e &&
                      void 0 !== r.undirected &&
                      (o = (0, i.default)(o, p(r.undirected))),
                    o
                  );
                })(o, u, r);
              }
              if (2 === arguments.length) {
                (e = "" + e), (t = "" + t);
                var h = this._nodes.get(e);
                if (!h)
                  throw new a.NotFoundGraphError(
                    "Graph." +
                      s +
                      ':  could not find the "' +
                      e +
                      '" source node in the graph.'
                  );
                if (!this._nodes.has(t))
                  throw new a.NotFoundGraphError(
                    "Graph." +
                      s +
                      ':  could not find the "' +
                      t +
                      '" target node in the graph.'
                  );
                return (function (e, t, r, o) {
                  var a = n.default.empty();
                  return (
                    "undirected" !== e &&
                      (void 0 !== r.in &&
                        "out" !== t &&
                        o in r.in &&
                        (a = (0, i.default)(a, g(r.in, o))),
                      void 0 !== r.out &&
                        "in" !== t &&
                        o in r.out &&
                        (a = (0, i.default)(a, g(r.out, o)))),
                    "directed" !== e &&
                      void 0 !== r.undirected &&
                      o in r.undirected &&
                      (a = (0, i.default)(a, g(r.undirected, o))),
                    a
                  );
                })(o, u, h, t);
              }
              throw new a.InvalidArgumentsGraphError(
                "Graph." +
                  s +
                  ": too many arguments (expecting 0, 1 or 2 and got " +
                  arguments.length +
                  ")."
              );
            };
          }
        },
        {
          "../data": 3,
          "../errors": 4,
          "obliterator/chain": 12,
          "obliterator/iterator": 13,
          "obliterator/take": 14,
        },
      ],
      9: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.attachNeighborIterationMethods = function (e) {
              u.forEach(function (t) {
                !(function (e, t) {
                  var r = t.name,
                    n = t.type,
                    i = t.direction;
                  e.prototype[r] = function (e) {
                    if (
                      "mixed" !== n &&
                      "mixed" !== this.type &&
                      n !== this.type
                    )
                      return [];
                    if (2 === arguments.length) {
                      var t = "" + arguments[0],
                        d = "" + arguments[1];
                      if (!this._nodes.has(t))
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ': could not find the "' +
                            t +
                            '" node in the graph.'
                        );
                      if (!this._nodes.has(d))
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ': could not find the "' +
                            d +
                            '" node in the graph.'
                        );
                      return (function (e, t, r, n, i) {
                        var o = e._nodes.get(n);
                        if ("undirected" !== t) {
                          if ("out" !== r && void 0 !== o.in)
                            for (var a in o.in) if (a === i) return !0;
                          if ("in" !== r && void 0 !== o.out)
                            for (var d in o.out) if (d === i) return !0;
                        }
                        if ("directed" !== t && void 0 !== o.undirected)
                          for (var u in o.undirected) if (u === i) return !0;
                        return !1;
                      })(this, n, i, t, d);
                    }
                    if (1 === arguments.length) {
                      e = "" + e;
                      var u = this._nodes.get(e);
                      if (void 0 === u)
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            r +
                            ': could not find the "' +
                            e +
                            '" node in the graph.'
                        );
                      var h = (function (e, t, r) {
                        if ("mixed" !== e) {
                          if ("undirected" === e)
                            return Object.keys(r.undirected);
                          if ("string" == typeof t) return Object.keys(r[t]);
                        }
                        var n = new Set();
                        "undirected" !== e &&
                          ("out" !== t && s(n, r.in),
                          "in" !== t && s(n, r.out));
                        "directed" !== e && s(n, r.undirected);
                        return (0, o.default)(n.values(), n.size);
                      })("mixed" === n ? this.type : n, i, u);
                      return h;
                    }
                    throw new a.InvalidArgumentsGraphError(
                      "Graph." +
                        r +
                        ": invalid number of arguments (expecting 1 or 2 and got " +
                        arguments.length +
                        ")."
                    );
                  };
                })(e, t),
                  (function (e, t) {
                    var r = t.name,
                      n = t.type,
                      i = t.direction,
                      o = "forEach" + r[0].toUpperCase() + r.slice(1, -1);
                    e.prototype[o] = function (e, t) {
                      if (
                        "mixed" === n ||
                        "mixed" === this.type ||
                        n === this.type
                      ) {
                        e = "" + e;
                        var r = this._nodes.get(e);
                        if (void 0 === r)
                          throw new a.NotFoundGraphError(
                            "Graph." +
                              o +
                              ': could not find the "' +
                              e +
                              '" node in the graph.'
                          );
                        !(function (e, t, r, n) {
                          if ("mixed" !== e) {
                            if ("undirected" === e)
                              return h(r, r.undirected, n);
                            if ("string" == typeof t) return h(r, r[t], n);
                          }
                          var i = new Set();
                          "undirected" !== e &&
                            ("out" !== t && c(i, r, r.in, n),
                            "in" !== t && c(i, r, r.out, n));
                          "directed" !== e && c(i, r, r.undirected, n);
                        })("mixed" === n ? this.type : n, i, r, t);
                      }
                    };
                  })(e, t),
                  (function (e, t) {
                    var r = t.name,
                      o = t.type,
                      d = t.direction,
                      u = r.slice(0, -1) + "Entries";
                    e.prototype[u] = function (e) {
                      if (
                        "mixed" !== o &&
                        "mixed" !== this.type &&
                        o !== this.type
                      )
                        return n.default.empty();
                      e = "" + e;
                      var t = this._nodes.get(e);
                      if (void 0 === t)
                        throw new a.NotFoundGraphError(
                          "Graph." +
                            u +
                            ': could not find the "' +
                            e +
                            '" node in the graph.'
                        );
                      return (function (e, t, r) {
                        if ("mixed" !== e) {
                          if ("undirected" === e) return p(r, r.undirected);
                          if ("string" == typeof t) return p(r, r[t]);
                        }
                        var o = n.default.empty(),
                          a = new Set();
                        "undirected" !== e &&
                          ("out" !== t &&
                            (o = (0, i.default)(o, f(a, r, r.in))),
                          "in" !== t &&
                            (o = (0, i.default)(o, f(a, r, r.out))));
                        "directed" !== e &&
                          (o = (0, i.default)(o, f(a, r, r.undirected)));
                        return o;
                      })("mixed" === o ? this.type : o, d, t);
                    };
                  })(e, t);
              });
            });
          var n = d(e("obliterator/iterator")),
            i = d(e("obliterator/chain")),
            o = d(e("obliterator/take")),
            a = e("../errors");
          function d(e) {
            return e && e.__esModule ? e : { default: e };
          }
          var u = [
            { name: "neighbors", type: "mixed" },
            { name: "inNeighbors", type: "directed", direction: "in" },
            { name: "outNeighbors", type: "directed", direction: "out" },
            { name: "inboundNeighbors", type: "mixed", direction: "in" },
            { name: "outboundNeighbors", type: "mixed", direction: "out" },
            { name: "directedNeighbors", type: "directed" },
            { name: "undirectedNeighbors", type: "undirected" },
          ];
          function s(e, t) {
            if (void 0 !== t) for (var r in t) e.add(r);
          }
          function h(e, t, r) {
            for (var n in t) {
              var i = t[n];
              i instanceof Set && (i = i.values().next().value);
              var o = i.source,
                a = i.target,
                d = o === e ? a : o;
              r(d.key, d.attributes);
            }
          }
          function c(e, t, r, n) {
            for (var i in r) {
              var o = r[i];
              o instanceof Set && (o = o.values().next().value);
              var a = o.source,
                d = o.target,
                u = a === t ? d : a;
              e.has(u.key) || (e.add(u.key), n(u.key, u.attributes));
            }
          }
          function p(e, t) {
            var r = Object.keys(t),
              i = r.length,
              o = 0;
            return new n.default(function () {
              if (o >= i) return { done: !0 };
              var n = t[r[o++]];
              n instanceof Set && (n = n.values().next().value);
              var a = n.source,
                d = n.target,
                u = a === e ? d : a;
              return { done: !1, value: [u.key, u.attributes] };
            });
          }
          function f(e, t, r) {
            var i = Object.keys(r),
              o = i.length,
              a = 0;
            return new n.default(function n() {
              if (a >= o) return { done: !0 };
              var d = r[i[a++]];
              d instanceof Set && (d = d.values().next().value);
              var u = d.source,
                s = d.target,
                h = u === t ? s : u;
              return e.has(h.key)
                ? n()
                : (e.add(h.key), { done: !1, value: [h.key, h.attributes] });
            });
          }
        },
        {
          "../errors": 4,
          "obliterator/chain": 12,
          "obliterator/iterator": 13,
          "obliterator/take": 14,
        },
      ],
      10: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 }),
            (r.serializeNode = function (e, t) {
              var r = { key: e };
              Object.keys(t.attributes).length &&
                (r.attributes = (0, i.assign)({}, t.attributes));
              return r;
            }),
            (r.serializeEdge = function (e, t) {
              var r = { source: t.source.key, target: t.target.key };
              t.generatedKey || (r.key = e);
              Object.keys(t.attributes).length &&
                (r.attributes = (0, i.assign)({}, t.attributes));
              t instanceof n.UndirectedEdgeData && (r.undirected = !0);
              return r;
            }),
            (r.validateSerializedNode = function (e) {
              return (0, i.isPlainObject)(e)
                ? "key" in e
                  ? "attributes" in e &&
                    (!(0, i.isPlainObject)(e.attributes) ||
                      null === e.attributes)
                    ? "invalid-attributes"
                    : null
                  : "no-key"
                : "not-object";
            }),
            (r.validateSerializedEdge = function (e) {
              return (0, i.isPlainObject)(e)
                ? "source" in e
                  ? "target" in e
                    ? "attributes" in e &&
                      (!(0, i.isPlainObject)(e.attributes) ||
                        null === e.attributes)
                      ? "invalid-attributes"
                      : "undirected" in e && "boolean" != typeof e.undirected
                      ? "invalid-undirected"
                      : null
                    : "no-target"
                  : "no-source"
                : "not-object";
            });
          var n = e("./data"),
            i = e("./utils");
        },
        { "./data": 3, "./utils": 11 },
      ],
      11: [
        function (e, t, r) {
          "use strict";
          Object.defineProperty(r, "__esModule", { value: !0 });
          var n =
            "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
              ? function (e) {
                  return typeof e;
                }
              : function (e) {
                  return e &&
                    "function" == typeof Symbol &&
                    e.constructor === Symbol &&
                    e !== Symbol.prototype
                    ? "symbol"
                    : typeof e;
                };
          (r.assign = function () {
            for (
              var e = arguments[0] || {}, t = 1, r = arguments.length;
              t < r;
              t++
            )
              if (arguments[t])
                for (var n in arguments[t]) e[n] = arguments[t][n];
            return e;
          }),
            (r.getMatchingEdge = function (e, t, r, n) {
              var i = e._nodes.get(t),
                o = null;
              if (!i) return o;
              o =
                "mixed" === n
                  ? (i.out && i.out[r]) || (i.undirected && i.undirected[r])
                  : "directed" === n
                  ? i.out && i.out[r]
                  : i.undirected && i.undirected[r];
              return o;
            }),
            (r.isGraph = function (e) {
              return (
                null !== e &&
                "object" === (void 0 === e ? "undefined" : n(e)) &&
                "function" == typeof e.addUndirectedEdgeWithKey &&
                "function" == typeof e.dropNode
              );
            }),
            (r.isPlainObject = function (e) {
              return (
                "object" === (void 0 === e ? "undefined" : n(e)) &&
                null !== e &&
                e.constructor === Object
              );
            }),
            (r.prettyPrint = function (e) {
              for (var t = "" + e, r = "", n = 0, i = t.length; n < i; n++) {
                var o = i - n - 1;
                (r = t[o] + r), (n - 2) % 3 || n === i - 1 || (r = "," + r);
              }
              return r;
            }),
            (r.privateProperty = function (e, t, r) {
              Object.defineProperty(e, t, {
                enumerable: !1,
                configurable: !1,
                writable: !0,
                value: r,
              });
            }),
            (r.readOnlyProperty = function (e, t, r) {
              var n = { enumerable: !0, configurable: !0 };
              "function" == typeof r
                ? (n.get = r)
                : ((n.value = r), (n.writable = !1));
              Object.defineProperty(e, t, n);
            }),
            (r.incrementalId = function () {
              var e = 0;
              return function () {
                return "_geid" + e++ + "_";
              };
            });
        },
        {},
      ],
      12: [
        function (e, t, r) {
          var n = e("./iterator.js");
          t.exports = function () {
            var e,
              t = arguments,
              r = -1;
            return new n(function n() {
              if (!e) {
                if (++r >= t.length) return { done: !0 };
                e = t[r];
              }
              var i = e.next();
              return i.done ? ((e = null), n()) : i;
            });
          };
        },
        { "./iterator.js": 13 },
      ],
      13: [
        function (e, t, r) {
          function n(e) {
            Object.defineProperty(this, "_next", {
              writable: !1,
              enumerable: !1,
              value: e,
            }),
              (this.done = !1);
          }
          (n.prototype.next = function () {
            if (this.done) return { done: !0 };
            var e = this._next();
            return e.done && (this.done = !0), e;
          }),
            "undefined" != typeof Symbol &&
              (n.prototype[Symbol.iterator] = function () {
                return this;
              }),
            (n.of = function () {
              var e = arguments,
                t = e.length,
                r = 0;
              return new n(function () {
                return r >= t ? { done: !0 } : { done: !1, value: e[r++] };
              });
            }),
            (n.empty = function () {
              var e = new n(null);
              return (e.done = !0), e;
            }),
            (n.is = function (e) {
              return (
                e instanceof n ||
                ("object" == typeof e &&
                  null !== e &&
                  "function" == typeof e.next)
              );
            }),
            (t.exports = n);
        },
        {},
      ],
      14: [
        function (e, t, r) {
          t.exports = function (e, t) {
            for (
              var r,
                n = arguments.length > 1 ? t : 1 / 0,
                i = n !== 1 / 0 ? new Array(n) : [],
                o = 0;
              ;

            ) {
              if (o === n) return i;
              if ((r = e.next()).done) return o !== t ? i.slice(0, o) : i;
              i[o++] = r.value;
            }
          };
        },
        {},
      ],
    },
    {},
    [6]
  )(6);
});
