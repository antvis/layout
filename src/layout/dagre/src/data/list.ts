/*
 * Simple doubly linked list implementation derived from Cormen, et al.,
 * "Introduction to Algorithms".
 */

const unlink = (entry: any) => {
  entry._prev._next = entry._next;
  entry._next._prev = entry._prev;
  delete entry._next;
  delete entry._prev;
};

const filterOutLinks = (k: string, v: string) => {
  if (k !== "_next" && k !== "_prev") {
    return v;
  }
};

class List {
  public isentinel;

  constructor() {
    const sentinel: any = {};
    sentinel._next = sentinel._prev = sentinel;
    this.isentinel = sentinel;
  }

  public dequeue() {
    const sentinel = this.isentinel;
    const entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
  }

  public enqueue() {
    const sentinel = this.isentinel;
    const entry = sentinel._prev;
    if (entry !== sentinel) {
      unlink(entry);
      return entry;
    }
  }

  public toString() {
    const strs = [];
    const sentinel = this.isentinel;
    let curr = sentinel._prev;
    while (curr !== sentinel) {
      strs.push(JSON.stringify(curr, filterOutLinks));
      curr = curr._prev;
    }
    return `[${strs.join(", ")}]`;
  }
}

export default List;