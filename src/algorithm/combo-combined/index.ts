import { registry } from '../../registry';
import type { GraphData, ID, LayoutNode, Point, STDSize } from '../../types';
import { normalizeViewport } from '../../util';
import { formatFn, formatNodeSizeFn, formatNumberFn } from '../../util/format';
import { BaseLayout, isLayoutWithIterations } from '../base-layout';
import type { Layout } from '../types';
import type {
  ComboCombinedLayoutConfig,
  ComboCombinedLayoutOptions,
} from './types';

export type { ComboCombinedLayoutOptions };

interface RelativePosition {
  x: number;
  y: number;
  relativeTo: string;
}

interface HierarchyNode extends Partial<LayoutNode> {
  children?: HierarchyNode[];
}

const DEFAULT_OPTIONS: ComboCombinedLayoutOptions = {
  layout: (comboId) =>
    !comboId
      ? { type: 'force', preventOverlap: true }
      : { type: 'concentric', preventOverlap: true },
  nodeSize: 20,
  nodeSpacing: 0,
  comboPadding: 10,
  comboSpacing: 0,
};

const ROOT_ID = 'root';

/**
 * <zh/> 组合布局
 *
 * <en/> Combo Combined Layout
 */
export class ComboCombinedLayout extends BaseLayout<ComboCombinedLayoutOptions> {
  id = 'combo-combined';

  protected getDefaultOptions(): Partial<ComboCombinedLayoutOptions> {
    return DEFAULT_OPTIONS;
  }

  private relativePositions = new Map<ID, RelativePosition>();

  protected async layout(): Promise<void> {
    const { center } = normalizeViewport(this.options);
    this.resetLayoutState();

    /** 1. 构建分组层级结构 */
    const rootHierarchy = this.buildHierarchyTree();

    /** 2. 从内到外递归布局 */
    await this.layoutHierarchy(rootHierarchy);

    /** 3. 计算全局位置 */
    this.convertToGlobalPositions(rootHierarchy, center);

    /** 4. 应用位置到节点 */
    this.applyPositionsToModel(rootHierarchy);
  }

  private isCombo(node: HierarchyNode): boolean {
    return Boolean(node.isCombo);
  }

  private getParentId = (node: LayoutNode): ID => {
    return node.parentId || ROOT_ID;
  };

  private resetLayoutState(): void {
    this.relativePositions.clear();
  }

  private async layoutHierarchy(combo: HierarchyNode): Promise<void> {
    for (const child of combo.children || []) {
      if (this.isCombo(child)) await this.layoutHierarchy(child);
    }

    const childElements = combo.children || [];

    if (childElements.length === 0) {
      combo.size = [0, 0, 0];
      combo.parentId = combo.id === ROOT_ID ? null : combo.parentId;
      return;
    }

    const { type, ...options } = this.getLayoutConfig(combo);
    const LayoutClass = this.getLayoutClass(type);
    const layoutInstance = new LayoutClass(options);

    const tmpGraphData = this.createTemporaryGraphData(childElements);
    await executeLayout(layoutInstance, tmpGraphData, {});

    const partialNodes = layoutInstance.model.nodes() as LayoutNode[];
    this.recordRelativePositions(partialNodes, combo);

    const { center, width, height } = this.calculateComboBounds(combo);
    combo.size = [width, height, 0];

    (combo.children || []).forEach((child) => {
      const rel = this.relativePositions.get(child.id!);
      if (!rel) return;
      const pos = {
        ...rel,
        x: rel.x - center[0],
        y: rel.y - center[1],
      };
      this.relativePositions.set(child.id!, pos);
    });
  }

  private recordRelativePositions(
    nodes: HierarchyNode[],
    related: HierarchyNode,
  ): void {
    const comboCenter = this.calculateComboCenter(nodes);

    nodes.forEach((node) => {
      this.relativePositions.set(node.id!, {
        x: node.x! - comboCenter[0],
        y: node.y! - comboCenter[1],
        relativeTo: String(related.id),
      });
    });
  }

  private buildHierarchyTree(): HierarchyNode {
    const rootNode: HierarchyNode = {
      id: ROOT_ID,
      isCombo: true,
      children: [],
      parentId: null,
    };

    const comboNodeMap = new Map<ID, HierarchyNode>();
    comboNodeMap.set(ROOT_ID, rootNode);

    this.model.forEachNode((node) => {
      if (this.isCombo(node)) {
        const combo: HierarchyNode = {
          ...node,
          children: [],
          parentId: this.getParentId(node),
        };
        comboNodeMap.set(String(node.id), combo);
      }
    });

    this.model.forEachNode((node) => {
      const parentNode = comboNodeMap.get(this.getParentId(node));

      if (this.isCombo(node)) {
        const combo = comboNodeMap.get(String(node.id));
        if (parentNode && combo) {
          parentNode.children!.push(combo);
          combo.parentId = parentNode.id;
        }
      } else {
        if (parentNode) {
          parentNode.children!.push({
            ...node,
            children: [],
            parentId: this.getParentId(node),
          });
        }
      }
    });
    return rootNode;
  }

  private convertToGlobalPositions(combo: HierarchyNode, parent: Point): void {
    const relativePos =
      combo.id === ROOT_ID ? null : this.relativePositions.get(combo.id!);

    const globalX = parent[0] + (relativePos?.x ?? 0);
    const globalY = parent[1] + (relativePos?.y ?? 0);

    combo.x = globalX;
    combo.y = globalY;

    (combo.children || []).forEach((child) => {
      const childRelativePos = this.relativePositions.get(child.id!);

      child.x = globalX + (childRelativePos?.x ?? 0);
      child.y = globalY + (childRelativePos?.y ?? 0);
      child.size = this.getNodeLikeSize(child, false);

      if (this.isCombo(child)) {
        this.convertToGlobalPositions(child, [globalX, globalY]);
      }
    });
  }

