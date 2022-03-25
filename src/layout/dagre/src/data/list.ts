const filterOutLinks = (k: string, v: string) => {
  if (k !== "next" && k !== "prev") {
    return v;
  }
};

type LinkedNode<T> = {
  prev?: LinkedNode<T>;
  next?: LinkedNode<T>;
} & T;

const unlink = <T>(entry: LinkedNode<T>) => {
  entry.prev!.next = entry.next;
  entry.next!.prev = entry.prev;
  delete entry.next;
  delete entry.prev;
};

export default class List<T> {
  // a shortcut that next is head and prev is tail
  public shortcut: LinkedNode<T>;

  constructor() {
    const shortcut: LinkedNode<any> = {};
    shortcut.prev = shortcut;
    shortcut.next = shortcut.prev;
    this.shortcut = shortcut;
  }

  public dequeue() {
    const shortcut = this.shortcut;
    const entry = shortcut.prev;
    if (entry && entry !== shortcut) {
      unlink(entry);
      return entry;
    }
  }

  public enqueue(entry: LinkedNode<T>) {
    const shortcut = this.shortcut;
    if (entry.prev && entry.next) {
      unlink(entry);
    }
    entry.next = shortcut.next;
    shortcut.next!.prev = entry;
    shortcut.next = entry;
    entry.prev = shortcut;
  }

  public toString() {
    const strs = [];
    const sentinel = this.shortcut;
    let curr = sentinel.prev;
    while (curr !== sentinel) {
      strs.push(JSON.stringify(curr, filterOutLinks));
      curr = curr?.prev;
    }
    return `[${strs.join(", ")}]`;
  }
}
