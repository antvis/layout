import { ForceLayout, Graph } from "../packages/layout";
import { GForceLayout } from "../packages/layout-gpu";
import {
  distanceThresholdMode,
  outputAntvLayout,
  outputAntvLayoutWASM,
} from "./util";
import { CANVAS_SIZE } from "./types";
import type { Layouts } from "../packages/layout-wasm";
import { CommonLayoutOptions } from "./main";

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

export async function antvlayoutGPU(
  graphModel: any,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions
) {
  const force2 = new GForceLayout({
    factor,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale: coulombDisScale,
    damping,
    maxSpeed,
    minMovement: min_movement,
    interval,
    // clusterNodeStrength: 20,
    // preventOverlap: true,
    distanceThresholdMode: distance_threshold_mode,
    maxIteration: iterations || ITERATIONS,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  const positions = await force2.execute(graphModel);

  return outputAntvLayout(positions);
}

export async function antvlayoutWASM(
  { nodes, edges, masses, weights }: any,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions,
  { force2 }: Layouts
) {
  const { nodes: positions } = await force2({
    nodes,
    edges,
    masses,
    weights,
    iterations: iterations || ITERATIONS,
    min_movement,
    distance_threshold_mode: distanceThresholdMode(distance_threshold_mode),
    edge_strength: edgeStrength,
    link_distance: linkDistance,
    node_strength: nodeStrength,
    coulomb_dis_scale: coulombDisScale,
    kg: gravity,
    factor,
    interval,
    damping,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    max_speed: maxSpeed,
  });

  return outputAntvLayoutWASM(positions, edges);
}
