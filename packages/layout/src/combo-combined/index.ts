import { BaseLayout, isLayoutWithIterations } from '../core/base-layout';
import { Layout } from '../core/types';
import { registry } from '../registry';
import { GraphData, NodeData, STDSize } from '../types';
import { initModelNodePosition, normalizeViewport, parseSize } from '../util';
import { formatNodeSizeFn } from '../util/format';
import type {
  ComboCombinedLayoutOptions,
  ComboCombinedLevelInfo,
} from './types';

export type { ComboCombinedLevelInfo, ComboCombinedLayoutOptions };

/**
 * <zh/> 组合布局
 *
 * <en/> Combo Combined Layout
 */
export class ComboCombinedLayout extends BaseLayout<ComboCombinedLayoutOptions> {
  id = 'combo-combined';

  private relativePositions = new Map<
    string,
    { x: number; y: number; relativeTo: string }
  >();

  private levelsInfo: ComboCombinedLevelInfo[] = [];

  protected getDefaultOptions(): Partial<ComboCombinedLayoutOptions> {
    return {
      layout: ({ depth, combo, level, maxDepth }) => {
        console.log('Layout for combo:', combo, 'at depth:', depth, level);
        if (depth === maxDepth)
          return { type: 'concentric', preventOverlap: true };
        return { type: 'd3-force', preventOverlap: true };
      },
      nodeSize: 20,
      nodeSpacing: 10,
      comboPadding: 20,
      comboSpacing: 50,
    };
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);
    this.relativePositions.clear();

    // 1. 构建分组层级结构
    const hierarchy = this.buildHierarchy();
    this.levelsInfo = this.computeLevelsInfo(hierarchy);

    // 2. 从内到外递归布局
    await this.layoutHierarchy(hierarchy, { width, height, center });

    // 3. 将局部坐标转换为全局坐标
    this.finalizeHierarchyPositions(hierarchy, {
      x: center[0],
      y: center[1],
    });

