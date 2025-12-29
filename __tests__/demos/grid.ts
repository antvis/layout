import { GridLayout } from '@/src';
import type { GUI } from 'lil-gui';
import { GraphRenderer } from '../utils/renderer';

export function render(gui?: GUI) {
  const renderer = new GraphRenderer();
  const { width, height } = renderer.getCanvasSize();

  const defaultOptions = {
    width,
    height,
    beginX: 0,
    beginY: 0,
    preventOverlap: true,
    preventOverlapPadding: 10,
    condense: false,
    rows: undefined,
    cols: undefined,
    sortBy: 'degree',
    nodeSize: 30,
    nodeSpacing: undefined,
  };

  let options = { ...defaultOptions };

  const layout = new GridLayout({
    width: options.width,
    height: options.height,
    begin: [options.beginX, options.beginY],
    preventOverlap: options.preventOverlap,
    preventOverlapPadding: options.preventOverlapPadding,
    condense: options.condense,
    rows: options.rows,
    cols: options.cols,
    sortBy: options.sortBy,
    nodeSize: options.nodeSize,
    nodeSpacing: options.nodeSpacing,
  });

  const relayout = async () => {
    const _options = {
      width: options.width,
      height: options.height,
      begin: [options.beginX, options.beginY],
      preventOverlap: options.preventOverlap,
      preventOverlapPadding: options.preventOverlapPadding,
      condense: options.condense,
      rows: options.rows,
      cols: options.cols,
      sortBy: options.sortBy,
      nodeSize: options.nodeSize,
      nodeSpacing: options.nodeSpacing,
    };
    const nodes = [
      { id: 'a', data: { row: 0, col: 0 } }, // Manually positioned
      { id: 'b', data: {} }, // Auto positioned, should skip (0,0)
      { id: 'c', data: { row: 0, col: 1 } }, // Manually positioned
      { id: 'd', data: {} }, // Auto positioned, should skip (0,0) and (0,1)
      { id: 'e', data: {} }, // Auto positioned
    ];
    const edges: any[] = [];
    const graphWithUsedCells = {
      nodes: nodes as any,
      edges: edges as any,
    };
    await layout.execute(graphWithUsedCells, _options);

    renderer.render(layout, {
      showLabel: true,
      nodeRadius: options.nodeSize / 2,
    });
  };

  relayout();

  if (gui) {
    const folder = gui.addFolder('Grid Layout');

    const guiOptions = {
      ...options,
      rows: options.rows ?? -1,
      cols: options.cols ?? -1,
      nodeSpacing: options.nodeSpacing ?? -1,
    };

    folder.add(options, 'width').min(100).max(2000).step(1).onChange(relayout);
    folder.add(options, 'height').min(100).max(2000).step(1).onChange(relayout);
    folder
      .add(options, 'beginX')
      .min(0)
      .max(1000)
      .step(1)
      .name('beginX')
      .onChange(relayout);
    folder
      .add(options, 'beginY')
      .min(0)
      .max(1000)
      .step(1)
      .name('beginY')
      .onChange(relayout);
    folder.add(options, 'preventOverlap').onChange(relayout);
    folder
      .add(options, 'preventOverlapPadding')
      .min(0)
      .max(100)
      .step(1)
      .onChange(relayout);
    folder.add(options, 'condense').onChange(relayout);

    folder
      .add(guiOptions, 'rows')
      .min(-1)
      .max(100)
      .step(1)
      .name('Rows (-1=auto)')
      .onChange((value: number) => {
        options.rows = value === -1 ? undefined : value;
        relayout();
      });

    folder
      .add(guiOptions, 'cols')
      .min(-1)
      .max(100)
      .step(1)
      .name('Cols (-1=auto)')
      .onChange((value: number) => {
        options.cols = value === -1 ? undefined : value;
        relayout();
      });

    folder.add(options, 'sortBy', ['degree', 'id']).onChange(relayout);
    folder.add(options, 'nodeSize').min(1).max(200).step(1).onChange(relayout);

    folder
      .add(guiOptions, 'nodeSpacing')
      .min(-1)
      .max(100)
      .step(1)
      .name('Node Spacing (-1=auto)')
      .onChange((value: number) => {
        options.nodeSpacing = value === -1 ? undefined : value;
        relayout();
      });

    folder.add({ run: relayout }, 'run').name('Relayout');
    folder.open();
  }

  return renderer.getCanvas();
}
