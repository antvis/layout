import { DagreLayout } from "../../packages/layout";
import { CANVAS_SIZE, CommonDagreLayoutOptions, CommonLayoutOptions } from "../types";
import {
  Threads,
  DagreLayout as DagreWASMLayout,
} from "../../packages/layout-wasm";
import { Graph } from "@antv/graphlib";

export async function antvlayout(
  graphModel: Graph<any, any>,
  { rankdir, ranksep, nodesep, align }: CommonDagreLayoutOptions
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
  threads: Threads
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
