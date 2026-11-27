import type { Layout } from '@antv/layout/lib/algorithm/types.js';
import type { GraphEdge, GraphNode } from '@antv/layout/lib/types/data.js';
import { select } from 'd3-selection';
import { useEffect, useRef, useState } from 'react';
import {
  layoutDemoConfigs,
  type LayoutDemoConfig,
  type LayoutDemoType,
} from './layoutDemoConfigs';
import { ThreeForceDemo } from './ThreeForceDemo';

const WIDTH = 640;
const HEIGHT = 360;
const PADDING = 48;
const PALETTE = [
  '#93C5FD',
  '#86EFAC',
  '#C4B5FD',
  '#F9A8D4',
  '#FCD34D',
  '#67E8F9',
];

function getNodeSize(node: GraphNode, config: LayoutDemoConfig) {
  const fallback =
    config.displaySize ?? (config.shape === 'rect' ? [110, 32] : [16, 16]);
  if (!node.isCombo && config.displaySize) return config.displaySize;
  if (typeof node.size === 'number') return [node.size, node.size] as const;
  if (Array.isArray(node.size)) {
    return [
      node.size[0] ?? fallback[0],
      node.size[1] ?? node.size[0] ?? fallback[1],
    ] as const;
  }
  return fallback;
}

function getPosition(node: GraphNode, config: LayoutDemoConfig) {
  if (!config.project3d) return [node.x, node.y] as const;
  const z = node.z ?? 0;
  return [node.x + z * 0.35, node.y - z * 0.2] as const;
}

function getRadius(node: GraphNode, config: LayoutDemoConfig) {
  const [width, height] = getNodeSize(node, config);
  return Math.max(5, Math.min(10, Math.min(width, height) / 2));
}

function getLabel(node: GraphNode) {
  return String(node._original.label ?? node.id);
}

function getView(nodes: GraphNode[], config: LayoutDemoConfig) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  nodes.forEach((node) => {
    const [x, y] = getPosition(node, config);
    const [width, height] = getNodeSize(node, config);
    minX = Math.min(minX, x - width / 2);
    minY = Math.min(minY, y - height / 2);
    maxX = Math.max(maxX, x + width / 2);
    maxY = Math.max(maxY, y + height / 2);
  });
  const scale = Math.min(
    (WIDTH - PADDING * 2) / Math.max(maxX - minX, 1),
    (HEIGHT - PADDING * 2) / Math.max(maxY - minY, 1),
    1.5,
  );
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  return {
    scale,
    transform: `translate(${WIDTH / 2 - centerX * scale}, ${
      HEIGHT / 2 - centerY * scale
    }) scale(${scale})`,
  };
}

