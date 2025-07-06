
import { px2Inch } from '../util';
import { Edge } from './edge';
import { Node } from './node';
import { type TProcessData, type GraphvizDotLayoutOptions, type IGraphvizAttrs } from './types';

// 通过接口数据构建内存 graph 对象
export class Graph {
  processData: TProcessData;
  edges: Edge[] = [];
  nodes: Node[] = [];
  leftToRight = false;
  attrs: IGraphvizAttrs = {};

  constructor(processData: TProcessData, options: GraphvizDotLayoutOptions) {
    this.processData = processData;
    const attributes = { ...Graph.getDefaultAttrs(), ...this.inchFyAttrs(options) };
    this.initializeAttrs(attributes);
    this.setLayoutAttrs(attributes);
    this.nodes = processData.nodes.map((n) => new Node(n, options));
    this.edges = processData.edges.map((e) => new Edge(e, options));
  }

  private inchFyAttrs(attrs: GraphvizDotLayoutOptions) {
    return Object.entries(attrs).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: typeof val === 'number' ? px2Inch(val) : val,
    }), {})
  }

  private initializeAttrs(attrs: GraphvizDotLayoutOptions) {
    const { nodesep, nclimit, mclimit, splines, iterations } = attrs;
    this.attrs.nodesep = nodesep;
    // 限制节点连接调整的迭代次数为 n 次
    this.attrs.nclimit = nclimit ?? iterations;
    // 限制多边连接调整的迭代次数为 n 次
    this.attrs.mclimit = mclimit ?? iterations;
    // 用折线（直线段）而不是曲线来绘制边
    this.attrs.splines = splines;
  }
  private setLayoutAttrs(attr: GraphvizDotLayoutOptions) {
    this.attrs.ranksep = attr.ranksep;
  }
  static getDefaultAttrs(): GraphvizDotLayoutOptions {
    return {
      rankdir: 'TB',
      nodesep: px2Inch(50),
      ranksep: px2Inch(50),
    };
  }
}
