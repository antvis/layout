import { Graph } from "../../graph";
import { asNonCompoundGraph, buildLayerMatrix } from "../util";
import {
  alignCoordinates,
  balance,
  findSmallestWidthAlignment,
  findType1Conflicts,
  findType2Conflicts,
  horizontalCompaction,
  verticalAlignment,
} from "./bk";

const positionY = (g: Graph) => {
  const layering = buildLayerMatrix(g);
  const rankSep = g.graph().ranksep as number;
  let prevY = 0;
  layering?.forEach((layer) => {
    const heights = layer.map((v) => g.node(v)!.height!);
    const maxHeight = Math.max(...heights, 0);
    layer?.forEach((v: string) => {
      g.node(v)!.y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
};

const positionX = (g: Graph) => {
  const layering = buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering)
  );

  const xss: Record<string, Record<string, number>> = {};
  let adjustedLayering: string[][] = [];
  ["u", "d"].forEach((vert) => {
    adjustedLayering =
      vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map((inner) =>
          Object.values(inner).reverse()
        );
      }

      const neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(
        g,
        adjustedLayering,
        conflicts,
        neighborFn
      );
      const xs = horizontalCompaction(
        g,
        adjustedLayering,
        align.root,
        align.align,
        horiz === "r"
      );
      if (horiz === "r") {
        Object.keys(xs).forEach((xsKey) => (xs[xsKey] = -xs[xsKey]));
      }
      xss[vert + horiz] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  smallestWidth && alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align as string);
};

const position = (g: Graph) => {
  const ng = asNonCompoundGraph(g);

  positionY(ng);
  const xs = positionX(ng);
  Object.keys(xs)?.forEach((key: string) => {
    ng.node(key)!.x = xs[key];
  });
};

export default position;
