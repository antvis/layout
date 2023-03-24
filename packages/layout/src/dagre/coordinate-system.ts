import { Node } from "@antv/graphlib";
import { Graph, NodeData } from "../types";

const adjust = (
  g: Graph,
  rankDir: "TB" | "BT" | "LR" | "RL" | "tb" | "lr" | "rl" | "bt"
) => {
  const rd = rankDir.toLowerCase();
  if (rd === "lr" || rd === "rl") {
    swapWidthHeight(g);
  }
};

const undo = (
  g: Graph,
  rankDir: "TB" | "BT" | "LR" | "RL" | "tb" | "lr" | "rl" | "bt"
) => {
  const rd = rankDir.toLowerCase();
  if (rd === "bt" || rd === "rl") {
    reverseY(g);
  }

  if (rd === "lr" || rd === "rl") {
    swapXY(g);
    swapWidthHeight(g);
  }
};

const swapWidthHeight = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    swapWidthHeightOne(v);
  });
  g.getAllEdges().forEach((e) => {
    swapWidthHeightOne(e);
  });
};

const swapWidthHeightOne = (node: Node<NodeData>) => {
  const w = node.data.width;
  node.data.width = node.data.height;
  node.data.height = w;
};

const reverseY = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    reverseYOne(v);
  });

  g.getAllEdges().forEach((edge) => {
    (edge.data.points as Node<NodeData>[])?.forEach((point) =>
      reverseYOne(point)
    );
    if (edge.data.hasOwnProperty("y")) {
      reverseYOne(edge);
    }
  });
};

const reverseYOne = (node: Node<NodeData>) => {
  if (node.data.y) {
    node.data.y = -node.data.y;
  }
};

const swapXY = (g: Graph) => {
  g.getAllNodes().forEach((v) => {
    swapXYOne(v);
  });

  g.getAllEdges().forEach((edge) => {
    (edge.data.points as Node<NodeData>[])?.forEach((point) =>
      swapXYOne(point)
    );
    if (edge.data.hasOwnProperty("x")) {
      swapXYOne(edge);
    }
  });
};

const swapXYOne = (node: Node<NodeData>) => {
  const x = node.data.x;
  node.data.x = node.data.y;
  node.data.y = x;
};

export { adjust, undo };