  private getLayoutConfig(combo: HierarchyNode) {
    const layout =
      typeof this.options.layout === 'object'
        ? this.options.layout
        : formatFn(this.options.layout, ['comboId']);

    if (typeof layout === 'function') {
      const comboId = combo.id === ROOT_ID ? null : combo.id!;
      return this.normalizeLayoutConfig(layout(comboId));
    }

    return this.normalizeLayoutConfig(layout);
  }

  private normalizeLayoutConfig(config?: ComboCombinedLayoutConfig) {
    const base = {
      type: 'concentric',
      ...normalizeViewport(this.options),
      nodeSize: 'node.size',
      nodeSpacing: 0,
    };

    if (!config) return base;

    if (typeof config === 'string') return { ...base, type: config };

    return { ...base, ...config };
  }

  private getLayoutClass(layoutType: string) {
    return registry[layoutType] || registry.concentric;
  }

  private createTemporaryGraphData(nodes: HierarchyNode[]): GraphData {
    const tmpNodes = nodes.map((node) => ({
      ...node,
      size: this.getNodeLikeSize(node),
    }));

    const nodeIds = new Set(nodes.map((e) => String(e.id)));
    const tmpEdges: GraphData['edges'] = [];

    const resolveToClosestAncestorInSet = (id: string): string | null => {
      let current: string | null = String(id);
      const visited = new Set<string>();

      while (current && !visited.has(current)) {
        if (nodeIds.has(current)) return current;
        visited.add(current);

        const node = this.model.node(current);
        const parentId = node?.parentId;
        current = parentId == null ? null : String(parentId);
      }

      return null;
    };

    this.model.forEachEdge((edge) => {
      const source = resolveToClosestAncestorInSet(String(edge.source));
      const target = resolveToClosestAncestorInSet(String(edge.target));
      if (!source || !target) return;
      if (source === target) return;

      tmpEdges.push({ source, target });
    });

    return {
      nodes: tmpNodes,
      edges: tmpEdges,
    };
  }

  private calculateComboCenter(nodes: HierarchyNode[]): Point {
    if (nodes.length === 0) return [0, 0];

    const sizeMap = new Map<ID, STDSize>();
    nodes.forEach((child) => {
      const size = this.getNodeLikeSize(child);
      sizeMap.set(child.id!, size);
    });

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const [w = 0, h = 0] = sizeMap.get(node.id!)!;
      minX = Math.min(minX, node.x! - w / 2);
      minY = Math.min(minY, node.y! - h / 2);
      maxX = Math.max(maxX, node.x! + w / 2);
      maxY = Math.max(maxY, node.y! + h / 2);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) return [0, 0];
    return [(minX + maxX) / 2, (minY + maxY) / 2];
  }

  private calculateComboBounds(combo: HierarchyNode): {
    center: Point;
    width: number;
    height: number;
  } {
    const children = combo.children || [];

    if (children.length === 0) {
      return { center: [0, 0], width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    children.forEach((child) => {
      const relativePos = this.relativePositions.get(child.id!);

      const x = relativePos?.x ?? 0;
      const y = relativePos?.y ?? 0;

      const [width, height] = this.getNodeLikeSize(child);

      minX = Math.min(minX, x - width / 2);
      minY = Math.min(minY, y - height / 2);
      maxX = Math.max(maxX, x + width / 2);
      maxY = Math.max(maxY, y + height / 2);
    });

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return { center: [0, 0], width: 0, height: 0 };
    }

    const comboPaddingFn = formatNumberFn(
      this.options.comboPadding,
      20,
      'combo',
    );
    const padding = comboPaddingFn(combo._original!);

    return {
      center: [(minX + maxX) / 2, (minY + maxY) / 2],
      width: maxX - minX + padding * 2,
      height: maxY - minY + padding * 2,
    };
  }

  private getNodeLikeSize(
    node: HierarchyNode,
    includeSpacing: boolean = true,
  ): STDSize {
    if (this.isCombo(node)) return this.getComboSize(node, includeSpacing);

    return this.getNodeSize(node, includeSpacing);
  }

  private getNodeSize(
    node: HierarchyNode,
    includeSpacing: boolean = true,
  ): STDSize {
    const { nodeSize, nodeSpacing } = this.options;
    const sizeFn = formatNodeSizeFn(nodeSize, includeSpacing ? nodeSpacing : 0);
    return sizeFn(node._original!);
  }

  private getComboSize(
    combo: HierarchyNode,
    includeSpacing: boolean = true,
  ): STDSize {
    const comboSpacingFn = formatNumberFn(
      this.options.comboSpacing,
      0,
      'combo',
    );
    const spacing = includeSpacing ? comboSpacingFn(combo._original!) : 0;
    const [width, height] = combo.size as STDSize;
    return [width + spacing / 2, height + spacing / 2, 0];
  }

  private applyPositionsToModel(rootHierarchy: HierarchyNode): void {
    const apply = (datum: HierarchyNode) => {
      const node = this.model.node(datum.id!);
      if (!node) return;

      node.x = datum.x!;
      node.y = datum.y!;
      if (datum.size) node.size = datum.size;
    };

    const traverseAndApply = (combo: HierarchyNode) => {
      if (combo.id !== ROOT_ID) apply(combo);

      (combo.children || []).forEach((child) => {
        if (this.isCombo(child)) {
          traverseAndApply(child);
        } else {
          apply(child);
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