function getEdgePath(edge: GraphEdge, config: LayoutDemoConfig) {
  if (edge.points?.length) {
    return edge.points
      .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`)
      .join(' ');
  }
  if (!edge.sourceNode || !edge.targetNode) return '';
  const [x1, y1] = getPosition(edge.sourceNode, config);
  const [x2, y2] = getPosition(edge.targetNode, config);
  if (config.curve === 'horizontal') {
    const middle = (x1 + x2) / 2;
    return `M${x1},${y1} C${middle},${y1} ${middle},${y2} ${x2},${y2}`;
  }
  if (config.curve === 'soft') {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const offset = Math.min(18, length * 0.08);
    const cx = (x1 + x2) / 2 - (dy / length) * offset;
    const cy = (y1 + y2) / 2 + (dx / length) * offset;
    return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
  }
  return `M${x1},${y1} L${x2},${y2}`;
}

function isCrossComboEdge(edge: GraphEdge) {
  const sourceParent = edge.sourceNode?._original.parentId;
  const targetParent = edge.targetNode?._original.parentId;
  return Boolean(sourceParent && targetParent && sourceParent !== targetParent);
}

function renderNodes(
  root: any,
  nodes: GraphNode[],
  className: string,
  config: LayoutDemoConfig,
  viewScale: number,
) {
  const groups = root
    .selectAll(`g.${className}`)
    .data(nodes, (node: GraphNode) => String(node.id))
    .join(
      (enter: any) => {
        const group = enter.append('g').attr('class', className);
        group.each(function createNode(
          this: SVGGElement,
          node: GraphNode,
          index: number,
        ) {
          const current = select(this);
          const original = node._original;
          const semanticColor =
            original.data?._branchColor || original.data?._nodeColor;
          const fill =
            original.style?.fill ||
            semanticColor ||
            PALETTE[index % PALETTE.length];
          const stroke = original.style?.stroke || semanticColor || '#64748B';

          if (config.shape === 'rect') {
            const [width, height] = getNodeSize(node, config);
            current
              .append('rect')
              .attr('x', -width / 2)
              .attr('y', -height / 2)
              .attr('width', width)
              .attr('height', height)
              .attr('rx', node.isCombo ? 14 : 7)
              .attr('fill', fill)
              .attr('fill-opacity', node.isCombo ? 0.8 : 1)
              .attr('stroke', stroke)
              .attr('stroke-width', node.isCombo ? 1.2 : 1.1)
              .attr('vector-effect', 'non-scaling-stroke');
          } else {
            current
              .append('circle')
              .attr('r', getRadius(node, config) / viewScale)
              .attr('fill', fill)
              .attr('stroke', stroke)
              .attr('stroke-width', 1.2 / viewScale);
          }

          if (config.showLabels) {
            const isCircle = config.shape !== 'rect';
            current
              .append('text')
              .attr('text-anchor', node.isCombo ? 'start' : 'middle')
              .attr('dominant-baseline', 'central')
              .attr(
                'x',
                node.isCombo ? -getNodeSize(node, config)[0] / 2 + 16 : 0,
              )
              .attr(
                'y',
                node.isCombo
                  ? -getNodeSize(node, config)[1] / 2 + 18
                  : isCircle
                  ? (getRadius(node, config) + 12) / viewScale
                  : 0,
              )
              .attr('fill', isCircle ? 'var(--rp-c-text-2)' : '#334155')
              .attr(
                'font-size',
                (node.isCombo ? 12 : isCircle ? 9 : 10) / viewScale,
              )
              .attr('font-weight', node.isCombo ? 600 : 500)
              .attr('pointer-events', 'none')
              .text(getLabel(node));
          }
          current.append('title').text(getLabel(node));
        });
        return group;
      },
      (update: any) => update,
      (exit: any) => exit.remove(),
    );

  groups.attr('transform', (node: GraphNode) => {
    const [x, y] = getPosition(node, config);
    return `translate(${x}, ${y})`;
  });
  groups
    .select('circle')
    .attr('r', (node: GraphNode) => getRadius(node, config) / viewScale)
    .attr('stroke-width', 1.2 / viewScale);
  groups
    .select('text')
    .attr('y', (node: GraphNode) =>
      node.isCombo
        ? -getNodeSize(node, config)[1] / 2 + 18
        : config.shape === 'rect'
        ? 0
        : (getRadius(node, config) + 12) / viewScale,
    )
    .attr(
      'font-size',
      (node: GraphNode) =>
        (node.isCombo ? 12 : config.shape === 'rect' ? 10 : 9) / viewScale,
    );
}

function renderGraph(
  svgElement: SVGSVGElement,
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: LayoutDemoConfig,
  type: LayoutDemoType,
) {
  const svg = select(svgElement).attr('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  const view = getView(nodes, config);
  const root = svg
    .selectAll('g.layout-demo-root')
    .data([null])
    .join('g')
    .attr('class', 'layout-demo-root')
    .attr('transform', view.transform);

  renderNodes(
    root,
    nodes.filter((node) => node.isCombo),
    'layout-demo-combo',
    config,
    view.scale,
  );

  if (config.directed) {
    const marker = svg
      .selectAll('marker')
      .data([null])
      .join('marker')
      .attr('id', `layout-demo-arrow-${type}`)
      .attr('viewBox', '0 0 10 10')
      .attr('refX', 9)
      .attr('refY', 5)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse');
    marker
      .selectAll('path')
      .data([null])
      .join('path')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z')
      .attr('fill', '#94A3B8');
  }

  root
    .selectAll('path.layout-demo-edge')
    .data<GraphEdge>(edges, (edge) => String((edge as GraphEdge).id))
    .join('path')
    .attr('class', 'layout-demo-edge')
    .attr('d', (edge: GraphEdge) => getEdgePath(edge, config))
    .attr('fill', 'none')
    .attr('stroke', (edge: GraphEdge) =>
      isCrossComboEdge(edge) ? '#A78BFA' : '#CBD5E1',
    )
    .attr('stroke-width', (edge: GraphEdge) =>
      isCrossComboEdge(edge) ? 1.3 : 1,
    )
    .attr('stroke-opacity', (edge: GraphEdge) =>
      isCrossComboEdge(edge) ? 0.8 : 0.65,
    )
    .attr('stroke-dasharray', (edge: GraphEdge) =>
      isCrossComboEdge(edge) ? '5 4' : null,
    )
    .attr('stroke-linecap', 'round')
    .attr('stroke-linejoin', 'round')
    .attr('vector-effect', 'non-scaling-stroke')
    .attr(
      'marker-end',
      config.directed ? `url(#layout-demo-arrow-${type})` : null,
    );

  renderNodes(
    root,
    nodes.filter((node) => !node.isCombo),
    'layout-demo-node',
    config,
    view.scale,
  );
}

function SvgLayoutDemo({ type }: { type: LayoutDemoType }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [runId, setRunId] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [error, setError] = useState('');
  const config: LayoutDemoConfig = layoutDemoConfigs[type];

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    if (svgRef.current) select(svgRef.current).selectAll('*').remove();

    const draw = (currentLayout: Layout<any>) => {
      if (cancelled || !svgRef.current) return;
      const nodes: GraphNode[] = [];
      const edges: GraphEdge[] = [];
      currentLayout.forEachNode((node) => nodes.push(node));
      currentLayout.forEachEdge((edge) => edges.push(edge));
      renderGraph(svgRef.current, nodes, edges, config, type);
    };
    const layout = config.createLayout(draw);

    layout
      .execute(structuredClone(config.data))
      .then(() => {
        if (cancelled) return;
        draw(layout);
        setStatus('ready');
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setError(
          reason instanceof Error ? reason.message : 'Unable to run layout.',
        );
      });

    return () => {
      cancelled = true;
      layout.destroy();
    };
  }, [config, runId, type]);

  return (
    <div className="layoutDemo" data-status={status}>
      <div className="layoutDemoToolbar">
        <div className="layoutDemoMeta">
          <strong>{config.title}</strong>
          <span>
            {status === 'loading'
              ? config.animated
                ? 'Converging…'
                : 'Computing…'
              : config.animated
              ? 'Live simulation'
              : 'Live layout'}
          </span>
        </div>
        <button
          type="button"
          disabled={status === 'loading'}
          onClick={() => setRunId((value) => value + 1)}
        >
          Run again
        </button>
      </div>
      <div className="layoutDemoCanvas">
        <svg
          ref={svgRef}
          role="img"
          aria-label={`${config.title} layout demo`}
        />
        {status === 'error' && <div className="layoutDemoError">{error}</div>}
      </div>
    </div>
  );
}

export function LayoutDemo({ type }: { type: LayoutDemoType }) {
  if (type === 'd3-force-3d') {
    return <ThreeForceDemo config={layoutDemoConfigs[type]} />;
  }
  return <SvgLayoutDemo type={type} />;
}
