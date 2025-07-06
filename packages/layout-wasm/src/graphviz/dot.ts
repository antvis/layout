import { type Graph } from './graph';
import { type Node } from './node';
import { type TIdsMap, type TNodesEdgesMap } from './types';

// 通过 graph 对象构建 dot lang string
export class Dot {
  graph: Graph;
  nodesEdgesMap: TNodesEdgesMap = [];
  idsMap: TIdsMap = [];
  output: {
    outputString: string;
    outputMap: TNodesEdgesMap;
  } | undefined;
  constructor(graph: Graph) {
    this.graph = graph;
    this.convertGraph2Dot();
  }
  public getOutput(): Dot['output'] {
    return this.output;
  }
  private convertGraph2Dot() {
    // init dot
    let dot = `digraph g {`;
    dot += this.initializeGraphOrientation();
    dot += `graph [${this.attributesToString(this.graph.attrs)}];`;

    dot += this.writeNodes(this.graph.nodes, this.nodesEdgesMap, this.idsMap);
    dot += this.writeEdges(this.graph, this.nodesEdgesMap, this.idsMap);
    dot += '}';
    this.output = {
      outputString: dot,
      outputMap: this.nodesEdgesMap,
    };
  }
  private initializeGraphOrientation() {
    return this.graph.leftToRight ? ' rankdir=LR ' : ' ';
  }
  private writeNodes(nodes: Graph['nodes'], nodesEdgesMap: TNodesEdgesMap, idsMap: TIdsMap) {
    return nodes
      .map((node, index) => {
        const ret = `${this.createNode(index, node)}`;
        this.addToMaps(node, nodesEdgesMap, idsMap);
        return ret;
      })
      .join('');
  }
  private writeEdges(graph: Graph, nodesEdgesMap: TNodesEdgesMap, idsMap: TIdsMap) {
    return graph.edges
      .map((edge) => {
        // eslint-disable-next-line no-param-reassign
        edge.attrs.class = `edge_${nodesEdgesMap.length}`;
        nodesEdgesMap.push(edge);
        return `${this.findIndex(
          idsMap,
          graph.nodes.find((n) => n.node.id === edge.source)
        ).toString()} -> ${this.findIndex(
          idsMap,
          graph.nodes.find((n) => n.node.id === edge.target)
        ).toString()} [ ${this.attributesToString(edge.attrs)} ];`;
      })
      .join('');
  }
  private attributesToString(attrs: Record<string, any>) {
    return Object.entries(attrs)
      .map(([key, val]) => `${key}="${val}"`)
      .join(', ');
  }
  private createNode(index: number, node: Node) {
    let ret = '';
    // todo: 是否需要明确 rank=source
    ret += `${index} [ ${this.attributesToString(node.attrs)} ];`;
    // todo: 是否需要明确 rank=sink
    return ret;
  }
  private addToMaps(node: Node, nodesEdgesMap: TNodesEdgesMap, idsMap: TIdsMap) {
    idsMap.push({
      node,
      index: nodesEdgesMap.length,
    });
    nodesEdgesMap.push(node);
  }
  private findIndex(idsMap: TIdsMap, node?: Node) {
    // 1. 如果传入的节点不存在，直接返回-1
    if (!node) return -1;

    // 2. 在idsMap数组中查找与当前节点匹配的项
    const foundItem = idsMap.find((item) => item.node === node);

    // 3. 如果未找到匹配项，返回-1
    if (foundItem == null) return -1;

    // 4. 如果找到项的index值为null/undefined，返回-1
    if (foundItem.index == null) return -1;

    // 5. 返回有效的index值
    return foundItem.index;
  }
}
