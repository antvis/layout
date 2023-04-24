import { FruchtermanLayout, Graph } from "../packages/layout";
import { FruchtermanLayout as FruchtermanGPULayout } from "../packages/layout-gpu";
import { fruchtermanReingoldLayout } from "./graphology-layout-fruchtermanreingold";
import {
  outputAntvLayout,
  outputAntvLayoutWASM,
  outputGraphology,
} from "./util";
import { CANVAS_SIZE } from "./types";
import type { Layouts } from "../packages/layout-wasm";

const speed = 5;
const gravity = 1;
const ITERATIONS = 5000;
const SPEED_DIVISOR = 800;

export async function graphology(graph: any, { iterations }: any) {
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

export async function antvlayout(graphModel: Graph, { iterations }: any) {
  const fruchterman = new FruchtermanLayout({
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

export async function antvlayoutGPU(graphModel: Graph, { iterations }: any) {
  const fruchterman = new FruchtermanGPULayout({
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
  { nodes, edges, masses, weights }: any,
  { iterations }: any,
  { fruchterman }: Layouts
) {
  const area = CANVAS_SIZE * CANVAS_SIZE;
  const maxDisplace = Math.sqrt(area) / 10;
  const k2 = area / (nodes.length + 1);
  const k = Math.sqrt(k2);

  const { nodes: positions } = await fruchterman({
    nodes: nodes.length,
    edges,
    positions: nodes,
    masses,
    weights,
    iterations: iterations || ITERATIONS,
    ka: k, // k
    kg: gravity, // gravity
    kr: 0.01, // 0.01
    speed, // speed
    interval: 0.99, // *= maxDisplace
    damping: maxDisplace, // maxDisplace
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });

  return outputAntvLayoutWASM(positions, edges);
}
