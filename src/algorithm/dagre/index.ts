import { isBoolean, isNil, pick } from '@antv/util';
import dagre, { graphlib } from 'dagre';
import type { LayoutNode } from '../../types';
import { parsePoint, parseSize } from '../../util';
import { formatFn, formatNumberFn, formatSizeFn } from '../../util/format';
import { BaseLayout } from '../base-layout';
import type { DagreLayoutOptions } from './types';

export type { DagreLayoutOptions };

/**
 * <zh/> Dagre 布局
 *
 * <en/> Dagre layout
 */
export class DagreLayout extends BaseLayout<DagreLayoutOptions> {
  id = 'dagre';

  private isCompoundGraph: boolean | null = null;

  protected config = {
    graphAttributes: [
      'rankdir',
      'align',
      'nodesep',
      'edgesep',
      'ranksep',
      'marginx',
      'marginy',
      'acyclicer',
      'ranker',
    ],
    nodeAttributes: ['width', 'height'],
    edgeAttributes: [
      'minlen',
      'weight',
      'width',
      'height',
      'labelpos',
      'labeloffset',
    ],
  };

  protected getDefaultOptions(): Partial<DagreLayoutOptions> {
    return {
      directed: true,
      multigraph: true,
      rankdir: 'TB',
      align: undefined,
      nodesep: 50,
      edgesep: 10,
      ranksep: 50,
      marginx: 0,
      marginy: 0,
      acyclicer: undefined,
      ranker: 'network-simplex',
      nodeSize: [0, 0],
      edgeMinLen: 1,
      edgeWeight: 1,
      edgeLabelSize: [0, 0],
      edgeLabelPos: 'r',
      edgeLabelOffset: 10,
    };
  }

  protected async layout(): Promise<void> {
    const g = new graphlib.Graph({
      directed: !!this.options.directed,
      multigraph: !!this.options.multigraph,
      compound: this.isCompound(),
    });

    g.setGraph(pick(this.options, this.config.graphAttributes));

    g.setDefaultEdgeLabel(() => ({}));

    const nodeSizeFn = formatSizeFn(this.options.nodeSize, 0);

    this.model.forEachNode((node: LayoutNode) => {
      const raw = node._original;
      const [width, height] = parseSize(nodeSizeFn(raw));

      const label = { width, height };
      g.setNode(String(node.id), label);

      if (this.isCompound()) {
        if (isNil(node.parentId)) return;

        g.setParent(String(node.id), String(node.parentId));
      }
    });

    const {
      edgeLabelSize,
      edgeLabelOffset,
      edgeLabelPos,
      edgeMinLen,
      edgeWeight,
    } = this.options;

    const edgeLabelSizeFn = formatSizeFn(edgeLabelSize, 0, 'edge');
    const edgeLabelOffsetFn = formatNumberFn(edgeLabelOffset, 10, 'edge');
    const edgeLabelPosFn =
      typeof edgeLabelPos === 'string'
        ? () => edgeLabelPos
        : formatFn(edgeLabelPos, ['edge']);
    const edgeMinLenFn = formatNumberFn(edgeMinLen, 1, 'edge');
    const edgeWeightFn = formatNumberFn(edgeWeight, 1, 'edge');

    this.model.forEachEdge((edge) => {
      const raw = edge._original;
      const [lw, lh] = parseSize(edgeLabelSizeFn(raw));

      const label = {
        width: lw,
        height: lh,
        labelpos: edgeLabelPosFn(raw),
        labeloffset: edgeLabelOffsetFn(raw),
        minlen: edgeMinLenFn(raw),
        weight: edgeWeightFn(raw),
      };

      g.setEdge(
        String(edge.source),
        String(edge.target),
        label,
        String(edge.id),
      );
    });

    dagre.layout(g);

    this.model.forEachNode((node) => {
      const data = g.node(String(node.id));
      if (!data) return;

      node.x = data.x;
      node.y = data.y;
      node.size = [data.width, data.height];
    });

    this.model.forEachEdge((edge) => {
      const data = g.edge(
        String(edge.source),
        String(edge.target),
        String(edge.id),
      );

      if (!data) return;

      const { width, height, weight, minlen, labelpos, labeloffset, points } =
        data;
      edge.labelSize = [width, height];
      edge.weight = weight;
      edge.minLen = minlen;
      edge.labelPos = labelpos;
      edge.labelOffset = labeloffset;
      edge.points = points.map(parsePoint);
    });
  }

  private isCompound(): boolean {
    if (this.isCompoundGraph !== null) return this.isCompoundGraph;

    if (isBoolean(this.options.compound)) {
      return (this.isCompoundGraph = this.options.compound);
    }

    this.isCompoundGraph = this.model
      .nodes()
      .some((node) => !isNil(node.parentId));
    return this.isCompoundGraph;
  }
}
