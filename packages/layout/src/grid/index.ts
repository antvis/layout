import { isString } from '@antv/util';
import type {
  Graph,
  Layout,
  LayoutMapping,
  Node,
  OutNode,
  PointTuple,
} from '../types';
import type { GraphData } from '../types/data';
import {
  applySingleNodeLayout,
  normalizeViewport,
  parseSize,
  toGraph,
} from '../util';
import { formatNumberFn, formatSizeFn } from '../util/format';
import { orderByDegree, orderById, orderByValue } from '../util/order';
import type {
  GridLayoutOptions,
  IdMapRowAndCol,
  RowAndCol,
  RowsAndCols,
  VisitMap,
} from './types';

const DEFAULTS_LAYOUT_OPTIONS: Partial<GridLayoutOptions> = {
  begin: [0, 0],
  preventOverlap: true,
  preventOverlapPadding: 10,
  condense: false,
  rows: undefined,
  cols: undefined,
  position: undefined,
  sortBy: 'degree',
  nodeSize: 30,
  width: 300,
  height: 300,
};

export type { GridLayoutOptions };

/**
 * <zh/> 网格布局
 *
 * <en/> Grid layout
 */
export class GridLayout implements Layout<GridLayoutOptions> {
  id = 'grid';

  constructor(public options: GridLayoutOptions = {} as GridLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: GraphData | Graph, options?: GridLayoutOptions) {
    return this.genericGridLayout(false, toGraph(graph), options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: GraphData | Graph, options?: GridLayoutOptions) {
    await this.genericGridLayout(true, toGraph(graph), options);
  }

  private getOptions(options: Partial<GridLayoutOptions> = {}, nodes: Node[]) {
    const mergedOptions = { ...this.options, ...options };
    const { rows: propRows, cols: propCols } = mergedOptions;
    let sortBy = mergedOptions.sortBy;
    if (
      // `id` should be reserved keyword
      sortBy !== 'id' &&
      (!isString(sortBy) || (nodes[0] as any).data[sortBy] === undefined)
    ) {
      sortBy = 'degree';
    }

    const { width, height } = normalizeViewport(mergedOptions);
    let rows = mergedOptions.rows;
    let cols = mergedOptions.cols;
    const cells = nodes.length;

    // if rows or columns were set in self, use those values
    if (propRows != null && propCols != null) {
      rows = propRows;
      cols = propCols;
    } else if (propRows != null && propCols == null) {
      rows = propRows;
      cols = Math.ceil(cells / rows);
    } else if (propRows == null && propCols != null) {
      cols = propCols;
      rows = Math.ceil(cells / cols);
    } else {
      // otherwise use the automatic values and adjust accordingly	      // otherwise use the automatic values and adjust accordingly
      // width/height * splits^2 = cells where splits is number of times to split width
      const splits = Math.sqrt((cells * height) / width);
      rows = Math.round(splits);
      cols = Math.round((width / height) * splits);
    }
    rows = Math.max(rows, 1);
    cols = Math.max(cols, 1);

    return {
      ...mergedOptions,
      rcs: { rows, cols },
      width,
      height,
      sortBy,
    };
  }

  private async genericGridLayout(
    assign: false,
    graph: Graph,
    options?: GridLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericGridLayout(
    assign: true,
    graph: Graph,
    options?: GridLayoutOptions,
  ): Promise<void>;
  private async genericGridLayout(
    assign: boolean,
    graph: Graph,
    options?: GridLayoutOptions,
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const {
      begin = [0, 0],
      condense,
      preventOverlapPadding,
      preventOverlap,
      nodeSpacing: paramNodeSpacing,
      nodeSize: paramNodeSize,
      position,
    } = mergedOptions;

    const nodes: Node[] = graph.getAllNodes();

    if (!nodes.length || nodes.length === 1) {
      return applySingleNodeLayout(assign, graph, begin);
    }

    const cells = nodes.length;
    const { rcs, sortBy, width, height } = this.getOptions(
      mergedOptions,
      nodes,
    );

    let layoutNodes: OutNode[] = [];
    if (sortBy === 'degree') {
      layoutNodes = orderByDegree(nodes, graph) as OutNode[];
    } else if (sortBy === 'id') {
      layoutNodes = orderById(nodes) as OutNode[];
    } else {
      layoutNodes = orderByValue(nodes, sortBy) as OutNode[];
    }

    if (rcs.cols * rcs.rows > cells) {
      // otherwise use the automatic values and adjust accordingly
      // if rounding was up, see if we can reduce rows or columns
      const sm = small(rcs) as number;
      const lg = large(rcs) as number;

      // reducing the small side takes away the most cells, so try it first
      if ((sm - 1) * lg >= cells) {
        small(rcs, sm - 1);
      } else if ((lg - 1) * sm >= cells) {
        large(rcs, lg - 1);
      }
    } else {
      // if rounding was too low, add rows or columns
      while (rcs.cols * rcs.rows < cells) {
        const sm = small(rcs) as number;
        const lg = large(rcs) as number;

        // try to add to larger side first (adds less in multiplication)
        if ((lg + 1) * sm >= cells) {
          large(rcs, lg + 1);
        } else {
          small(rcs, sm + 1);
        }
      }
    }

    let cellWidth = condense ? 0 : width / rcs.cols;
    let cellHeight = condense ? 0 : height / rcs.rows;

    if (preventOverlap || paramNodeSpacing) {
      const nodeSpacing: Function = formatNumberFn(paramNodeSpacing, 10);
      const nodeSize: Function = formatSizeFn(paramNodeSize, 30, false);
      layoutNodes.forEach((node) => {
        if (!node.data.x || !node.data.y) {
          // for bb
          node.data.x = 0;
          node.data.y = 0;
        }

        const oNode = graph.getNode(node.id);
        const [nodeW, nodeH] = parseSize(nodeSize(oNode) || 30);

        const p =
          nodeSpacing !== undefined ? nodeSpacing(node) : preventOverlapPadding;

        const w = nodeW + p;
        const h = nodeH + p;

        cellWidth = Math.max(cellWidth, w);
        cellHeight = Math.max(cellHeight, h);
      });
    }

    const cellUsed: VisitMap = {}; // e.g. 'c-0-2' => true

    // to keep track of current cell position
    const rc = { row: 0, col: 0 };

    // get a cache of all the manual positions
    const id2manPos: IdMapRowAndCol = {};
    for (let i = 0; i < layoutNodes.length; i++) {
      const node = layoutNodes[i];
      let rcPos;
      if (position) {
        // TODO: not sure the api name
        rcPos = position(graph.getNode(node.id));
      }

      if (rcPos && (rcPos.row !== undefined || rcPos.col !== undefined)) {
        // must have at least row or col def'd
        const pos = {
          row: rcPos.row,
          col: rcPos.col,
        } as RowAndCol;

        if (pos.col === undefined) {
          // find unused col
          pos.col = 0;

          while (used(cellUsed, pos)) {
            pos.col++;
          }
        } else if (pos.row === undefined) {
          // find unused row
          pos.row = 0;

          while (used(cellUsed, pos)) {
            pos.row++;
          }
        }

        id2manPos[node.id] = pos as RowAndCol;
        use(cellUsed, pos);
      }
      getPos(node, begin, cellWidth, cellHeight, id2manPos, rcs, rc, cellUsed);
    }
    const result = {
      nodes: layoutNodes,
      edges: graph.getAllEdges(),
    };

    if (assign) {
      layoutNodes.forEach((node) => {
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        });
      });
    }
    return result;
  }
}

