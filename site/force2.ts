import { ForceLayout, Graph } from "../packages/layout";
import { GForceLayout } from "../packages/layout-gpu";
import { outputAntvLayout, outputAntvLayoutWASM } from "./util";
import { CANVAS_SIZE } from "./types";
import type { Layouts } from "../packages/layout-wasm";

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
const minMovement = 0.4;

export async function antvlayout(graphModel: Graph, { iterations }: any) {
  const force2 = new ForceLayout({
    factor,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale,
    damping,
    maxSpeed,
    minMovement,
    interval,
    // clusterNodeStrength: 20,
    preventOverlap: true,
    // distanceThresholdMode: "mean",
    // gravity: 1,
    // linkDistance: 1,
    // nodeStrength: 1,
    // edgeStrength: 0.1,
    maxIteration: iterations || ITERATIONS,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  const positions = await force2.execute(graphModel);

  return outputAntvLayout(positions);
}

export async function antvlayoutGPU(graphModel: any, { iterations }: any) {
  const force2 = new GForceLayout({
    factor,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale: coulombDisScale,
    damping,
    maxSpeed,
    minMovement,
    interval,
    // clusterNodeStrength: 20,
    // preventOverlap: true,
    // distanceThresholdMode: "mean",
    maxIteration: iterations || ITERATIONS,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  const positions = await force2.execute(graphModel);

  return outputAntvLayout(positions);
}

export async function antvlayoutWASM(
  { nodes, edges, masses, weights }: any,
  { iterations }: any,
  { force2 }: Layouts
) {
  const { nodes: positions } = await force2({
    nodes: nodes.length,
    edges,
    positions: nodes,
    masses,
    weights,
    iterations: iterations || ITERATIONS,
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
    min_movement: minMovement,
  });

  return outputAntvLayoutWASM(positions, edges);
}
