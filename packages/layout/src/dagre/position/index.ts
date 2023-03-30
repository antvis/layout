import { ID } from "@antv/graphlib";
import { DagreAlign, Graph as IGraph } from "../../types";
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

const positionY = (
  g: IGraph,
  options?: Partial<{
    ranksep: number;
  }>
) => {
  const { ranksep = 0 } = options || {};
  const layering = buildLayerMatrix(g);

  let prevY = 0;
  layering?.forEach((layer) => {
    const heights = layer.map((v) => g.getNode(v).data.height!);
    const maxHeight = Math.max(...heights, 0);
    layer?.forEach((v: string) => {
      g.getNode(v).data.y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + ranksep;
  });
};

const positionX = (
  g: IGraph,
  options?: Partial<{
    align: DagreAlign;
    nodesep: number;
    edgesep: number;
  }>
): Record<ID, number> => {
  const { align: graphAlign, nodesep = 0, edgesep = 0 } = options || {};

  const layering = buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering)
  );

  const xss: Record<string, Record<string, number>> = {};
  let adjustedLayering: ID[][] = [];
  ["u", "d"].forEach((vert) => {
    adjustedLayering =
      vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map((inner) =>
          Object.values(inner).reverse()
        );
      }

      const neighborFn = (
        vert === "u" ? g.getPredecessors : g.getSuccessors
      ).bind(g);
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
        nodesep,
        edgesep,
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
  return balance(xss, graphAlign);
};

export const position = (
  g: IGraph,
  options?: Partial<{
    align: DagreAlign;
    nodesep: number;
    edgesep: number;
    ranksep: number;
  }>
) => {
  const ng = asNonCompoundGraph(g);

  positionY(ng, options);
  const xs = positionX(ng, options);
  Object.keys(xs)?.forEach((key: ID) => {
    ng.getNode(key).data.x = xs[key];
  });
};
