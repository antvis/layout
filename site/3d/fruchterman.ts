import { FruchtermanLayout, Graph } from "../../packages/layout";
import { outputAntvLayout } from "./util";
import { CANVAS_SIZE, CommonLayoutOptions } from "../types";
import {
  Threads,
  FruchtermanLayout as FruchtermanWASMLayout,
} from "../../packages/layout-wasm";

const speed = 5;
const gravity = 1;
const ITERATIONS = 5000;

export async function antvlayout(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const fruchterman = new FruchtermanLayout({
    dimensions: 3,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0],
    gravity,
    speed,
    maxIteration: iterations || ITERATIONS,
  });
  const positions = await fruchterman.execute(graphModel);
  return outputAntvLayout(positions);
}

export async function antvlayoutWASM(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions,
  threads: Threads
) {
  const fruchterman = new FruchtermanWASMLayout({
    threads,
    dimensions: 3,
    maxIteration: iterations || ITERATIONS,
    minMovement: min_movement,
    distanceThresholdMode: distance_threshold_mode,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2, 0],
    gravity,
    speed,
  });

  const positions = await fruchterman.execute(graphModel);
  return outputAntvLayout(positions);
}
