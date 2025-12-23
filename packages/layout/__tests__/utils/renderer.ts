import { Layout } from '@/src/core/types';
import { Point } from '@/src/types';
import { LayoutEdge, LayoutNode } from '@/src/types/data';
import { Canvas, Circle, Line, Polyline, Rect, Text } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import { deepMix } from '@antv/util';
import interact from 'interactjs';

export interface GraphNode {
  id: string | number;
  data?: {
    x: number;
    y: number;
    shape?: 'circle' | 'rect';
    width?: number;
    height?: number;
    [key: string]: any;
  };
  style?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
    radius?: number;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface GraphEdge {
  id: string | number;
  source: string | number;
  target: string | number;
  [key: string]: any;
}

export interface GraphData {
  nodes: GraphNode[];
  edges?: GraphEdge[];
}

export interface RenderOptions {
  nodeRadius?: number;
  nodeShape?: 'circle' | 'rect';
  nodeSize?: { width: number; height: number };
  nodeStyle?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
  };
  edgeShape?: 'line' | 'polyline';
  edgeStyle?: {
    stroke?: string;
    lineWidth?: number;
  };
  labelStyle?: {
    fontSize?: number;
    fill?: string;
    fontWeight?: CSSStyleDeclaration['fontWeight'];
  };
  showLabel?: boolean;
  clearCanvas?: boolean;
  enableDrag?: boolean;
}

export interface DragCallbacks {
  onDragStart?: (
    nodeId: string | number,
    pos: { x: number; y: number },
  ) => void;
  onDrag?: (nodeId: string | number, pos: { x: number; y: number }) => void;
  onDragEnd?: (nodeId: string | number, pos: { x: number; y: number }) => void;
}

export class GraphRenderer {
  private canvas: Canvas;
  private nodeElements: Map<string | number, Circle | Rect> = new Map();
  private edgeElements: Map<string | number, Line | Polyline> = new Map();
  private interactInstances: Map<string | number, any> = new Map();

  private isInitialized = false;
  private currentData: GraphData | null = null;
  private dragCallbacks: DragCallbacks = {};

  private defaultOptions: Required<RenderOptions> = {
    nodeRadius: 15,
    nodeShape: 'circle',
    nodeSize: { width: 60, height: 30 },
    nodeStyle: { fill: '#41C9E2', stroke: '#fff', lineWidth: 1 },
    // nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },

    edgeShape: 'line',
    edgeStyle: { stroke: '#bebebe', lineWidth: 1 },
    labelStyle: { fontSize: 10, fill: '#000', fontWeight: 'bolder' },
    showLabel: false,
    clearCanvas: false,
    enableDrag: true,
  };

  constructor(canvas?: Canvas) {
    this.canvas =
      canvas ||
      new Canvas({
        container: 'container',
        width: 600,
        height: 500,
        renderer: new Renderer(),
      });
  }

  setDragCallbacks(callbacks: DragCallbacks): void {
    this.dragCallbacks = callbacks;
  }

  render(
    layout: Layout<any>,
    options: RenderOptions = {},
    data?: GraphData,
  ): void {
    const opts = deepMix({}, this.defaultOptions, options);
    if (opts.clearCanvas) this.clear();

    if (!this.isInitialized) {
      this.currentData = data || null;
      this.createElements(layout, opts, data);
      this.isInitialized = true;
    } else {
      this.updateElements(layout);
    }
  }

  handleTick(
    layout: Layout<any>,
    options: RenderOptions = {},
    data?: GraphData,
  ): void {
    this.render(layout, options, data);
  }

  private createElements(
    layout: Layout<any>,
    options: Required<RenderOptions>,
    data?: GraphData,
  ): void {
    layout.forEachEdge((edge) => {
      const elem = this.createEdge(edge, options);
      if (elem) {
        this.canvas.appendChild(elem);
        this.edgeElements.set(edge.id, elem);
      }
    });

    layout.forEachNode((node) => {
      const elem = this.createNode(node, options, data);
      this.canvas.appendChild(elem);
      this.nodeElements.set(node.id, elem);

      if (options.enableDrag) this.attachInteractDrag(elem, node.id);
    });
  }

