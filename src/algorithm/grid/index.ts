import type { GraphLib } from '../../model/data';
import { LayoutNode, NodeData, Point, Sorter } from '../../types';
import { applySingleNodeLayout, normalizeViewport } from '../../util';
import { formatFn, formatNodeSizeFn } from '../../util/format';
import { orderByDegree, orderById, orderBySorter } from '../../util/order';
import { BaseLayout } from '../base-layout';
import type {
  GridLayoutOptions,
  IdMapRowAndCol,
  ParsedGridLayoutOptions,
  RowAndCol,
  RowsAndCols,
  VisitMap,
} from './types';

export type { GridLayoutOptions };

const DEFAULT_LAYOUT_OPTIONS: Partial<GridLayoutOptions> = {
  begin: [0, 0],
  preventOverlap: true,
  condense: false,
  rows: undefined,
  cols: undefined,
  position: undefined,
  sortBy: 'degree',
  nodeSize: 30,
  nodeSpacing: 10,
  width: 300,
  height: 300,
};

/**
 * <zh/> 网格布局
 *
 * <en/> Grid layout
 */
export class GridLayout extends BaseLayout<GridLayoutOptions> {
  id = 'grid';

  protected getDefaultOptions(): Partial<GridLayoutOptions> {
    return DEFAULT_LAYOUT_OPTIONS;
  }

  private parseOptions(
    options: Partial<GridLayoutOptions> = {},
    model: GraphLib,
  ): ParsedGridLayoutOptions {
    const {
      rows: propRows,
      cols: propCols,
      position: propPosition,
      sortBy: propSortBy,
    } = options;

    const { width, height, center } = normalizeViewport(options);
    let rows = options.rows;
    let cols = options.cols;
    const cells = model.nodeCount();
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

    const rcs = { rows, cols };

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

    const sortBy = !propSortBy
      ? (DEFAULT_LAYOUT_OPTIONS.sortBy as 'degree')
      : propSortBy === 'degree' || propSortBy === 'id'
      ? propSortBy
      : (formatFn(propSortBy, ['nodeA', 'nodeB']) as Sorter<NodeData>);

    return {
      ...(options as Required<GridLayoutOptions>),
      sortBy,
      rcs,
      center,
      width,
      height,
      position: formatFn(propPosition, ['node']),
    };
  }

  protected async layout(): Promise<void> {
    const {
      begin,
      rcs,
      sortBy,
      width,
      height,
      condense,
      preventOverlap,
      nodeSpacing,
      nodeSize,
      position,
    } = this.parseOptions(this.options, this.model);

    const n = this.model.nodeCount();

    if (!n || n === 1) {
      applySingleNodeLayout(this.model, begin);
      return;
    }

    if (sortBy === 'degree') {
      orderByDegree(this.model);
    } else if (sortBy === 'id') {
      orderById(this.model);
    } else {
      orderBySorter(this.model, sortBy);
    }

    let cellWidth = condense ? 0 : width / rcs.cols;
    let cellHeight = condense ? 0 : height / rcs.rows;

    if (preventOverlap) {
      const sizeFn = formatNodeSizeFn(
        nodeSize,
        nodeSpacing,
        DEFAULT_LAYOUT_OPTIONS.nodeSize as number,
        DEFAULT_LAYOUT_OPTIONS.nodeSpacing as number,
      );
      this.model.forEachNode((node) => {
        const [w, h] = sizeFn(node._original);
        cellWidth = Math.max(cellWidth, w);
        cellHeight = Math.max(cellHeight, h);
      });
    }

    const cellUsed: VisitMap = {}; // e.g. 'c-0-2' => true

    // to keep track of current cell position
    const rc = { row: 0, col: 0 };

    // get a cache of all the manual positions
    const id2manPos: IdMapRowAndCol = {};

    this.model.forEachNode((node) => {
      const nodeData = node._original;

      let rcPos;
      if (position) {
        rcPos = position(nodeData);
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
    });
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
  node: LayoutNode,
  begin: Point,
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

  node.x = x;
  node.y = y;
};
