/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */

const unlink = (entry: any) => {
  entry._prev._next = entry._next;
  entry._next._prev = entry._prev;
  delete entry._next;
  delete entry._prev;
}

const filterOutLinks = (k: string, v: string) => {
  if (k !== "_next" && k !== "_prev") {
    return v;
  }
}

class List {
  public _sentinel;

  constructor() {
    const sentinel: any = {};
    sentinel._next = sentinel._prev = sentinel;
    this._sentinel = sentinel;
  }

  public dequeue() {
    const sentinel = this._sentinel;
    const entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
  }

  public enqueue() {
    const sentinel = this._sentinel;
    const entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
  }

  public toString() {
    const strs = [];
    const sentinel = this._sentinel;
    let curr = sentinel._prev;
    while (curr !== sentinel) {
      strs.push(JSON.stringify(curr, filterOutLinks));
      curr = curr._prev;
    }
    return "[" + strs.join(", ") + "]";
  }
}

export default List;

// List.prototype.dequeue = function() {
//   const sentinel = this._sentinel;
//   const entry = sentinel._prev;
//   if (entry !== sentinel) {
//     unlink(entry);
//     return entry;
//   }
// };

// List.prototype.enqueue = function(entry) {
//   const sentinel = this._sentinel;
//   if (entry._prev && entry._next) {
//     unlink(entry);
//   }
//   entry._next = sentinel._next;
//   sentinel._next._prev = entry;
//   sentinel._next = entry;
//   entry._prev = sentinel;
// };

// List.prototype.toString = function() {
//   const strs = [];
//   const sentinel = this._sentinel;
//   const curr = sentinel._prev;
//   while (curr !== sentinel) {
//     strs.push(JSON.stringify(curr, filterOutLinks));
//     curr = curr._prev;
//   }
//   return "[" + strs.join(", ") + "]";
// };