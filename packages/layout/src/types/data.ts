import { Edge as IEdge, Node as INode, PlainObject } from '@antv/graphlib';

export interface GraphData<
  N extends PlainObject = PlainObject,
  E extends PlainObject = PlainObject,
> {
  nodes: (Pick<INode<N>, 'id'> & N)[];
  edges?: (Pick<IEdge<E>, 'source' | 'target'> & E)[];
}
