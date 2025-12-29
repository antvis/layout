import type { DataOptions } from '../algorithm/types';
import { GraphLib } from '../model/data';
import type {
  EdgeData,
  Graph,
  GraphData,
  GraphEdge,
  GraphNode,
  NodeData,
} from '../types';

export class RuntimeContext<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  public readonly graph: GraphLib<N, E>;

  constructor(data: GraphData<N, E>, options: DataOptions<N, E> = {}) {
    this.graph = new GraphLib<N, E>(data, options);
  }

  public export(): Graph<N, E> {
    return this.graph.data();
  }

  public replace(result: Graph<N, E>): void {
    this.graph.replace(result);
  }

  public forEachNode(
    callback: (node: GraphNode<N>, index: number) => void,
  ): void {
    this.graph.forEachNode(callback);
  }

  public forEachEdge(
    callback: (edge: GraphEdge<E>, index: number) => void,
  ): void {
    this.graph.forEachEdge((edge, i) => {
      edge.sourceNode = this.graph.node(edge.source);
      edge.targetNode = this.graph.node(edge.target);
      callback(edge, i);
    });
  }

  public destroy(): void {
    this.graph.destroy();
  }
}
