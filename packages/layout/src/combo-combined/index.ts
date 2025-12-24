import { BaseLayout, isLayoutWithIterations } from '../core/base-layout';
import { Layout } from '../core/types';
import { registry } from '../registry';
import { GraphData, LayoutNode, NodeData, STDSize } from '../types';
import { normalizeViewport, parseSize } from '../util';
import { formatNodeSizeFn } from '../util/format';
import type {
  ComboCombinedDependencyLevelInfo,
  ComboCombinedLayoutOptions,
} from './types';

export type { ComboCombinedDependencyLevelInfo, ComboCombinedLayoutOptions };

interface RelativePosition {
  x: number;
  y: number;
  relativeTo: string;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface HierarchyNode {
  id: string;
  type: 'combo' | 'node';
  depth: number;
  children: HierarchyNode[];
  parentId: string | null;
  leafCount?: number;
  x?: number;
  y?: number;
  size?: STDSize;
  bounds?: Bounds;
  estimatedSize?: { width: number; height: number };
  _original?: any;
}

/**
 * <zh/> 组合布局
 *
 * <en/> Combo Combined Layout
 */
export class ComboCombinedLayout extends BaseLayout<ComboCombinedLayoutOptions> {
  id = 'combo-combined';

  /** 存储元素相对于父容器的位置 */
  private elementRelativePositions = new Map<string, RelativePosition>();

  /** 依赖层级信息列表 */
  private dependencyLevelsInfo: ComboCombinedDependencyLevelInfo[] = [];

  /** 分组ID到依赖层级的映射 */
  private groupDependencyLevelMap = new Map<string, number>();

  private getComboEnclosingSizeFromLocalBounds(bounds: Bounds): {
    width: number;
    height: number;
  } {
    // bounds are relative to combo center (0,0)
    const left = bounds.x;
    const right = bounds.x + bounds.width;
    const top = bounds.y;
    const bottom = bounds.y + bounds.height;
    return {
      width: Math.max(Math.abs(left), Math.abs(right)) * 2,
      height: Math.max(Math.abs(top), Math.abs(bottom)) * 2,
    };
  }

  private getComboEnclosingSizeFromGlobalBounds(
    bounds: Bounds,
    center: { x: number; y: number },
  ): { width: number; height: number } {
    const left = bounds.x;
    const right = bounds.x + bounds.width;
    const top = bounds.y;
    const bottom = bounds.y + bounds.height;
    return {
      width:
        Math.max(Math.abs(left - center.x), Math.abs(right - center.x)) * 2,
      height:
        Math.max(Math.abs(top - center.y), Math.abs(bottom - center.y)) * 2,
    };
  }

  private isCombo(node: any): boolean {
    return Boolean(node?.isCombo);
  }

  protected getDefaultOptions(): Partial<ComboCombinedLayoutOptions> {
    return {
      layout: ({ dependencyLevel }) =>
        dependencyLevel === 0
          ? { type: 'concentric', preventOverlap: true }
          : { type: 'd3-force', preventOverlap: true },
      nodeSize: 20,
      nodeSpacing: 10,
      comboPadding: 20,
      comboSpacing: 50,
    };
  }

  protected async layout(): Promise<void> {
    const { width, height, center } = normalizeViewport(this.options);
    this.resetLayoutState();

    /** 1. 构建分组层级结构 */
    const rootHierarchy = this.buildHierarchyTree();
    this.computeDependencyLevels(rootHierarchy);
    this.computeLeafCounts(rootHierarchy);

    /** 2. 从内到外递归布局 */
    await this.layoutHierarchy(rootHierarchy, {
      width,
      height,
      center,
    });

    /** 3. 计算全局位置 */
    this.convertToGlobalPositions(rootHierarchy, {
      x: center[0],
      y: center[1],
    });

    /** 4. 应用位置到节点 */
    this.applyPositionsToModel(rootHierarchy);
  }

  /**
   * 重置布局状态
   */
  private resetLayoutState(): void {
    this.elementRelativePositions.clear();
    this.groupDependencyLevelMap.clear();
  }

