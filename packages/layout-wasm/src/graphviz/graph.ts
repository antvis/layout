
import { px2Inch } from '../util';
import { Edge } from './edge';
import { Node } from './node';
import { type TProcessData, type IAttrs, type IGraphvizAttrs } from './types';

// 通过接口数据构建内存 graph 对象
export class Graph {
  processData: TProcessData;
  edges: Edge[] = [];
  nodes: Node[] = [];
  leftToRight = false;
  attrs: IGraphvizAttrs = {};

  constructor(processData: TProcessData, attrs: IAttrs) {
    this.processData = processData;
    const { getWeight } = attrs;
    const attributes = { ...this.getDefaultAttrs(), ...attrs };
    this.initializeAttrs(attributes.nodeSpacing!, attributes.simpleMode);
    this.setLayoutAttrs(attributes.rankSpacing!);
    this.nodes = processData.nodes.map((n) => new Node(n));
    this.edges = processData.edges.map((e) => new Edge(e, { getWeight }));
  }

  private initializeAttrs(nodeSpacing: number, simpleMode = false) {
    this.attrs.nodesep = nodeSpacing;
    if (simpleMode) {
      // 限制节点连接调整的迭代次数为1次
      this.attrs.nclimit = 1;
      // 限制多边连接调整的迭代次数为1次
      this.attrs.mclimit = 1;
      // 用折线（直线段）而不是曲线来绘制边
      this.attrs.splines = false;
    }
  }
  private setLayoutAttrs(rankSpacing: number) {
    this.attrs.ranksep = rankSpacing;
  }
  private getDefaultAttrs(): IAttrs {
    return {
      leftToRight: false,
      nodeSpacing: px2Inch(56),
      rankSpacing: px2Inch(60),
      simpleMode: false,
    };
  }
}