const small = (
  rcs: { rows: number; cols: number },
  val?: number,
): number | undefined => {
  let res: number | undefined;
  const rows = rcs.rows || 5;
  const cols = rcs.cols || 5;
  if (val == null) {
    res = Math.min(rows, cols);
  } else {
    const min = Math.min(rows, cols);
    if (min === rcs.rows) {
      rcs.rows = val;
    } else {
      rcs.cols = val;
    }
  }
  return res;
};

const large = (rcs: RowsAndCols, val?: number): number | undefined => {
  let result: number | undefined;
  const usedRows = rcs.rows || 5;
  const usedCols = rcs.cols || 5;
  if (val == null) {
    result = Math.max(usedRows, usedCols);
  } else {
    const max = Math.max(usedRows, usedCols);
    if (max === rcs.rows) {
      rcs.rows = val;
    } else {
      rcs.cols = val;
    }
  }
  return result;
};

const used = (cellUsed: VisitMap, rc: RowAndCol) =>
  cellUsed[`c-${rc.row}-${rc.col}`] || false;

const use = (cellUsed: VisitMap, rc: RowAndCol) =>
  (cellUsed[`c-${rc.row}-${rc.col}`] = true);

const moveToNextCell = (rcs: RowsAndCols, rc: RowAndCol) => {
  const cols = rcs.cols || 5;
  rc.col++;
  if (rc.col >= cols) {
    rc.col = 0;
    rc.row++;
  }
};

const getPos = (
  node: OutNode,
  begin: PointTuple,
  cellWidth: number,
  cellHeight: number,
  id2manPos: IdMapRowAndCol,
  rcs: RowsAndCols,
  rc: RowAndCol,
  cellUsed: VisitMap,
) => {
  let x: number;
  let y: number;

  // see if we have a manual position set
  const rcPos = id2manPos[node.id];
  if (rcPos) {
    x = rcPos.col * cellWidth + cellWidth / 2 + begin[0];
    y = rcPos.row * cellHeight + cellHeight / 2 + begin[1];
  } else {
    // otherwise set automatically

    while (used(cellUsed, rc)) {
      moveToNextCell(rcs, rc);
    }

    x = rc.col * cellWidth + cellWidth / 2 + begin[0];
    y = rc.row * cellHeight + cellHeight / 2 + begin[1];
    use(cellUsed, rc);

    moveToNextCell(rcs, rc);
  }
  node.data.x = x;
  node.data.y = y;
};
