import { FruchtermanLayout, Graph } from "../../packages/layout";
import { FruchtermanLayout as FruchtermanGPULayout } from "../../packages/layout-webgl";
import { FruchtermanLayout as FruchtermanWebGPULayout } from "../../packages/layout-webgpu";
import { fruchtermanReingoldLayout } from "./graphology-layout-fruchtermanreingold";
import { outputAntvLayout, outputGraphology } from "./util";
import { CANVAS_SIZE, CommonLayoutOptions } from "../types";
import {
  Threads,
  FruchtermanLayout as FruchtermanWASMLayout,
} from "../../packages/layout-wasm";

const speed = 5;
const gravity = 1;
const ITERATIONS = 5000;

export async function graphology(
  graph: any,
  { iterations }: CommonLayoutOptions
) {
  const positions = fruchtermanReingoldLayout(graph, {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    iterations: iterations || ITERATIONS,
    speed,
    gravity,
    C: 1,
    edgeWeightInfluence: 0,
  });

  return outputGraphology(graph, positions, (node) => {
    node.x = node.x + CANVAS_SIZE / 2;
    node.y = node.y + CANVAS_SIZE / 2;
  });
}

export async function antvlayout(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const fruchterman = new FruchtermanLayout({
    dimensions: 2,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    gravity,
    speed,
    maxIteration: iterations || ITERATIONS,
  });
  const positions = await fruchterman.execute(graphModel);
  return outputAntvLayout(positions);
}

export async function antvlayoutGPU(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const fruchterman = new FruchtermanGPULayout({
    dimensions: 2,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    gravity,
    speed,
    maxIteration: iterations || ITERATIONS,
  });
  const positions = await fruchterman.execute(graphModel);
  return outputAntvLayout(positions);
}

export async function antvlayoutWebGPU(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const fruchterman = new FruchtermanWebGPULayout({
    dimensions: 2,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
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
    dimensions: 2,
    maxIteration: iterations || ITERATIONS,
    minMovement: min_movement,
    distanceThresholdMode: distance_threshold_mode,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    gravity,
    speed,
  });

  const positions = await fruchterman.execute(graphModel);
  return outputAntvLayout(positions);
}
