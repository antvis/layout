import graphologyLayout from "graphology-layout-forceatlas2";
import { ForceAtlas2Layout, Graph } from "../packages/layout";
import {
  outputAntvLayout,
  outputGraphology,
  outputAntvLayoutWASM,
  distanceThresholdMode,
} from "./util";
import type { Layouts } from "../packages/layout-wasm";
import { CANVAS_SIZE } from "./types";
import { CommonLayoutOptions } from "./main";

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
  { nodes, edges, masses, weights }: any,
  { iterations, min_movement, distance_threshold_mode }: CommonLayoutOptions,
  { forceatlas2 }: Layouts
) {
  const { nodes: positions } = await forceatlas2({
    nodes,
    edges,
    masses,
    weights,
    iterations: iterations || ITERATIONS,
    min_movement,
    distance_threshold_mode: distanceThresholdMode(distance_threshold_mode),
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
    ka: 1.0,
    kg,
    kr,
    speed: 0.1,
    prevent_overlapping: false,
    node_radius: 10,
    kr_prime: 10,
    strong_gravity: false,
    lin_log: false,
    dissuade_hubs: false,
  });

  return outputAntvLayoutWASM(positions, edges);
}
