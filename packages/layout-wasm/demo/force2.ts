import { Force2Layout, GForceGPULayout } from "@antv/layout";
import { outputAntvLayout, outputAntvLayoutWASM } from "./util";
import { CANVAS_SIZE } from "./types";

const ITERATIONS = 100;
const gravity = 100;
const linkDistance = 200;
const edgeStrength = 200;
const nodeStrength = 1000;

export async function antvlayout(graphModel: any) {
  const force2 = new Force2Layout({
    type: "gForce",
    factor: 1,
    gravity,
    linkDistance,
    edgeStrength,
    nodeStrength,
    coulombDisScale: 0.005,
    damping: 0.9,
    maxSpeed: 500,
    minMovement: 0.4,
    // interval: 0.02,
    // clusterNodeStrength: 20,
    preventOverlap: true,
    // distanceThresholdMode: "mean",
    // gravity: 1,
    // linkDistance: 1,
    // nodeStrength: 1,
    // edgeStrength: 0.1,
    maxIteration: ITERATIONS,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });
  force2.layout(graphModel);

  return outputAntvLayout(graphModel);
}

export async function antvlayoutGPU(graphModel: any) {
  return new Promise((resolve) => {
    const force2 = new GForceGPULayout({
      type: "gForce-gpu",
      // factor: 1,
      gravity,
      linkDistance,
      edgeStrength,
      nodeStrength,
      coulombDisScale: 0.005,
      damping: 0.9,
      maxSpeed: 500,
      minMovement: 0.4,
      // interval: 0.02,
      // clusterNodeStrength: 20,
      // preventOverlap: true,
      // distanceThresholdMode: "mean",
      // gravity: 1,
      // linkDistance: 1,
      // nodeStrength: 1,
      // edgeStrength: 0.1,
      maxIteration: ITERATIONS,
      center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
      onLayoutEnd: () => {
        resolve(outputAntvLayout(graphModel));
      },
    });
    force2.layout(graphModel);
  });
}

export async function antvlayoutWASM(
  { nodes, edges, masses, weights }: any,
  { force2 }: any
) {
  const { nodes: positions } = await force2({
    nodes: nodes.length,
    edges,
    positions: nodes,
    masses,
    weights,
    iterations: ITERATIONS,
    edge_strength: edgeStrength,
    link_distance: linkDistance,
    node_strength: nodeStrength,
    coulomb_dis_scale: 0.005,
    gravity,
    kg: gravity,
    factor: 1,
    interval: 0.02,
    damping: 0.9,
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });

  return outputAntvLayoutWASM(positions, edges);
}
