import { DagreAlign, DagreRankdir } from '../packages/layout';

export enum TestName {
  GRAPHOLOGY = 'graphology',
  ANTV_LAYOUT = '@antv/layout',
  ANTV_LAYOUT_WASM_SINGLETHREAD = '@antv/layout-wasm - singlethread',
  ANTV_LAYOUT_WASM_MULTITHREADS = '@antv/layout-wasm - multithreads',
  ANTV_LAYOUT_GPU = '@antv/layout-gpu',
}

export const CANVAS_SIZE = 800;

export type CommonLayoutOptions = {
  iterations: number;
  min_movement: number;
  distance_threshold_mode: 'mean' | 'max' | 'min';
};

export type CommonDagreLayoutOptions = {
  rankdir: DagreRankdir;
  ranksep: number;
  nodesep: number;
  align: DagreAlign;
};
