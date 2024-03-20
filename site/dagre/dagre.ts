import { Graph } from '@antv/graphlib';
import { DagreLayout } from '../../packages/layout';
import {
  DagreLayout as DagreWASMLayout,
  Threads,
} from '../../packages/layout-wasm';
import { CommonDagreLayoutOptions } from '../types';

export async function antvlayout(
  graphModel: Graph<any, any>,
  { rankdir, ranksep, nodesep, align }: CommonDagreLayoutOptions,
) {
  const dagre = new DagreLayout({
    controlPoints: true,
    // begin: [-100, -100],
    rankdir,
    ranksep,
    nodesep,
    align,
  });
  const positions = await dagre.execute(graphModel);

  return positions;
}

export async function antvlayoutWASM(
  graphModel: Graph<any, any>,
  { rankdir, ranksep, nodesep, align }: CommonDagreLayoutOptions,
  threads: Threads,
) {
  const dagre = new DagreWASMLayout({
    threads,
    // begin: [-100, -100],
    rankdir,
    ranksep: ranksep * 2,
    nodesep: nodesep * 2,
    align,
  });

  const positions = await dagre.execute(graphModel);
  return positions;
}
