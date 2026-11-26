import { FishboneLayout } from '@/src/algorithm/fishbone';
import { IndentedLayout } from '@/src/algorithm/indented';
import { MindmapLayout } from '@/src/algorithm/mindmap';
import type { Layout } from '@/src/algorithm/types';
import type { GraphData } from '@/src/types';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { GraphRenderer } from '../utils';

let canvas: Canvas;

function createRenderer(width: number, height: number) {
  canvas = createCanvas(null, width, height);
  return new GraphRenderer(canvas);
}

function renderLayout(
  renderer: GraphRenderer,
  layout: Layout<any>,
  data: GraphData,
) {
  renderer.render(
    layout,
    {
      nodeShape: 'rect',
      nodeSize: { width: 140, height: 40 },
      nodeStyle: {
        fill: '#F8FAFC',
        stroke: '#CBD5E1',
        lineWidth: 1.2,
        rx: 9,
        ry: 9,
      },
      edgeStyle: { stroke: '#CBD5E1', lineWidth: 1.2 },
      showLabel: true,
      labelStyle: { fontSize: 12, fill: '#334155', fontWeight: 500 },
      enableDrag: false,
    },
    data,
  );
}

function offsetNodes(layout: Layout<any>, dx: number, dy: number) {
  layout.forEachNode((node) => {
    node.x += dx;
    node.y += dy;
  });
}

describe('tree layout snapshots', () => {
  afterEach(() => {
    canvas.destroy();
  });

  it('should render a fishbone diagram', async () => {
    const renderer = createRenderer(1000, 600);
    const layout = new FishboneLayout({
      categoryGap: 190,
      categoryDistance: 200,
      itemHStep: 30,
      getWidth: () => 140,
      getHeight: () => 40,
    });
    const data: GraphData = {
      nodes: [
        { id: 'Delivery Risk', style: { fill: '#FEF3C7', stroke: '#F59E0B' } },
        { id: 'People', style: { fill: '#DBEAFE', stroke: '#60A5FA' } },
        { id: 'Process', style: { fill: '#D1FAE5', stroke: '#34D399' } },
        { id: 'Tools', style: { fill: '#EDE9FE', stroke: '#A78BFA' } },
        { id: 'Skill gaps', style: { fill: '#DBEAFE' } },
        { id: 'Late reviews', style: { fill: '#EFF6FF' } },
        { id: 'Unclear scope', style: { fill: '#D1FAE5' } },
        { id: 'Late changes', style: { fill: '#ECFDF5' } },
        { id: 'Missing tests', style: { fill: '#F3E8FF' } },
        { id: 'Build failures', style: { fill: '#FAF5FF' } },
      ],
      edges: [
        { source: 'Delivery Risk', target: 'People' },
        { source: 'Delivery Risk', target: 'Process' },
        { source: 'Delivery Risk', target: 'Tools' },
        { source: 'People', target: 'Skill gaps' },
        { source: 'People', target: 'Late reviews' },
        { source: 'Process', target: 'Unclear scope' },
        { source: 'Process', target: 'Late changes' },
        { source: 'Tools', target: 'Missing tests' },
        { source: 'Tools', target: 'Build failures' },
      ],
    };
    await layout.execute(data);

    renderLayout(renderer, layout, data);
    await expect(canvas).toMatchSnapshot(__filename, 'fishbone');
  });

  it('should render an indented design-system tree', async () => {
    const renderer = createRenderer(600, 540);
    const data: GraphData = {
      nodes: [
        {
          id: 'Design System',
          data: {},
          style: { fill: '#C7D2FE', stroke: '#818CF8' },
        },
        { id: 'Foundations', data: {}, style: { fill: '#DDD6FE' } },
        { id: 'Colors', data: {} },
        { id: 'Typography', data: {} },
        { id: 'Components', data: {}, style: { fill: '#DDD6FE' } },
        { id: 'Buttons', data: {} },
        { id: 'Forms', data: {} },
        { id: 'Guidelines', data: {}, style: { fill: '#DDD6FE' } },
        { id: 'Accessibility', data: {} },
      ],
      edges: [
        { source: 'Design System', target: 'Foundations' },
        { source: 'Foundations', target: 'Colors' },
        { source: 'Foundations', target: 'Typography' },
        { source: 'Design System', target: 'Components' },
        { source: 'Components', target: 'Buttons' },
        { source: 'Components', target: 'Forms' },
        { source: 'Design System', target: 'Guidelines' },
        { source: 'Guidelines', target: 'Accessibility' },
      ],
    };
    const layout = new IndentedLayout({
      rootId: 'Design System',
      indent: 180,
      rowHeight: 54,
      nodeColors: ['#C7D2FE', '#DDD6FE', '#EDE9FE'],
      edgeColors: ['#4F46E5', '#8B5CF6', '#C4B5FD'],
    });
    await layout.execute(data);
    offsetNodes(layout, 80, 60);

    renderLayout(renderer, layout, data);
    await expect(canvas).toMatchSnapshot(__filename, 'indented');
  });

  it('should render a balanced mindmap', async () => {
    const renderer = createRenderer(1100, 520);
    const layout = new MindmapLayout({
      levelGap: 90,
      nodeGap: 36,
      branchColors: ['#BFDBFE', '#FBCFE8'],
      getWidth: () => 140,
      getHeight: () => 40,
      getSide: (_node, index, parentSide) =>
        parentSide ?? (index % 2 === 0 ? 'left' : 'right'),
    });
    const data: GraphData = {
      nodes: [
        {
          id: 'Product Strategy',
          data: {},
          style: { fill: '#FEF3C7', stroke: '#D97706' },
        },
        { id: 'Research', data: {} },
        { id: 'Design', data: {} },
        { id: 'Delivery', data: {} },
        { id: 'Engineering', data: {} },
        { id: 'Quality', data: {} },
        { id: 'Growth', data: {} },
        { id: 'Interviews', data: {}, style: { fill: '#EFF6FF' } },
        { id: 'Prototypes', data: {}, style: { fill: '#FFF1F2' } },
        { id: 'Milestones', data: {}, style: { fill: '#EFF6FF' } },
        { id: 'Architecture', data: {}, style: { fill: '#FFF1F2' } },
        { id: 'Automation', data: {}, style: { fill: '#EFF6FF' } },
        { id: 'Activation', data: {}, style: { fill: '#FFF1F2' } },
      ],
      edges: [
        { source: 'Product Strategy', target: 'Research' },
        { source: 'Product Strategy', target: 'Design' },
        { source: 'Product Strategy', target: 'Delivery' },
        { source: 'Product Strategy', target: 'Engineering' },
        { source: 'Product Strategy', target: 'Quality' },
        { source: 'Product Strategy', target: 'Growth' },
        { source: 'Research', target: 'Interviews' },
        { source: 'Design', target: 'Prototypes' },
        { source: 'Delivery', target: 'Milestones' },
        { source: 'Engineering', target: 'Architecture' },
        { source: 'Quality', target: 'Automation' },
        { source: 'Growth', target: 'Activation' },
      ],
    };
    await layout.execute(data);
    offsetNodes(layout, 550, 260);

    renderLayout(renderer, layout, data);
    await expect(canvas).toMatchSnapshot(__filename, 'mindmap');
  });
});
