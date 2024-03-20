import { Node } from '@antv/graphlib';
import type { Graph, NodeData, Point } from '../types';
import type { DagreRankdir } from './types';

const adjust = (g: Graph, rankdir: DagreRankdir) => {
  const rd = rankdir.toLowerCase();
  if (rd === 'lr' || rd === 'rl') {
    swapWidthHeight(g);
  }
};

const undo = (g: Graph, rankdir: DagreRankdir) => {
  const rd = rankdir.toLowerCase();
  if (rd === 'bt' || rd === 'rl') {
    reverseY(g);
  }

  if (rd === 'lr' || rd === 'rl') {
    swapXY(g);
    swapWidthHeight(g);
  }
};

const swapWidthHeight = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    swapWidthHeightOne(v);
  });
  g.getAllEdges().forEach((e) => {
    swapWidthHeightOne(e);
  });
};

const swapWidthHeightOne = (node: Node<NodeData>) => {
  const w = node.data.width;
  node.data.width = node.data.height;
  node.data.height = w;
};

const reverseY = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    reverseYOne(v.data);
  });

  g.getAllEdges().forEach((edge) => {
    edge.data.points?.forEach((point: Point) => reverseYOne(point));
    if (edge.data.hasOwnProperty('y')) {
      reverseYOne(edge.data);
    }
  });
};

const reverseYOne = (node: any) => {
  if (node?.y) {
    node.y = -node.y;
  }
};

const swapXY = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    swapXYOne(v.data);
  });

  g.getAllEdges().forEach((edge) => {
    edge.data.points?.forEach((point: Point) => swapXYOne(point));
    if (edge.data.hasOwnProperty('x')) {
      swapXYOne(edge.data);
    }
  });
};

const swapXYOne = (node: any) => {
  const x = node.x;
  node.x = node.y;
  node.y = x;
};

export { adjust, undo };