  /**
   * 递归布局层级结构
   */
  private async layoutHierarchy(
    groupNode: HierarchyNode,
    containerBounds: {
      width: number;
      height: number;
      center: [number, number];
    },
  ): Promise<void> {
    for (const child of groupNode.children) {
      if (child.type === 'combo') {
        await this.layoutHierarchy(
          child,
          this.calculateChildContainerBounds(child, groupNode),
        );
      }
    }

    const childElements = groupNode.children || [];

    if (childElements.length === 0) {
      groupNode.bounds = { x: 0, y: 0, width: 0, height: 0 };
      groupNode.parentId = groupNode.id === 'root' ? null : groupNode.parentId;
      return;
    }

    const layoutConfig = this.getLayoutConfigForGroup(groupNode);
    const estimatedSize = this.estimateGroupSize(groupNode);
    const layoutWidth = Math.max(containerBounds.width, estimatedSize.width);
    const layoutHeight = Math.max(containerBounds.height, estimatedSize.height);
    const layoutCenter: [number, number] = [layoutWidth / 2, layoutHeight / 2];

    const LayoutClass = this.getLayoutClass(layoutConfig.type);
    const layoutInstance = new LayoutClass({
      ...layoutConfig,
      width: layoutWidth,
      height: layoutHeight,
      center: layoutCenter,
      nodeSize: (d: NodeData) => d.size,
      nodeSpacing: 0,
    });

    const tmpGraphData = this.createTemporaryGraphData(childElements);
    await executeLayout(layoutInstance, tmpGraphData, {});

    const layoutedNodes = this.collectLayoutedNodes(layoutInstance);
    const groupCenter = this.calculateGroupCenter(layoutedNodes, groupNode);

    this.recordRelativePositions(
      layoutedNodes,
      groupNode,
      groupCenter,
      childElements,
    );

    groupNode.bounds = this.calculateGroupLocalBounds(groupNode);
  }

  /**
   * 收集布局后的节点
   */
  private collectLayoutedNodes(layoutInstance: Layout<any>): any[] {
    const layoutedNodes: any[] = [];
    layoutInstance.forEachNode((node: any) => {
      layoutedNodes.push(node);
    });
    return layoutedNodes;
  }

  /**
   * 计算组的中心点
   */
  private calculateGroupCenter(
    layoutedNodes: any[],
    groupNode: HierarchyNode,
  ): [number, number] {
    if (layoutedNodes.length === 0) {
      return [0, 0];
    }

    // Use leaf-node counts as weights so group centers represent the centroid
    // of all descendant nodes (not just direct children).
    const weightById = new Map<string, number>();
    (groupNode.children || []).forEach((child) => {
      weightById.set(String(child.id), child.leafCount ?? 1);
    });

    let totalX = 0;
    let totalY = 0;
    let totalW = 0;

    layoutedNodes.forEach((node) => {
      const w = weightById.get(String(node.id)) ?? 1;
      totalX += node.x * w;
      totalY += node.y * w;
      totalW += w;
    });

    const denom = totalW || layoutedNodes.length;
    return [totalX / denom, totalY / denom];
  }

  /**
   * 计算每个层级节点包含的叶子节点数量
   */
  private computeLeafCounts(rootNode: HierarchyNode): number {
    if (rootNode.type === 'node') {
      rootNode.leafCount = 1;
      return 1;
    }

    let sum = 0;
    (rootNode.children || []).forEach((child) => {
      sum += this.computeLeafCounts(child);
    });

    rootNode.leafCount = sum;
    return sum;
  }

  /**
   * 记录相对位置
   */
  private recordRelativePositions(
    layoutedNodes: any[],
    groupNode: HierarchyNode,
    groupCenter: [number, number],
    childElements: HierarchyNode[],
  ): void {
    const childMap = new Map(
      childElements.map((child) => [String(child.id), child]),
    );

    layoutedNodes.forEach((layoutedNode) => {
      const child = childMap.get(String(layoutedNode.id));
      if (!child) return;

      this.elementRelativePositions.set(String(child.id), {
        x: layoutedNode.x - groupCenter[0],
        y: layoutedNode.y - groupCenter[1],
        relativeTo: String(groupNode.id),
      });
    });
  }

  private getParentId = (node: LayoutNode): string => {
    return String(node.parentId || 'root');
  };

