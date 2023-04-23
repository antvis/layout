import graphologyLayout from "graphology-layout-forceatlas2";
import { ForceAtlas2Layout } from "@antv/layout";
import {
  outputAntvLayout,
  outputGraphology,
  outputAntvLayoutWASM,
} from "./util";

export interface ForceAtlas2LayoutOptions {
  iterations: number;
  kg: number;
  kr: number;
}

const ITERATIONS = 100;
const kg = 1;
const kr = 1;

export async function graphology(graph: any) {
  const positions = graphologyLayout(graph, {
    settings: {
      barnesHutOptimize: false,
      strongGravityMode: false,
      gravity: kg,
      scalingRatio: kr,
      slowDown: 1,
      // adjustSizes: true,
    },
    iterations: ITERATIONS,
    getEdgeWeight: "weight",
  });
  return outputGraphology(graph, positions);
}

export async function antvlayout(graphModel: any) {
  const forceAtlas2 = new ForceAtlas2Layout({
    type: "forceAtlas2",
    kr,
    kg,
    ks: 0.1,
    maxIteration: ITERATIONS,
  });
  forceAtlas2.layout(graphModel);
  return outputAntvLayout(graphModel);
}

export async function antvlayoutWASM(
  { nodes, edges, masses, weights }: any,
  { forceatlas2 }: any
) {
  const { nodes: positions } = await forceatlas2({
    nodes: nodes.length,
    edges,
    positions: nodes,
    masses,
    weights,
    iterations: ITERATIONS,
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
