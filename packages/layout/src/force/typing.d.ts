declare module 'd3-octree' {
  export interface OctreeLeaf<T> {
    data: T;
    next?: OctreeLeaf<T>;
    length?: undefined;
  }

  export interface OctreeInternalNode<T>
    extends Array<OctreeInternalNode<T> | OctreeLeaf<T> | undefined> {
    length: 8;
  }

  export type OctreeNode<T> = OctreeInternalNode<T> | OctreeLeaf<T>;

  export interface Octree<T> {
    x(): (d: T) => number;
    x(x: (d: T) => number): this;

    y(): (d: T) => number;
    y(y: (d: T) => number): this;

    z(): (d: T) => number;
    z(z: (d: T) => number): this;

    extent(): [[number, number, number], [number, number, number]] | undefined;
    extent(extent: [[number, number, number], [number, number, number]]): this;

    cover(x: number, y: number, z: number): this;

    add(datum: T): this;
    addAll(data: T[]): this;

    remove(datum: T): this;
    removeAll(data: T[]): this;

    copy(): Octree<T>;
    root(): OctreeNode<T> | undefined;

    data(): T[];
    size(): number;

    find(x: number, y: number, z: number, radius?: number): T | undefined;
    findAllWithinRadius(x: number, y: number, z: number, radius: number): T[];

    visit(
      callback: (
        node: OctreeNode<T>,
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
      ) => void | boolean,
    ): this;

    visitAfter(
      callback: (
        node: OctreeNode<T>,
        x0: number,
        y0: number,
        z0: number,
        x1: number,
        y1: number,
        z1: number,
      ) => void,
    ): this;
  }

  export function octree<T = [number, number, number]>(
    data?: T[],
    x?: (d: T) => number,
    y?: (d: T) => number,
    z?: (d: T) => number,
  ): Octree<T>;
}