  private buildHierarchyTree(): HierarchyNode {
    const rootNode: HierarchyNode = {
      id: 'root',
      type: 'combo',
      depth: 0,
      children: [],
      parentId: null,
    };

    const comboNodeMap = new Map<string, HierarchyNode>();
    comboNodeMap.set('root', rootNode);

    this.model.nodes().forEach((node) => {
      if (this.isCombo(node)) {
        const comboNode: HierarchyNode = {
          id: String(node.id),
          type: 'combo',
          depth: 0,
          children: [],
          parentId: this.getParentId(node),
        };
        comboNodeMap.set(String(node.id), comboNode);
      }
    });

    this.model.nodes().forEach((node) => {
      const parentNode = comboNodeMap.get(this.getParentId(node));

      if (this.isCombo(node)) {
        const comboNode = comboNodeMap.get(String(node.id));
        if (parentNode && comboNode) {
          parentNode.children.push(comboNode);
          comboNode.depth = parentNode.depth + 1;
          comboNode.parentId = parentNode.id;
        }
      } else {
        if (parentNode) {
          parentNode.children.push({
            id: String(node.id),
            type: 'node',
            depth: parentNode.depth + 1,
            children: [],
            parentId: parentNode.id,
          });
        }
      }
    });
    return rootNode;
  }

  /**
   * 将局部坐标转换为全局坐标
   */
  private convertToGlobalPositions(
    groupNode: HierarchyNode,
    parentGlobalPosition: { x: number; y: number },
  ): void {
    const relativePos =
      groupNode.id === 'root'
        ? null
        : this.elementRelativePositions.get(String(groupNode.id)) || null;

    const globalX = parentGlobalPosition.x + (relativePos?.x ?? 0);
    const globalY = parentGlobalPosition.y + (relativePos?.y ?? 0);

    groupNode.x = globalX;
    groupNode.y = globalY;

    // 处理子元素
    (groupNode.children || []).forEach((child) => {
      const childRelativePos =
        this.elementRelativePositions.get(String(child.id)) || null;

      if (childRelativePos && childRelativePos.relativeTo !== groupNode.id) {
        console.warn(
          `元素 ${child.id} (${child.type}) 的布局父节点不匹配: 期望 ${groupNode.id}, 实际 ${childRelativePos.relativeTo}`,
        );
      }

      child.x = globalX + (childRelativePos?.x ?? 0);
      child.y = globalY + (childRelativePos?.y ?? 0);
      child.size = this.getElementSize(child, false);

      if (child.type === 'combo') {
        this.convertToGlobalPositions(child, {
          x: globalX,
          y: globalY,
        });
      }
    });

    // 转换边界为全局坐标
    if (groupNode.bounds) {
      groupNode.bounds = {
        x: globalX + groupNode.bounds.x,
        y: globalY + groupNode.bounds.y,
        width: groupNode.bounds.width,
        height: groupNode.bounds.height,
      };
    }
  }

  /**
   * 获取分组的布局配置
   */
  private getLayoutConfigForGroup(groupNode: HierarchyNode) {
    const { layout } = this.options;

    if (typeof layout === 'function') {
      const groupId = String(groupNode.id);
      const dependencyLevel = this.groupDependencyLevelMap.get(groupId) ?? 0;
      const dependencyLevelInfo = this.dependencyLevelsInfo.find(
        (info) => info.level === dependencyLevel,
      );

      return this.normalizeLayoutConfig(
        layout({
          depth: groupNode.depth,
          groupId,
          dependencyLevel,
          dependencyLevels: this.dependencyLevelsInfo,
          dependencyLevelInfo,
        }),
      );
    }

    return this.normalizeLayoutConfig(layout);
  }

  /**
   * 计算依赖层级
   * level: 叶子Combo为0，根节点最大
   */
  private computeDependencyLevels(rootNode: HierarchyNode): void {
    const calculateLevel = (groupNode: HierarchyNode): number => {
      const groupId = String(groupNode.id);
      const cachedLevel = this.groupDependencyLevelMap.get(groupId);
      if (cachedLevel !== undefined) return cachedLevel;

      let maxChildLevel = -1;
      (groupNode.children || []).forEach((child) => {
        if (child.type !== 'combo') return;
        maxChildLevel = Math.max(maxChildLevel, calculateLevel(child));
      });

      const currentLevel = maxChildLevel + 1;
      this.groupDependencyLevelMap.set(groupId, currentLevel);
      return currentLevel;
    };

    calculateLevel(rootNode);

    const levelsMap = new Map<number, ComboCombinedDependencyLevelInfo>();

    const collectLevelInfo = (groupNode: HierarchyNode) => {
      const level = this.groupDependencyLevelMap.get(String(groupNode.id)) ?? 0;
      const levelInfo =
        levelsMap.get(level) ||
        ({
          level,
          groups: [],
        } as ComboCombinedDependencyLevelInfo);

      if (!levelsMap.has(level)) {
        levelsMap.set(level, levelInfo);
      }

      levelInfo.groups.push({
        id: String(groupNode.id),
        elements: (groupNode.children || []).map((child) => ({
          id: String(child.id),
          type: child.type === 'combo' ? 'combo' : 'node',
        })),
      });

      (groupNode.children || []).forEach((child) => {
        if (child.type === 'combo') {
          collectLevelInfo(child);
        }
      });
    };

    collectLevelInfo(rootNode);
    this.dependencyLevelsInfo = Array.from(levelsMap.values()).sort(
      (a, b) => a.level - b.level,
    );
  }

