// "use strict";

// const _ = require("../lodash");
// const util = require("../util");
// const positionX = require("./bk").positionX;

import { Graph } from '../../types';
import util from '../util';
import { positionX } from './bk'

const position = (g: Graph) => {
  g = util.asNonCompoundGraph(g);

  positionY(g);
  positionX(g).forEach((x: number, v: string) => {
    g.node(v).x = x;
  });
}

const positionY = (g: Graph) => {
  const layering = util.buildLayerMatrix(g);
  const rankSep = g.graph().ranksep as number;
  let prevY = 0;
  layering.forEach((layer: any) => {
    const heights = layer.map((v: string) => g.node(v).height);
    const maxHeight = Math.max(...heights);
    layer.forEach((v: string) => {
      g.node(v).y = prevY + maxHeight / 2;
    });
    prevY += maxHeight + rankSep;
  });
}

export default position;