import { Canvas, Circle, Line, Text } from '@antv/g';
import { Renderer } from '@antv/g-canvas';
import { deepMix } from '@antv/util';
import interact from 'interactjs';
import { Layout } from '../../src/base-layout/types';
import { LayoutEdge, LayoutNode } from '../../src/types/data';

export interface GraphNode {
  id: string | number;
  data: {
    x: number;
    y: number;
    [key: string]: any;
  };
  style?: {
    fill?: string;
    stroke?: string;
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
  nodeStyle?: {
    fill?: string;
    stroke?: string;
    lineWidth?: number;
  };
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

// 拖拽回调接口
export interface DragCallbacks {
  onDragStart?: (
    nodeId: string | number,
    position: { x: number; y: number },
  ) => void;
  onDrag?: (
    nodeId: string | number,
    position: { x: number; y: number },
  ) => void;
  onDragEnd?: (
    nodeId: string | number,
    position: { x: number; y: number },
  ) => void;
}

export class GraphRenderer {
  private canvas: Canvas;
  private nodeElements: Map<string | number, Circle> = new Map();
  private edgeElements: Map<string | number, Line> = new Map();
  private isInitialized = false;
  private dragCallbacks: DragCallbacks = {};
  private currentData: GraphData | null = null;
  private interactInstances: Map<string | number, any> = new Map();

  private defaultOptions: Required<RenderOptions> = {
    nodeRadius: 15,
    nodeStyle: {
      fill: '#41C9E2',
      stroke: '#fff',
      lineWidth: 1,
    },
    edgeStyle: {
      stroke: '#bebebe',
      lineWidth: 1,
    },
    labelStyle: {
      fontSize: 10,
      fill: '#000',
      fontWeight: 'bolder',
    },
    showLabel: false,
    clearCanvas: false,
    enableDrag: true,
  };

  constructor(canvas?: Canvas) {
    this.canvas =
      canvas ||
      new Canvas({
        container: 'container',
        width: 500,
        height: 500,
        renderer: new Renderer(),
      });
  }

  /**
   * 设置拖拽回调
   */
  setDragCallbacks(callbacks: DragCallbacks): void {
    this.dragCallbacks = callbacks;
  }

  /**
   * 渲染图数据（适用于非迭代布局）
   * @param data 图数据
   * @param options 渲染选项
   */
  render(
    layout: Layout<any>,
    options: RenderOptions = {},
    data?: GraphData,
  ): void {
    const opts = deepMix({}, this.defaultOptions, options);
    // this.currentData = data;

    if (opts.clearCanvas) {
      this.clear();
    }

    if (!this.isInitialized) {
      this.createElements(layout, opts, data);
      this.isInitialized = true;
    } else {
      this.updateElements(layout);
    }
  }

  /**
   * 处理布局迭代更新（适用于迭代布局）
   * @param data 图数据
   * @param options 渲染选项
   */
  handleTick(
    layout: Layout<any>,
    options: RenderOptions = {},
    data?: GraphData,
  ): void {
    this.render(layout, options, data);
  }

  /**
   * 创建节点和边的图形元素
   */
  private createElements(
    layout: Layout<any>,
    options: Required<RenderOptions>,
    data?: GraphData,
  ): void {
    // 先创建边（在底层）
    layout.forEachEdge((edge) => {
      const line = this.createEdge(edge, options);
      if (line) {
        this.canvas.appendChild(line);
        this.edgeElements.set(this.getEdgeId(edge), line);
      }
    });

    // 再创建节点（在上层）
    layout.forEachNode((node) => {
      const circle = this.createNode(node, options, data);
      this.canvas.appendChild(circle);
      this.nodeElements.set(node.id, circle);

      // 绑定 interact.js 拖拽
      if (options.enableDrag) {
        this.attachInteractDrag(circle, node.id);
      }
    });
  }

  /**
   * 创建边元素
   */
  private createEdge(
    edge: LayoutEdge,
    options: Required<RenderOptions>,
  ): Line | null {
    return new Line({
      style: {
        x1: edge.sourceNode.x,
        y1: edge.sourceNode.y,
        x2: edge.targetNode.x,
        y2: edge.targetNode.y,
        ...options.edgeStyle,
        pointerEvents: 'none', // 边不响应鼠标事件
      },
    });
  }

  /**
   * 创建节点元素
   */
  private createNode(
    node: LayoutNode,
    options: Required<RenderOptions>,
    data?: GraphData,
  ): Circle {
    const nodeData = data?.nodes.find((n) => n.id === node.id);
    Object.assign(node, {
      style: nodeData?.style,
    });
    const circle = new Circle({
      id: `node-${node.id}`,
      style: {
        cx: node.x,
        cy: node.y,
        r: options.nodeRadius,
        fill: node.style?.fill || options.nodeStyle.fill,
        stroke: node.style?.stroke || options.nodeStyle.stroke,
        lineWidth: options.nodeStyle.lineWidth,
        cursor: options.enableDrag ? 'grab' : 'default',
      },
    });

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
          pointerEvents: 'none', // 标签不响应鼠标事件
        },
      });
      circle.appendChild(label);
    }

    return circle;
  }

  private getEdgeId(edge: any): string {
    return `edge-${edge.source}-to-${edge.target}`;
  }

  /**
   * 使用 interact.js 绑定拖拽事件
   */
  private attachInteractDrag(circle: Circle, nodeId: string | number): void {
    let originalFill: string;
    let originalStroke: string;
    let originalLineWidth: number;

    const interactable = interact(circle, {
      context: this.canvas.document,
    }).draggable({
      inertia: false, // 关闭惯性，确保精确控制
      autoScroll: false,

      onstart: (event) => {
        // 保存原始样式
        originalFill = circle.style.fill as string;
        originalStroke = circle.style.stroke as string;
        originalLineWidth = circle.style.lineWidth as number;

        // 视觉反馈
        circle.attr({
          fill: '#FF6B6B',
          stroke: '#FFD93D',
          lineWidth: 3,
          cursor: 'grabbing',
        });

        const position = {
          x: circle.style.cx as number,
          y: circle.style.cy as number,
        };

        // 触发回调
        this.dragCallbacks.onDragStart?.(nodeId, position);
      },

      onmove: (event) => {
        const { dx, dy } = event;

        // 获取当前位置
        const currentCx = circle.style.cx as number;
        const currentCy = circle.style.cy as number;

        // 计算新位置
        const newCx = currentCx + dx;
        const newCy = currentCy + dy;

        // 更新圆形位置
        circle.attr({
          cx: newCx,
          cy: newCy,
        });

        // 更新数据
        if (this.currentData) {
          const node = this.currentData.nodes.find((n) => n.id === nodeId);
          if (node) {
            node.data.x = newCx;
            node.data.y = newCy;
          }
        }

        // 更新相关边
        this.updateEdgesForNode(nodeId, newCx, newCy);

        // 触发回调
        this.dragCallbacks.onDrag?.(nodeId, { x: newCx, y: newCy });
      },

      onend: (event) => {
        // 恢复原始样式
        circle.attr({
          fill: originalFill,
          stroke: originalStroke,
          lineWidth: originalLineWidth,
          cursor: 'grab',
        });

        const position = {
          x: circle.style.cx as number,
          y: circle.style.cy as number,
        };

        // 触发回调
        this.dragCallbacks.onDragEnd?.(nodeId, position);
      },
    });

    // 保存 interact 实例以便后续操作
    this.interactInstances.set(nodeId, interactable);
  }

  /**
   * 更新与某个节点相关的所有边
   */
  private updateEdgesForNode(
    nodeId: string | number,
    x: number,
    y: number,
  ): void {
    if (!this.currentData) return;

    this.currentData.edges?.forEach((edge) => {
      const edgeElement = this.edgeElements.get(this.getEdgeId(edge));
      if (!edgeElement) return;

      if (edge.source === nodeId) {
        edgeElement.attr({ x1: x, y1: y });
      }
      if (edge.target === nodeId) {
        edgeElement.attr({ x2: x, y2: y });
      }
    });
  }

  /**
   * 更新节点和边的位置
   */
  private updateElements(layout: Layout<any>): void {
    // 更新边
    layout.forEachEdge((edge) => {
      const element = this.edgeElements.get(this.getEdgeId(edge));
      const { sourceNode, targetNode } = edge;

      if (element && sourceNode && targetNode) {
        element.attr({
          x1: sourceNode.x,
          y1: sourceNode.y,
          x2: targetNode.x,
          y2: targetNode.y,
        });
      }
    });

    // 更新节点
    layout.forEachNode((node) => {
      const element = this.nodeElements.get(node.id);
      if (element) {
        element.attr({
          cx: node.x,
          cy: node.y,
        });
      }
    });
  }

  /**
   * 启用/禁用拖拽
   */
  setDraggable(enabled: boolean): void {
    this.interactInstances.forEach((interactable, nodeId) => {
      if (enabled) {
        interactable.draggable(true);
        const circle = this.nodeElements.get(nodeId);
        if (circle) {
          circle.attr({ cursor: 'grab' });
        }
      } else {
        interactable.draggable(false);
        const circle = this.nodeElements.get(nodeId);
        if (circle) {
          circle.attr({ cursor: 'default' });
        }
      }
    });
  }

  /**
   * 获取节点当前位置
   */
  getNodePosition(nodeId: string | number): { x: number; y: number } | null {
    const element = this.nodeElements.get(nodeId);
    if (element) {
      return {
        x: element.style.cx as number,
        y: element.style.cy as number,
      };
    }
    return null;
  }

  /**
   * 清空画布和缓存
   */
  clear(): void {
    // 销毁所有 interact 实例
    this.interactInstances.forEach((interactable) => {
      interactable.unset();
    });
    this.interactInstances.clear();

    // 移除所有元素
    this.nodeElements.forEach((element) => element.remove());
    this.edgeElements.forEach((element) => element.remove());
    this.nodeElements.clear();
    this.edgeElements.clear();

    this.isInitialized = false;
    this.currentData = null;
  }

  /**
   * 获取节点元素
   */
  getNodeElement(nodeId: string | number): Circle | undefined {
    return this.nodeElements.get(nodeId);
  }

  /**
   * 获取边元素
   */
  getEdgeElement(edgeId: string | number): Line | undefined {
    return this.edgeElements.get(edgeId);
  }

  /**
   * 重置渲染器状态
   */
  reset(): void {
    this.isInitialized = false;
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.clear();
    this.canvas.destroy();
  }

  getCanvas(): Canvas {
    return this.canvas;
  }

  getCanvasSize(): { width: number; height: number } {
    return {
      width: this.canvas.getConfig().width!,
      height: this.canvas.getConfig().height!,
    };
  }
}
