/**
 * @fileOverview random layout
 * @author shiwu.wyy@antfin.com
 */

import { PointTuple, OutNode, Edge, RandomLayoutOptions } from "./types";
import { Base } from "./base";

/**
 * 随机布局
 */
export class RandomLayout extends Base {
  /** 布局中心 */
  public center: PointTuple = [0, 0];

  /** 宽度 */
  public width: number = 300;

  /** 高度 */
  public height: number = 300;

  public nodes: OutNode[] = [];

  public edges: Edge[] = [];

  /** 迭代结束的回调函数 */
  public onLayoutEnd: () => void = () => {};

  constructor(options?: RandomLayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {
      center: [0, 0],
      width: 300,
      height: 300
    };
  }

  /**
   * 执行布局
   */
  public execute() {
    const self = this;
    const nodes = self.nodes;
    const layoutScale = 0.9;
    const center = self.center;
    if (!self.width && typeof window !== "undefined") {
      self.width = window.innerWidth;
    }
    if (!self.height && typeof window !== "undefined") {
      self.height = window.innerHeight;
    }

    if (nodes) {
      nodes.forEach((node) => {
        node.x = (Math.random() - 0.5) * layoutScale * self.width + center[0];
        node.y = (Math.random() - 0.5) * layoutScale * self.height + center[1];
      });
    }

    if (self.onLayoutEnd) self.onLayoutEnd();

    return {
      nodes,
      edges: this.edges
    };
  }

  public getType() {
    return "random";
  }
}
