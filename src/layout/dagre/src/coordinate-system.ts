import { Graph } from "../graph";

const adjust = (g: Graph) => {
  const rankDir = g.graph().rankdir?.toLowerCase();
  if (rankDir === "lr" || rankDir === "rl") {
    swapWidthHeight(g);
  }
};

const undo = (g: Graph) => {
  const rankDir = g.graph().rankdir?.toLowerCase();
  if (rankDir === "bt" || rankDir === "rl") {
    reverseY(g);
  }

  if (rankDir === "lr" || rankDir === "rl") {
    swapXY(g);
    swapWidthHeight(g);
  }
};

const swapWidthHeight = (g: Graph) => {
  g.nodes().forEach((v) => {
    swapWidthHeightOne(g.node(v)!);
  });
  g.edges().forEach((e) => {
    swapWidthHeightOne(g.edge(e)!);
  });
};

const swapWidthHeightOne = (attrs: { width?: number; height?: number }) => {
  const w = attrs.width;
  attrs.width = attrs.height;
  attrs.height = w;
};

const reverseY = (g: Graph) => {
  g.nodes().forEach((v) => {
    reverseYOne(g.node(v)!);
  });

  g.edges().forEach((e) => {
    const edge = g.edge(e)!;
    edge.points?.forEach((point) => reverseYOne(point));
    if (edge.hasOwnProperty("y")) {
      reverseYOne(edge as { y: number });
    }
  });
};

const reverseYOne = (attrs: { y?: number }) => {
  if (attrs?.y) {
    attrs.y = -attrs.y;
  }
};

const swapXY = (g: Graph) => {
  g.nodes().forEach((v) => {
    swapXYOne(g.node(v));
  });

  g.edges().forEach((e) => {
    const edge = g.edge(e)!;
    edge.points?.forEach((point) => swapXYOne(point));
    if (edge.hasOwnProperty("x")) {
      swapXYOne(edge);
    }
  });
};

const swapXYOne = (attrs: any) => {
  const x = attrs.x;
  attrs.x = attrs.y;
  attrs.y = x;
};

export default { adjust, undo };
