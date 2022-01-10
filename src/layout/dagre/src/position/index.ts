import { graphlib as IGraphLib } from '../../graphlib';
import util from '../util';
import { alignCoordinates, balance, findSmallestWidthAlignment, findType1Conflicts, findType2Conflicts, horizontalCompaction, verticalAlignment } from './bk';

type Graph = IGraphLib.Graph;

const positionY = (g: Graph) => {
  const layering = util.buildLayerMatrix(g);
  const rankSep = g.graph().ranksep as number;
  let prevY = 0;
  layering?.forEach((layer: any) => {
    const heights = layer.map((v: string) => g.node(v).height);
    const maxHeight = Math.max(...heights);
    layer?.forEach((v: string) => {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
};

const positionX = (g: Graph) => {
  const layering = util.buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering));

  const xss: any = {};
  let adjustedLayering: any;
  ["u", "d"].forEach((vert) => {
    // @ts-ignore
    adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        // @ts-ignore
        adjustedLayering = adjustedLayering.map((inner: any) => Object.values(inner).reverse());
      }

      const neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      const xs = horizontalCompaction(g, adjustedLayering,
        align.root, align.align, horiz === "r");
      if (horiz === "r") {
        Object.keys(xs).forEach((xsKey) =>  xs[xsKey] = -xs[xsKey]);
      }
      xss[vert + horiz] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  smallestWidth && alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align as string);
};

const position = (g: Graph) => {
  // tslint:disable-next-line
  g = util.asNonCompoundGraph(g);

  positionY(g);
  const xs = positionX(g);
  Object.keys(xs)?.forEach((key: string) => {
    g.node(key).x = xs[key];
  });
};

export default position;