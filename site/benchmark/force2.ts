import { ForceLayout, Graph } from "../../packages/layout";
import { outputAntvLayout } from "./util";
import { CANVAS_SIZE, CommonLayoutOptions } from "../types";
import {
  Threads,
  ForceLayout as ForceWASMLayout,
} from "../../packages/layout-wasm";

const ITERATIONS = 100;
const gravity = 10;
const linkDistance = 200;
const edgeStrength = 200;
const nodeStrength = 1000;
const maxSpeed = 1000;
const damping = 0.9;
const factor = 1;
const coulombDisScale = 0.005;
const interval = 0.02;

export async function antvlayout(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const force2 = new ForceLayout({
    factor,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale,
    damping,
    maxSpeed,
    minMovement: min_movement,
    interval,
    // clusterNodeStrength: 20,
    preventOverlap: true,
    distanceThresholdMode: distance_threshold_mode,
    maxIteration: iterations || ITERATIONS,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  const positions = await force2.execute(graphModel);

  return outputAntvLayout(positions);
}

export async function antvlayoutWASM(
  graphModel: Graph,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions,
  threads: Threads
) {
  const force = new ForceWASMLayout({
    threads,
    maxIteration: iterations || ITERATIONS,
    minMovement: min_movement,
    distanceThresholdMode: distance_threshold_mode,
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    factor,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale,
    damping,
    maxSpeed,
    interval,
  });

  const positions = await force.execute(graphModel);
  return outputAntvLayout(positions);
}
