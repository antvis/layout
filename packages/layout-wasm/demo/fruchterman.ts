import { FruchtermanLayout, FruchtermanGPULayout } from "@antv/layout";
import { fruchtermanReingoldLayout } from "./graphology-layout-fruchtermanreingold";
import {
  outputAntvLayout,
  outputAntvLayoutWASM,
  outputGraphology,
} from "./util";
import { CANVAS_SIZE } from "./types";

const speed = 5;
const gravity = 1;
const ITERATIONS = 2000;
const SPEED_DIVISOR = 800;

export async function graphology(graph: any) {
  const positions = fruchtermanReingoldLayout(graph, {
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    iterations: ITERATIONS,
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

export async function antvlayoutGPU(graphModel: any) {
  return new Promise((resolve) => {
    const fruchterman = new FruchtermanGPULayout({
      type: "fruchterman-gpu",
      height: CANVAS_SIZE,
      width: CANVAS_SIZE,
      gravity,
      speed: speed / SPEED_DIVISOR,
      maxIteration: ITERATIONS,
      // @ts-ignore
      animate: false,
      onLayoutEnd: () => {
        resolve(outputAntvLayout(graphModel));
      },
    });
    fruchterman.layout(graphModel);
  });
}

export async function antvlayout(graphModel: any) {
  const fruchterman = new FruchtermanLayout({
    type: "fruchterman",
    height: CANVAS_SIZE,
    width: CANVAS_SIZE,
    gravity,
    speed,
    maxIteration: ITERATIONS,
    // @ts-ignore
    animate: false,
  });
  fruchterman.layout(graphModel);
  return outputAntvLayout(graphModel);
}

export async function antvlayoutWASM(
  { nodes, edges, masses, weights }: any,
  { fruchterman }: any
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
    iterations: ITERATIONS,
    ka: k, // k
    kg: gravity, // gravity
    kr: 0.01, // 0.01
    speed: speed, // speed
    damping: maxDisplace / SPEED_DIVISOR, // maxDisplace
    center: [CANVAS_SIZE / 2, CANVAS_SIZE / 2],
  });

  return outputAntvLayoutWASM(positions, edges);
}
