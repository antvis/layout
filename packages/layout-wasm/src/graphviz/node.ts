import { px2Inch } from '../util';
import { GraphvizDotLayoutOptions, type TProcessData } from './types';

export class Node {
  options: GraphvizDotLayoutOptions;
  node: TProcessData['nodes'][0];
  attrs: {
    width?: number;
    height?: number;
    shape?: 'box' | 'circle';
  } = {};
  layout: {
    position?: { x: number; y: number };
    size?: { width: number; height: number };
  } = {};
  constructor(n: TProcessData['nodes'][0], options: GraphvizDotLayoutOptions) {
    this.node = n;
    this.options = options;
    this.attrs.shape = 'box';
    this.attrs.width = parseFloat(px2Inch(this.node.data.width).toFixed(2));
    this.attrs.height = parseFloat(px2Inch(this.node.data.height).toFixed(2));
  }
  public setLayout(layout: Node['layout']): void {
    this.layout = layout;
  }
}
