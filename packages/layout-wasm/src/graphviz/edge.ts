import { px2Inch } from '../util';
import { GraphvizDotLayoutOptions, type TProcessData } from './types';

export class Edge {
  edge: TProcessData['edges'][0];
  source: string;
  target: string;
  attrs: {
    arrowsize?: number;
    tailclip?: boolean;
    fontsize?: number;
    label?: string;
    weight?: number;
    class?: string;
  } = {};
  layout: {
    path?: any;
    labelPosition?: any;
  } = {};
  constructor(e: TProcessData['edges'][0], options: GraphvizDotLayoutOptions) {
    this.edge = e;
    this.source = e.source;
    this.target = e.target;
    this.attrs = {
      ...this.getDefaultAttrs(),
      weight: options.getWeight?.(this.edge),
    };
  }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public setLayout(path: any, labelPosition: any): void {
    this.layout = {
      path,
      labelPosition,
    };
  }
  private getDefaultAttrs(): Edge['attrs'] {
    return {
      arrowsize: px2Inch(36),
      tailclip: false,
      fontsize: 12,
      label: 'MMM',
    };
  }
}