    // 4. 应用位置到节点
    this.applyPositions(hierarchy);
  }
  /**
   * 递归布局层级结构
   */
  private async layoutHierarchy(
    group: any,
    bounds: { width: number; height: number; center: [number, number] },
  ) {
    const { width, height, center } = bounds;
    initModelNodePosition(this.model, width, height, 2);

    const estimatedSize = this.estimateGroupSize(group);

    // 1. 先递归布局所有子 combo
    for (const child of group.children) {
      if (child.type === 'combo') {
        await this.layoutHierarchy(
          child,
          this.calculateChildBounds(child, group),
        );
      }
    }

    // 2. 准备当前层级的元素
    const elements = group.children || [];

    if (elements.length === 0) {
      group.bounds = { x: 0, y: 0, width: 0, height: 0 };
      group.parentId = group.id === 'root' ? null : group.parentId;
      return;
    }

    // 3. 获取布局配置
    const layoutConfig = this.getLayoutConfig(group);
    const layoutWidth = Math.max(bounds.width, estimatedSize.width);
    const layoutHeight = Math.max(bounds.height, estimatedSize.height);
    const layoutCenter: [number, number] = [layoutWidth / 2, layoutHeight / 2];

    // 4. 执行布局
    const Layout = this.getLayout(layoutConfig.type);

    const layoutInstance = new Layout({
      ...layoutConfig,
      width: layoutWidth,
      height: layoutHeight,
      center: layoutCenter,
    });

    const tempModel = this.createTempModel(elements);

    await executeLayout(layoutInstance, tempModel, {
      nodeSize: (d: NodeData) => d.size,
    });

    // 5. 记录布局结果的相对位置：基于参与布局元素的平均中心位置（group center）
    const layoutedNodes: any[] = [];
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    layoutInstance.forEachNode((layoutedNode: any) => {
      layoutedNodes.push(layoutedNode);
      sumX += layoutedNode.x;
      sumY += layoutedNode.y;
      count += 1;
    });

    if (count === 0) {
      group.bounds = { x: 0, y: 0, width: 0, height: 0 };
      group.parentId = group.id === 'root' ? null : group.parentId;
      return;
    }

    const groupCenter: [number, number] = [sumX / count, sumY / count];
    const childMap = new Map(group.children.map((c: any) => [String(c.id), c]));

    layoutedNodes.forEach((layoutedNode: any) => {
      const child = childMap.get(String(layoutedNode.id));
      if (!child) return;
      this.relativePositions.set(String(child.id), {
        x: layoutedNode.x - groupCenter[0],
        y: layoutedNode.y - groupCenter[1],
        relativeTo: String(group.id),
      });
      child.layouted = true;
    });

    // 6. 计算当前组的边界
    group.bounds = this.calculateLocalBounds(group);
    group.layouted = true;
  }

  /**
   * 构建分组层级结构
   */
  private buildHierarchy() {
    const nodes = this.model.nodes();

    const hierarchy: any = {
      id: 'root',
      type: 'combo',
      depth: 0,
      children: [],
      parentId: null,
    };

    const comboMap = new Map<string, any>();
    comboMap.set('root', hierarchy);

    // 收集所有 combo
    nodes.forEach((node) => {
      const isCombo =
        node.isGroup || node.data?.isCombo || node._original?.isGroup;
      if (isCombo) {
        const combo = {
          id: String(node.id),
          type: 'combo',
          depth: 0,
          children: [],
          data: node._original || node.data,
          parentId: String(node.parentId || 'root'),
          layouted: false,
        };
        comboMap.set(String(node.id), combo);
      }
    });

    // 构建父子关系：nodes + combos 统一为 children
    nodes.forEach((node) => {
      const parentId = String(node.parentId || 'root');
      const parent = comboMap.get(String(parentId));

      const isCombo =
        node.isGroup || node.data?.isCombo || node._original?.isGroup;
      if (isCombo) {
        const combo = comboMap.get(String(node.id));
        if (parent && combo) {
          parent.children.push(combo);
          combo.depth = parent.depth + 1;
          combo.parentId = parent.id;
        }
      } else {
        if (parent) {
          parent.children.push({
            id: String(node.id),
            type: 'node',
            data: node._original || node.data,
            _original: node._original,
            size: node.size,
            parentId: parent.id,
            layouted: false,
          });
        }
      }
    });
    return hierarchy;
  }

  /**
   * 将局部坐标转换为全局坐标
   */
  private finalizeHierarchyPositions(
    group: any,
    parentGlobalPos: { x: number; y: number },
  ) {
    // 计算当前组的全局中心位置（相对位置来自内部缓存）
    const rel =
      group.id === 'root'
        ? null
        : this.relativePositions.get(String(group.id)) || null;
    const groupGlobalX = parentGlobalPos.x + (rel?.x ?? 0);
    const groupGlobalY = parentGlobalPos.y + (rel?.y ?? 0);

    group.x = groupGlobalX;
    group.y = groupGlobalY;

    // 更新直接子元素（nodes + combos）的全局位置，并递归处理子 combo
    (group.children || []).forEach((child: any) => {
      const childRel = this.relativePositions.get(String(child.id)) || null;
      if (childRel && childRel.relativeTo !== group.id) {
        console.warn(
          `${child.type === 'combo' ? 'Combo' : 'Node'} ${
            child.id
          } layout mismatch: expected parent ${group.id}, got ${
            childRel.relativeTo
          }`,
        );
      }

      child.x = groupGlobalX + (childRel?.x ?? 0);
      child.y = groupGlobalY + (childRel?.y ?? 0);
      child.size = this.getElementSize(child, false);

      if (child.type === 'combo') {
        this.finalizeHierarchyPositions(child, {
          x: groupGlobalX,
          y: groupGlobalY,
        });
      }
    });

    // 重新计算全局边界
    if (group.id !== 'root') {
      const allNodes = this.collectAllNodes(group);
      group.bounds =
        allNodes.length > 0
          ? this.calculateBounds(
              allNodes.map((el) => ({
                x: el.x,
                y: el.y,
                size: this.getElementSize(el, false),
              })),
            )
          : { x: groupGlobalX, y: groupGlobalY, width: 0, height: 0 };
    }
  }

  /**
   * 获取布局配置
   */
  private getLayoutConfig(group: any) {
    const { layout } = this.options;

    if (typeof layout === 'function') {
      const level = this.levelsInfo.find((l) => l.depth === group.depth);
      const maxDepth = Math.max(...this.levelsInfo.map((l) => l.depth));
      return this.normalizeLayoutConfig(
        layout({
          depth: group.depth,
          combo: String(group.id),
          level,
          maxDepth,
        }),
      );
    }
    return this.normalizeLayoutConfig(layout);
  }

  private computeLevelsInfo(root: any): ComboCombinedLevelInfo[] {
    const levels = new Map<number, ComboCombinedLevelInfo>();

    const traverse = (group: any) => {
      const depth = Number(group.depth ?? 0);
      const info =
        levels.get(depth) || ({ depth, groups: [] } as ComboCombinedLevelInfo);
      if (!levels.has(depth)) levels.set(depth, info);

      info.groups.push({
        id: String(group.id),
        elements: (group.children || []).map((child: any) => ({
          id: String(child.id),
          type: child.type === 'combo' ? 'combo' : 'node',
        })),
      });

      (group.children || []).forEach((child: any) => {
        if (child.type === 'combo') traverse(child);
      });
    };

    traverse(root);
    return Array.from(levels.values()).sort((a, b) => a.depth - b.depth);
  }

  /**
   * 标准化布局配置
   */
  private normalizeLayoutConfig(config: any) {
    if (typeof config === 'string') {
      return { type: config };
    }
    const { type = 'concentric', options, ...rest } = config || {};
    return {
      ...(options || {}),
      ...rest,
      type,
    };
  }

  /**
   * 获取布局引擎
   */
  private getLayout(type: string) {
    return registry[type] || registry.concentric;
  }

  /**
   * 创建临时模型
   */
  private createTempModel(elements: any[]) {
    const tempNodes = elements.map((el) => ({
      id: String(el.id),
      data:
        el.type === 'combo' ? { ...(el.data || {}), isCombo: true } : el.data,
      x: this.relativePositions.get(String(el.id))?.x ?? Math.random() * 100,
      y: this.relativePositions.get(String(el.id))?.y ?? Math.random() * 100,
      size: this.getLayoutSize(el),
    }));

    const elementIds = new Set(elements.map((e) => String(e.id)));
    const tempEdges = this.model
      .edges()
      .filter(
        (edge) =>
          elementIds.has(String(edge.source)) &&
          elementIds.has(String(edge.target)),
      );

    return {
      nodes: tempNodes,
      edges: tempEdges,
    };
  }

  /**
   * 计算子边界
   */
  private calculateChildBounds(child: any, parentGroup: any) {
    const { comboPadding = 20 } = this.options;
    const parentSize = this.estimateGroupSize(parentGroup);
    const estimatedSize = this.estimateGroupSize(child);
    return {
      width: Math.max(parentSize.width - comboPadding * 2, estimatedSize.width),
      height: Math.max(
        parentSize.height - comboPadding * 2,
        estimatedSize.height,
      ),
      center: [0, 0] as [number, number],
    };
  }

  /**
   * 计算局部边界
   */
  private calculateLocalBounds(group: any) {
    const elements = (group.children || []).map((child: any) => ({
      x: this.relativePositions.get(String(child.id))?.x ?? 0,
      y: this.relativePositions.get(String(child.id))?.y ?? 0,
      size: this.getElementSize(child),
    }));

    return this.calculateBounds(elements);
  }

  /**
   * 计算边界
   */
  private calculateBounds(elements: any[]) {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    elements.forEach((el) => {
      const [w = 0, h = 0] = el.size || [0, 0];
      minX = Math.min(minX, el.x - w / 2);
      minY = Math.min(minY, el.y - h / 2);
      maxX = Math.max(maxX, el.x + w / 2);
      maxY = Math.max(maxY, el.y + h / 2);
    });

    const { comboPadding = 20 } = this.options;
    return {
      x: minX - comboPadding,
      y: minY - comboPadding,
      width: maxX - minX + comboPadding * 2,
      height: maxY - minY + comboPadding * 2,
    };
  }

  /**
   * 收集组内所有元素
   */
  private collectAllNodes(group: any): any[] {
    const nodes: any[] = [];
    (group.children || []).forEach((child: any) => {
      if (child.type === 'node') nodes.push(child);
      if (child.type === 'combo') nodes.push(...this.collectAllNodes(child));
    });
    return nodes;
  }

  /**
   * 估算组尺寸
   */
  private estimateGroupSize(group: any): { width: number; height: number } {
    const { comboPadding = 20 } = this.options;
    if (group?.estimatedSize) return group.estimatedSize;

    let totalArea = 0;
    let maxW = 0;
    let maxH = 0;

    (group.children || []).forEach((child: any) => {
      if (child.type === 'node') {
        const [w, h] = this.getNodeSize(child);
        const area = Math.max(w * h, 1);
        totalArea += area;
        maxW = Math.max(maxW, w);
        maxH = Math.max(maxH, h);
        return;
      }

      if (child.type === 'combo') {
        const childSize = this.estimateGroupSize(child);
        const area = Math.max(childSize.width * childSize.height, 1);
        totalArea += area;
        maxW = Math.max(maxW, childSize.width);
        maxH = Math.max(maxH, childSize.height);
      }
    });

    const side = Math.max(Math.sqrt(totalArea), maxW, maxH, 10);
    const padding = comboPadding * 2;
    group.estimatedSize = {
      width: side + padding,
      height: side + padding,
    };
    return group.estimatedSize;
  }

  /**
   * 获取元素尺寸
   */
  private getElementSize(
    element: any,
    includeSpacing: boolean = true,
  ): STDSize {
    if (element.type === 'combo' && element.bounds) {
      return [element.bounds.width, element.bounds.height, 0];
    }

    return this.getNodeSize(element, includeSpacing);
  }

  /**
   * 获取布局尺寸
   */
  private getLayoutSize(element: any): [number, number] {
    const [width = 0, height = 0] = this.getElementSize(element);

    if (element.type === 'combo') {
      const spacing = this.options.comboSpacing ?? 0;
      return [width + spacing * 2, height + spacing * 2];
    }

    return [width, height];
  }

  /**
   * 获取节点尺寸
   */
  private getNodeSize(node: NodeData, includeSpacing: boolean = true): STDSize {
    const { nodeSize, nodeSpacing } = this.options;
    const sizeFn = formatNodeSizeFn(nodeSize, includeSpacing ? nodeSpacing : 0);
    const raw = node._original;

    return parseSize(sizeFn(raw));
  }

  /**
   * 应用最终位置
   */
  private applyPositions(hierarchy: any) {
    const applyNode = (node: any) => {
      const modelNode = this.model
        .nodes()
        .find((n) => String(n.id) === String(node.id));
      if (modelNode) {
        modelNode.x = node.x;
        modelNode.y = node.y;
        if (node.size) {
          modelNode.size = node.size;
        }
      }
    };

    const traverse = (group: any) => {
      if (group.id !== 'root') {
        const comboNode = this.model
          .nodes()
          .find((n) => String(n.id) === String(group.id));
        if (comboNode) {
          comboNode.x = group.x;
          comboNode.y = group.y;
          if (group.bounds) {
            comboNode.size = [group.bounds.width, group.bounds.height];
          }
        }
      }

      (group.children || []).forEach((child: any) => {
        if (child.type === 'node') applyNode(child);
        if (child.type === 'combo') traverse(child);
      });
    };

    traverse(hierarchy);
  }
}

async function executeLayout(
  layout: Layout<any>,
  data: GraphData,
  options: Record<string, any>,
) {
  if (isLayoutWithIterations(layout)) {
    layout.execute(data, options);
    layout.stop();
    return layout.tick(options.iterations ?? 300);
  }
  return await layout.execute(data, options);
}