  private createEdge(
    edge: LayoutEdge,
    options: Required<RenderOptions>,
  ): Line | Polyline {
    const usePolyline = options.edgeShape === 'polyline';
    if (usePolyline) {
      return new Polyline({
        style: {
          points: [
            [edge.sourceNode.x, edge.sourceNode.y],
            ...(edge.points || []),
            [edge.targetNode.x, edge.targetNode.y],
          ],
          ...options.edgeStyle,
          pointerEvents: 'none',
        },
      });
    } else {
      return new Line({
        style: {
          x1: edge.sourceNode.x,
          y1: edge.sourceNode.y,
          x2: edge.targetNode.x,
          y2: edge.targetNode.y,
          ...options.edgeStyle,
          pointerEvents: 'none',
        },
      });
    }
  }

  private createNode(
    node: LayoutNode,
    options: Required<RenderOptions>,
    data?: GraphData,
  ): Circle | Rect {
    const nodeData = data?.nodes.find((n) => n.id === node.id);
    const shape = options.nodeShape;

    let elem;

    if (shape === 'rect') {
      const width = options.nodeSize.width;
      const height = options.nodeSize.height;

      elem = new Rect({
        id: `node-${node.id}`,
        style: {
          x: node.x - width / 2,
          y: node.y - height / 2,
          width,
          height,
          ...options.nodeStyle,
          cursor: options.enableDrag ? 'grab' : 'default',
        },
      });
    } else {
      elem = new Circle({
        id: `node-${node.id}`,
        style: {
          cx: node.x,
          cy: node.y,
          r: options.nodeRadius,
          fill: nodeData?.style?.fill || options.nodeStyle.fill,
          stroke: nodeData?.style?.stroke || options.nodeStyle.stroke,
          lineWidth: nodeData?.style?.lineWidth || options.nodeStyle.lineWidth,
          cursor: options.enableDrag ? 'grab' : 'default',
        },
      });
    }

    if (options.showLabel) {
      const label = new Text({
        style: {
          x: 0,
          y: 0,
          text: String(node.id),
          fontSize: options.labelStyle.fontSize,
          fill: options.labelStyle.fill,
          fontWeight: options.labelStyle.fontWeight,
          textAlign: 'center',
          textBaseline: 'middle',
          pointerEvents: 'none',
        },
      });
      elem.appendChild(label);
    }

    return elem;
  }

  private attachInteractDrag(
    elem: Circle | Rect,
    nodeId: string | number,
  ): void {
    let original: any = {};

    const interactable = interact(elem as any, {
      context: this.canvas.document as any,
    }).draggable({
      inertia: false,
      autoScroll: false,

      onstart: () => {
        original = { ...elem.style };
        elem.attr({ cursor: 'grabbing', stroke: '#FFD93D', lineWidth: 3 });

        this.dragCallbacks.onDragStart?.(nodeId, this.getElementCenter(elem));
      },

      onmove: (ev) => {
        const dx = ev.dx;
        const dy = ev.dy;

        this.moveElement(elem, dx, dy);

        const pos = this.getElementCenter(elem);
        this.updateEdgesForNode(nodeId, pos.x, pos.y);

        this.dragCallbacks.onDrag?.(nodeId, pos);
      },

      onend: () => {
        elem.attr(original);
        this.dragCallbacks.onDragEnd?.(nodeId, this.getElementCenter(elem));
      },
    });

    this.interactInstances.set(nodeId, interactable);
  }