  /**
   * 标准化布局配置
   */
  private normalizeLayoutConfig(config: any) {
    if (typeof config === 'string') return { type: config };

    const { type = 'concentric', ...rest } = config || {};
    return { ...rest, type };
  }

  /**
   * 获取布局类
   */
  private getLayoutClass(layoutType: string) {
    return registry[layoutType] || registry.concentric;
  }

  /**
   * 创建临时图数据用于布局计算
   */
  private createTemporaryGraphData(elements: HierarchyNode[]): GraphData {
    const tmpNodes = elements.map((element) => ({
      ...element._original,
      ...element,
      size: this.getLayoutSize(element),
    }));

    const elementIdSet = new Set(elements.map((e) => String(e.id)));
    const tmpEdges: GraphData['edges'] = [];

    this.model.edges().forEach((edge) => {
      if (
        elementIdSet.has(String(edge.source)) &&
        elementIdSet.has(String(edge.target))
      ) {
        tmpEdges.push(edge._original);
      }
    });

    return {
      nodes: tmpNodes,
      edges: tmpEdges,
    };
  }

  /**
   * 计算子容器边界
   */
  private calculateChildContainerBounds(
    childNode: HierarchyNode,
    parentNode: HierarchyNode,
  ) {
    const comboPadding = this.options.comboPadding ?? 20;
    const parentSize = this.estimateGroupSize(parentNode);
    const estimatedSize = this.estimateGroupSize(childNode);

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
   * 计算组的局部边界
   */
  private calculateGroupLocalBounds(groupNode: HierarchyNode): Bounds {
    const elements = (groupNode.children || []).map((child) => {
      const relativePos = this.elementRelativePositions.get(String(child.id));
      const relX = relativePos?.x ?? 0;
      const relY = relativePos?.y ?? 0;

      if (child.type === 'combo' && child.bounds) {
        const { width, height } = this.getComboEnclosingSizeFromLocalBounds(
          child.bounds,
        );

        return {
          x: relX,
          y: relY,
          size: [width, height],
        };
      }

      return {
        x: relX,
        y: relY,
        size: this.getElementSize(child),
      };
    });
    return this.calculateBoundsFromElements(elements);
  }

  /**
   * 从元素列表计算边界
   */
  private calculateBoundsFromElements(
    elements: Array<{ x: number; y: number; size: any }>,
    padding: number = this.options.comboPadding ?? 20,
  ): Bounds {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity,
      minY = Infinity;
    let maxX = -Infinity,
      maxY = -Infinity;

    elements.forEach((element) => {
      const [width = 0, height = 0] = element.size || [0, 0];
      const max = Math.max(width, height);
      minX = Math.min(minX, element.x - max / 2);
      minY = Math.min(minY, element.y - max / 2);
      maxX = Math.max(maxX, element.x + max / 2);
      maxY = Math.max(maxY, element.y + max / 2);
    });

    return {
      x: minX - padding,
      y: minY - padding,
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  /**
   * 估算组尺寸
   */
  private estimateGroupSize(groupNode: HierarchyNode): {
    width: number;
    height: number;
  } {
    const { comboSpacing = 50 } = this.options;

    const hasChildComboBounds = (groupNode.children || []).some(
      (child) =>
        child.type === 'combo' && child.bounds?.width && child.bounds?.height,
    );

    if (groupNode?.estimatedSize && !hasChildComboBounds) {
      return groupNode.estimatedSize;
    }

    let totalArea = 0;
    let maxWidth = 0;
    let maxHeight = 0;

    (groupNode.children || []).forEach((child) => {
      if (child.type === 'node') {
        const [width, height] = this.getNodeSize(child);
        const area = Math.max(width * height, 1);
        totalArea += area;
        maxWidth = Math.max(maxWidth, width);
        maxHeight = Math.max(maxHeight, height);
        return;
      }

      if (child.type === 'combo') {
        const estimatedChild = this.estimateGroupSize(child);
        const baseSize = child.bounds
          ? this.getComboEnclosingSizeFromLocalBounds(child.bounds)
          : { width: estimatedChild.width, height: estimatedChild.height };

        const width = baseSize.width + comboSpacing * 2;
        const height = baseSize.height + comboSpacing * 2;
        const area = Math.max(width * height, 1);
        totalArea += area;
        maxWidth = Math.max(maxWidth, width);
        maxHeight = Math.max(maxHeight, height);
      }
    });

    const estimatedSide = Math.max(
      Math.sqrt(totalArea),
      maxWidth,
      maxHeight,
      10,
    );
    const padding = (this.options.comboPadding ?? 20) * 2;

    groupNode.estimatedSize = {
      width: estimatedSide + padding,
      height: estimatedSide + padding,
    };

    return groupNode.estimatedSize;
  }

  /**
   * 获取元素尺寸
   */
  private getElementSize(
    element: HierarchyNode,
    includeSpacing: boolean = true,
  ): STDSize {
    if (element.type === 'combo' && element.bounds) {
      return [element.bounds.width, element.bounds.height, 0];
    }

    return this.getNodeSize(element, includeSpacing);
  }

  /**
   * 获取布局尺寸（包含间距）
   */
  private getLayoutSize(element: HierarchyNode): [number, number] {
    if (element.type === 'combo') {
      const spacing = this.options.comboSpacing ?? 0;
      if (element.bounds) {
        const { width, height } = this.getComboEnclosingSizeFromLocalBounds(
          element.bounds,
        );
        return [width + spacing * 2, height + spacing * 2];
      }

      const estimated = this.estimateGroupSize(element);
      return [estimated.width + spacing * 2, estimated.height + spacing * 2];
    }

    const [width = 0, height = 0] = this.getElementSize(element);
    return [width, height];
  }

  /**
   * 获取节点尺寸
   */
  private getNodeSize(
    node: NodeData | HierarchyNode,
    includeSpacing: boolean = true,
  ): STDSize {
    const { nodeSize, nodeSpacing } = this.options;
    const sizeFn = formatNodeSizeFn(nodeSize, includeSpacing ? nodeSpacing : 0);
    const originalNode = (node as any)._original;

    return parseSize(sizeFn(originalNode));
  }

  /**
   * 应用最终位置到模型
   */
  private applyPositionsToModel(rootHierarchy: HierarchyNode): void {
    const applyNodePosition = (node: HierarchyNode) => {
      const modelNode = this.model
        .nodes()
        .find((n) => String(n.id) === String(node.id));

      if (modelNode) {
        modelNode.x = node.x!;
        modelNode.y = node.y!;
        if (node.size) {
          modelNode.size = node.size;
        }
      }
    };

    const traverseAndApply = (groupNode: HierarchyNode) => {
      if (groupNode.id !== 'root') {
        const comboModelNode = this.model
          .nodes()
          .find((n) => String(n.id) === String(groupNode.id));

        if (comboModelNode) {
          comboModelNode.x = groupNode.x!;
          comboModelNode.y = groupNode.y!;
          if (groupNode.bounds) {
            const { width, height } =
              this.getComboEnclosingSizeFromGlobalBounds(groupNode.bounds, {
                x: groupNode.x!,
                y: groupNode.y!,
              });
            comboModelNode.size = [width, height];
          }
        }
      }

      (groupNode.children || []).forEach((child) => {
        if (child.type === 'node') {
          applyNodePosition(child);
        }
        if (child.type === 'combo') {
          traverseAndApply(child);
        }
      });
    };

    traverseAndApply(rootHierarchy);
  }
}

async function executeLayout(
  layout: Layout<any>,
  graphData: GraphData,
  options: Record<string, any> = {},
): Promise<void> {
  if (isLayoutWithIterations(layout)) {
    layout.execute(graphData, options);
    layout.stop();
    return layout.tick(options.iterations ?? 300);
  }
  return await layout.execute(graphData, options);
}
