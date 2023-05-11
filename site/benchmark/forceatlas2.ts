import graphologyLayout from "graphology-layout-forceatlas2";
import { ForceAtlas2Layout, Graph } from "../../packages/layout";
import { outputAntvLayout, outputGraphology } from "./util";
import {
  Threads,
  ForceAtlas2Layout as ForceAtlas2WASMLayout,
} from "../../packages/layout-wasm";
import { CANVAS_SIZE, CommonLayoutOptions } from "../types";

export interface ForceAtlas2LayoutOptions {
  iterations: number;
  kg: number;
  kr: number;
}

const ITERATIONS = 100;
const kg = 1;
const kr = 1;

export async function graphology(
  graph: any,
  { iterations }: CommonLayoutOptions
) {
  const positions = graphologyLayout(graph, {
    settings: {
      barnesHutOptimize: false,
      strongGravityMode: false,
      gravity: kg,
      scalingRatio: kr,
      slowDown: 1,
      // adjustSizes: true,
    },
    iterations: iterations || ITERATIONS,
    getEdgeWeight: "weight",
  });
  return outputGraphology(graph, positions, (node) => {
    node.x = node.x + CANVAS_SIZE / 2;
    node.y = node.y + CANVAS_SIZE / 2;
  });
}

export async function antvlayout(
  graphModel: Graph,
  { iterations }: CommonLayoutOptions
) {
  const forceAtlas2 = new ForceAtlas2Layout({
    kr,
    kg,
    ks: 0.1,
    maxIteration: iterations || ITERATIONS,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  const positions = await forceAtlas2.execute(graphModel);
  return outputAntvLayout(positions);
}

export async function antvlayoutWASM(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions,
  threads: Threads
) {
  const forceatlas2 = new ForceAtlas2WASMLayout({
    threads,
    maxIteration: iterations || ITERATIONS,
    minMovement: min_movement,
    distanceThresholdMode: distance_threshold_mode,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    kg,
    kr,
    ks: 0.1,
  });

  const positions = await forceatlas2.execute(graphModel);
  return outputAntvLayout(positions);
}