  private moveElement(elem: Circle | Rect, dx: number, dy: number) {
    if (elem instanceof Circle) {
      elem.attr({
        cx: (elem.style.cx as number) + dx,
        cy: (elem.style.cy as number) + dy,
      });
    } else {
      elem.attr({
        x: (elem.style.x as number) + dx,
        y: (elem.style.y as number) + dy,
      });
    }
  }

  private getElementCenter(elem: Circle | Rect) {
    if (elem instanceof Circle) {
      return { x: elem.style.cx as number, y: elem.style.cy as number };
    } else {
      return {
        x: (elem.style.x as number) + (elem.style.width as number) / 2,
        y: (elem.style.y as number) + (elem.style.height as number) / 2,
      };
    }
  }

  private updateEdgesForNode(
    nodeId: string | number,
    x: number,
    y: number,
  ): void {
    if (!this.currentData) return;

    this.currentData.edges?.forEach((edge) => {
      const elem = this.edgeElements.get(edge.id);
      if (!elem) return;

      if (elem instanceof Line) {
        if (edge.source === nodeId) elem.attr({ x1: x, y1: y });
        if (edge.target === nodeId) elem.attr({ x2: x, y2: y });
      } else if (elem instanceof Polyline) {
        const points = elem.style.points as Point[];
        const newPoints = [...points];

        if (edge.source === nodeId) {
          newPoints[0] = [x, y];
        }
        if (edge.target === nodeId) {
          newPoints[newPoints.length - 1] = [x, y];
        }

        elem.attr({ points: newPoints });
      }
    });
  }

  private updateElements(layout: Layout<any>): void {
    layout.forEachEdge((edge) => {
      const elem = this.edgeElements.get(edge.id);
      if (!elem) return;

      if (elem instanceof Line) {
        elem.attr({
          x1: edge.sourceNode.x,
          y1: edge.sourceNode.y,
          x2: edge.targetNode.x,
          y2: edge.targetNode.y,
        });
      } else if (elem instanceof Polyline) {
        const points: Point[] = [
          [edge.sourceNode.x, edge.sourceNode.y],
          ...(edge.points || []),
          [edge.targetNode.x, edge.targetNode.y],
        ];
        elem.attr({ points });
      }
    });

    layout.forEachNode((node) => {
      const elem = this.nodeElements.get(node.id);
      if (!elem) return;

      if (elem instanceof Circle) elem.attr({ cx: node.x, cy: node.y });
      else
        elem.attr({
          x: node.x - (elem.style.width as number) / 2,
          y: node.y - (elem.style.height as number) / 2,
        });
    });
  }

  setDraggable(enabled: boolean): void {
    this.interactInstances.forEach((inst, nodeId) => {
      inst.draggable(enabled);
      const elem = this.nodeElements.get(nodeId);
      if (elem) elem.attr({ cursor: enabled ? 'grab' : 'default' });
    });
  }

  getNodePosition(nodeId: string | number) {
    const elem = this.nodeElements.get(nodeId);
    if (!elem) return null;
    return this.getElementCenter(elem);
  }

  updateNodeAttributes(nodeId: string | number, attrs: any): void {
    const elem = this.nodeElements.get(nodeId);
    if (elem && elem instanceof Rect) {
      const prev = elem.attributes;
      elem.attr({
        ...prev,
        ...attrs,
      });
    }
  }

  clear(): void {
    this.interactInstances.forEach((inst) => inst.unset());
    this.interactInstances.clear();

    this.nodeElements.forEach((e) => e.remove());
    this.edgeElements.forEach((e) => e.remove());
    this.nodeElements.clear();
    this.edgeElements.clear();

    this.isInitialized = false;
    this.currentData = null;
  }

  reset(): void {
    this.isInitialized = false;
  }

  destroy(): void {
    this.clear();
    this.canvas.destroy();
  }

  getCanvas() {
    return this.canvas;
  }

  getCanvasSize() {
    return {
      width: this.canvas.getConfig().width!,
      height: this.canvas.getConfig().height!,
    };
  }
}
