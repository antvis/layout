import { Base } from './base';
import { Combo, DagreCompoundLayoutOptions, OutNode, Point, PointTuple } from './types';
import {
    buildGraph,
    DeepPartial,
    flatGraph,
    getEdges,
    HierarchyBaseEdgeInfo,
    HierarchyBaseNodeInfo,
    HierarchyFlattenedGraphInfo,
    HierarchyGraphCompoundDef,
    HierarchyGraphDef,
    HierarchyGraphNodeInfo,
    HierarchyGraphOption,
    HierarchyNodeType,
    LAYOUT_CONFIG,
    LayoutConfig,
    mergeConfig,
    NodeType,
    ROOT_NAME
} from 'dagre-compound';
import { isArray, isObject } from '../util';

interface IPoint {
    x: number;
    y: number;
    anchorIndex?: number;
    [key: string]: number | undefined;
}

interface Edge {
    source: string;
    target: string;
    type?: string;
    startPoint?: IPoint;
    endPoint?: IPoint;
    controlPoints?: IPoint[];
    sourceAnchor?: number;
    targetAnchor?: number;
    layoutOrder?: number; // 用于描述用户输入数据顺序，确保按照用户原始数据顺序排序
    [key: string]: unknown;
}

type ComboType = Combo & {
    x?: number;
    y?: number;
    label?: string;
    type: string;
    size?: number | number[] | undefined;
    fixSize?: number[];
    fixCollapseSize?: number[];
    // combo 入边与出边，收起时优化连线
    inEdges?: Edge[];
    outEdges?: Edge[];
    padding?: number[];
    collapsed?: boolean;
    // 手动指定偏移量
    offsetX?: number;
    offsetY?: number;
    [key: string]: unknown;
};

type Node = OutNode & {
    label?: string;
    width?: number;
    height?: number;
    type?: string;
    anchorPoints?: [number, number][];
    layoutOrder?: number; // 用于描述用户输入数据顺序，确保按照用户原始数据顺序排序
};

type ModelType = {
    nodes?: Node[];
    edges?: Edge[];
    comboEdges?: Edge[];
    combos?: ComboType[];
    hiddenNodes?: Node[];
    hiddenEdges?: Edge[];
    hiddenCombos?: ComboType[];
};

export class DagreCompoundLayout extends Base {
    /** layout 方向, 可选 TB, BT, LR, RL */
    public rankdir: 'TB' | 'BT' | 'LR' | 'RL' = 'TB';

    /** 节点对齐方式，可选 UL, UR, DL, DR */
    public align: undefined | 'UL' | 'UR' | 'DL' | 'DR';

    /** 布局的起始（左上角）位置 */
    public begin: PointTuple | undefined;

    /** 节点大小 */
    public nodeSize: number | number[] | undefined;

    /** 节点水平间距(px) */
    public nodesep: number = 50;

    /** 边水平间距(px) */
    public edgesep: number = 5;

    /** 每一层节点之间间距 */
    public ranksep: number = 50;

    /** 是否保留布局连线的控制点 */
    public controlPoints: boolean = true;

    /** 是否保留使用布局计算的锚点 */
    public anchorPoint: boolean = true;

    /** 全局布局配置，优先级最高 */
    public settings?: DeepPartial<LayoutConfig>;

    public nodes: Node[] = [];
    public edges: Edge[] = [];
    public combos: ComboType[] = [];

    /** 当前生命周期内布局配置信息 */
    private graphSettings: DeepPartial<LayoutConfig> | undefined;

    /** 迭代结束的回调函数 */
    public onLayoutEnd: () => void = () => {};
    constructor(options?: DagreCompoundLayoutOptions) {
        super();
        this.updateCfg(options);
    }

    public getDefaultCfg() {
        return {
            rankdir: 'TB', // layout 方向, 可选 TB, BT, LR, RL
            align: undefined, // 节点对齐方式，可选 UL, UR, DL, DR
            begin: undefined, // 布局的起始（左上角）位置
            nodeSize: undefined, // 节点大小
            nodesep: 50, // 节点水平间距(px)
            ranksep: 50, // 每一层节点之间间距
            controlPoints: true, // 是否保留布局连线的控制点
            anchorPoint: true // 是否使用布局计算的锚点
        };
    }

    public init(data: ModelType) {
        const hiddenNodes = data.hiddenNodes || []; // 被隐藏的节点
        const hiddenEdges = data.hiddenEdges || []; // 被隐藏的边
        const hiddenCombos = data.hiddenCombos || []; // 赋值 hiddenCombos
        // 确保此次排序按照用户输入顺序
        this.nodes = this.getDataByOrder((data.nodes || []).concat(hiddenNodes));
        this.edges = this.getDataByOrder((data.edges || []).concat(hiddenEdges));
        this.combos = (data.combos || []).concat(hiddenCombos.map((hc) => ({ ...hc, collapsed: true })));
    }

    public execute() {
        const self = this;
        const { nodes, edges } = self;
        if (!nodes) return;

        const { graphDef, graphOption, graphSettings } = self.getLayoutConfig();
        const renderInfo = buildGraph(graphDef, graphOption, graphSettings);
        const flattenedRenderInfo = flatGraph(renderInfo, true); // 打平数据进行遍历
        this.updatePosition(flattenedRenderInfo);

        if (self.onLayoutEnd) self.onLayoutEnd();

        return {
            nodes,
            edges
        };
    }

    /**
     * combo 模式下查找节点完整路径
     * @param nodeId
     * @private
     */
    private getNodePath(nodeId: string): string[] {
        const self = this;
        const { nodes, combos } = self;
        const targetNode = nodes.find((n) => n.id === nodeId);
        const findPath = (comboId: string, fullPath: string[] = []): string[] => {
            const combo = combos.find((c) => c.id === comboId);
            if (combo) {
                fullPath.unshift(comboId);
                if (combo.parentId) {
                    return findPath(combo.parentId, fullPath);
                }
                return fullPath;
            }
            return fullPath;
        };
        if (targetNode && targetNode.comboId) {
            return findPath(targetNode.comboId, [nodeId]);
        }
        return [nodeId];
    }

    /** 准备 dagre-compound 布局参数 */
    private getLayoutConfig(): { graphDef: HierarchyGraphDef; graphOption: HierarchyGraphOption; graphSettings: DeepPartial<LayoutConfig> } {
        const self = this;
        const { nodes, edges, combos, nodeSize, rankdir, align, edgesep, nodesep, ranksep, settings } = self;
        const compound = (combos || []).reduce((pre: HierarchyGraphCompoundDef, cur) => {
            const matchedNodes = nodes.filter((n) => n.comboId === cur.id).map((n) => n.id);
            const matchedCombos = (combos || []).filter((n) => n.parentId === cur.id).map((n) => n.id);
            if (matchedNodes.length || matchedCombos.length) {
                pre[cur.id] = [...matchedNodes, ...matchedCombos];
            }
            return pre;
        }, {});

        /** 计算 nodeSize */
        let nodeSizeFunc: (d?: Node) => number[];
        if (!nodeSize) {
            nodeSizeFunc = (d?: Node) => {
                if (d && d.size) {
                    if (isArray(d.size)) {
                        return d.size;
                    }
                    if (isObject(d.size)) {
                        return [d.size.width || 40, d.size.height || 40];
                    }
                    return [d.size, d.size];
                }
                return [40, 40];
            };
        } else if (isArray(nodeSize)) {
            nodeSizeFunc = () => nodeSize;
        } else {
            nodeSizeFunc = () => [nodeSize, nodeSize];
        }

        /** 计算 comboSize */
        const comboSizeFunc: (d?: ComboType) => number[] = (d?: ComboType): number[] => {
            if (d && d.size) {
                if (isArray(d.size)) {
                    return d.size;
                }
                return [d.size, d.size];
            }
            return [80, 40];
        };

        // 接受 defaultCombo 设置的 size
        const [metaWidth, metaHeight] = comboSizeFunc(combos?.[0]);
        // 初始化 padding
        const subSceneMeta = self.graphSettings?.subScene?.meta;
        const [paddingTop, paddingRight, paddingBottom, paddingLeft] = combos.find((c) => !c.collapsed)?.padding || [20, 20, 20, 20];
        const graphDef = {
            compound,
            nodes: [
                ...(nodes || []).map((n) => {
                    const size = nodeSizeFunc(n);
                    const width = size[0];
                    const height = size[1];
                    return { ...n, width, height };
                })
            ],
            edges: [...(edges || []).map((e) => ({ ...e, v: e.source, w: e.target }))]
        };

        // 需要展开的节点
        const graphOption = {
            expanded: (combos || []).filter((c) => !c.collapsed).map((c) => c.id)
        };

        // dagre-compound 布局参数
        const graphMetaConfig: DeepPartial<LayoutConfig> = {
            graph: {
                meta: {
                    align,
                    rankDir: rankdir,
                    nodeSep: nodesep,
                    edgeSep: edgesep,
                    rankSep: ranksep
                }
            },
            subScene: {
                meta: {
                    paddingTop: paddingTop || subSceneMeta?.paddingTop || 20,
                    paddingRight: paddingRight || subSceneMeta?.paddingRight || 20,
                    paddingBottom: paddingBottom || subSceneMeta?.paddingBottom || 20,
                    paddingLeft: paddingLeft || subSceneMeta?.paddingLeft || 20,
                    labelHeight: 0
                }
            },
            nodeSize: {
                meta: {
                    width: metaWidth,
                    height: metaHeight
                }
            }
        };

        // 合并用户输入的内容
        const graphSettings = mergeConfig(settings, {
            ...mergeConfig(graphMetaConfig, LAYOUT_CONFIG)
        });
        self.graphSettings = graphSettings;

        return {
            graphDef,
            graphOption,
            graphSettings
        };
    }

    /** 更新节点与边位置 */
    private updatePosition(flattenedGraph: HierarchyFlattenedGraphInfo): void {
        const { nodes, edges } = flattenedGraph;
        this.updateNodePosition(nodes, edges);
        this.updateEdgePosition(nodes, edges);
    }

    private getBegin(
        flattenedNodes: (HierarchyBaseNodeInfo | HierarchyGraphNodeInfo)[],
        flattenedEdges: HierarchyBaseEdgeInfo[]
    ): PointTuple {
        const self = this;
        const { begin } = self;

        const dBegin: PointTuple = [0, 0];
        if (begin) {
            let minX = Infinity;
            let minY = Infinity;
            flattenedNodes.forEach((node) => {
                if (minX > node.x) minX = node.x;
                if (minY > node.y) minY = node.y;
            });
            flattenedEdges.forEach((edge) => {
                edge.points.forEach((point) => {
                    if (minX > point.x) minX = point.x;
                    if (minY > point.y) minY = point.y;
                });
            });
            dBegin[0] = begin[0] - minX;
            dBegin[1] = begin[1] - minY;
        }
        return dBegin;
    }

    private updateNodePosition(
        flattenedNodes: (HierarchyBaseNodeInfo | HierarchyGraphNodeInfo)[],
        flattenedEdges: HierarchyBaseEdgeInfo[]
    ): void {
        const self = this;
        const { combos, nodes, edges, anchorPoint, graphSettings } = self;
        const dBegin = this.getBegin(flattenedNodes, flattenedEdges);

        flattenedNodes.forEach((node) => {
            const { x, y, id, type, coreBox } = node;
            if (type === HierarchyNodeType.META && id !== ROOT_NAME) {
                const i = combos.findIndex((item) => item.id === id);
                const subSceneMeta = graphSettings?.subScene?.meta;
                // 将布局生成的 combo 位置暂存至 offsetX offsetY
                combos[i].offsetX = x + dBegin[0];
                combos[i].offsetY = y + dBegin[1];
                combos[i].fixSize = [coreBox.width, coreBox.height];
                combos[i].fixCollapseSize = [coreBox.width, coreBox.height];
                // 如果设置了收起时隐藏 padding，则手动优化 combo padding 信息，展开的话则恢复
                if (!node.expanded) {
                    combos[i].padding = [0, 0, 0, 0];
                } else {
                    combos[i].padding = [
                        subSceneMeta?.paddingTop!,
                        subSceneMeta?.paddingRight!,
                        subSceneMeta?.paddingBottom!,
                        subSceneMeta?.paddingLeft!
                    ];
                }
            } else if (type === HierarchyNodeType.OP) {
                const i = nodes.findIndex((item) => item.id === id);
                nodes[i].x = x + dBegin[0];
                nodes[i].y = y + dBegin[1];

                if (anchorPoint) {
                    const anchorPoints: [number, number][] = [];
                    const outEdges = flattenedEdges.filter((e) => e.v === id);
                    const inEdges = flattenedEdges.filter((e) => e.w === id);
                    // 指定出边锚点，锚点中心点为 [0.5, 0.5]
                    if (outEdges.length > 0) {
                        outEdges.forEach((outEdge) => {
                            const firstPoint = outEdge.points[0];
                            const anchorPointX = (firstPoint.x - x) / node.width + 0.5;
                            const anchorPointY = (firstPoint.y - y) / node.height + 0.5;
                            anchorPoints.push([anchorPointX, anchorPointY]);
                            // 出边对应 source 边锚点
                            outEdge.baseEdgeList.forEach((baseEdge) => {
                                const edge = edges.find((e) => e.source === baseEdge.v && e.target === baseEdge.w);
                                if (edge) {
                                    edge.sourceAnchor = anchorPoints.length - 1;
                                }
                            });
                        });
                    }
                    // 指定入边锚点
                    if (inEdges.length > 0) {
                        inEdges.forEach((inEdge) => {
                            const lastPoint = inEdge.points[inEdge.points.length - 1];
                            const anchorPointX = (lastPoint.x - x) / node.width + 0.5;
                            const anchorPointY = (lastPoint.y - y) / node.height + 0.5;
                            anchorPoints.push([anchorPointX, anchorPointY]);
                            // 出边对应 source 锚点
                            inEdge.baseEdgeList.forEach((baseEdge) => {
                                const edge = edges.find((e) => e.source === baseEdge.v && e.target === baseEdge.w);
                                if (edge) {
                                    edge.targetAnchor = anchorPoints.length - 1;
                                }
                            });
                        });
                    }
                    nodes[i].anchorPoints = anchorPoints.length > 0 ? anchorPoints : nodes[i].anchorPoints || [];
                }
            }
        });
    }

    private updateEdgePosition(
        flattenedNodes: (HierarchyBaseNodeInfo | HierarchyGraphNodeInfo)[],
        flattenedEdges: HierarchyBaseEdgeInfo[]
    ): void {
        const self = this;
        const { combos, edges, controlPoints } = self;
        const dBegin = this.getBegin(flattenedNodes, flattenedEdges);

        if (controlPoints) {
            combos.forEach((combo) => {
                combo.inEdges = [];
                combo.outEdges = [];
            });
            edges.forEach((sourceEdge) => {
                let sourceNode = flattenedNodes.find((v) => v.id === sourceEdge.source);
                let targetNode = flattenedNodes.find((v) => v.id === sourceEdge.target);
                // Combo 收起状态，dagre-compound 不会渲染该节点，边需要使用到 group 的边作为补充
                let points: Point[] = [];
                let sortedEdges: HierarchyBaseEdgeInfo[] = [];
                if (sourceNode && targetNode) {
                    sortedEdges = getEdges(sourceNode?.id, targetNode?.id, flattenedNodes);
                } else if (!sourceNode || !targetNode) {
                    /** 存在收起节点时，需要重新计算边的 controlPoints，确保线正常 */
                        // 情况1：目标节点被收起了，向上寻找该节点最近一个存在的父节点
                    const sourceNodePath = self.getNodePath(sourceEdge.source);
                    const targetNodePath = self.getNodePath(sourceEdge.target);

                    const lastExistingSource = sourceNodePath
                        .reverse()
                        .slice(!sourceNode ? 1 : 0)
                        .find((parentId) => flattenedNodes.find((fNode) => fNode.id === parentId));
                    const lastExistingTarget = targetNodePath
                        .reverse()
                        .slice(!targetNode ? 1 : 0)
                        .find((parentId) => flattenedNodes.find((fNode) => fNode.id === parentId));
                    sourceNode = flattenedNodes.find((v) => v.id === lastExistingSource);
                    targetNode = flattenedNodes.find((v) => v.id === lastExistingTarget);
                    sortedEdges = getEdges(sourceNode?.id, targetNode?.id, flattenedNodes, { v: sourceEdge.source, w: sourceEdge.target });
                }

                points = sortedEdges.reduce((pre, cur) => {
                    return [
                        ...pre,
                        ...cur.points.map((p) => {
                            return {
                                ...p,
                                x: p.x + dBegin[0],
                                y: p.y + dBegin[1]
                            };
                        })
                    ];
                }, [] as IPoint[]);
                // 取消首尾节点
                points = points.slice(1, -1);
                sourceEdge.controlPoints = points;

                if (targetNode?.type === NodeType.META) {
                    // combo 节点控制点
                    const i = combos.findIndex((item) => item.id === targetNode?.id);
                    if (!combos[i] || combos[i].inEdges?.some((inEdge) => inEdge.source === sourceNode!.id && inEdge.target === targetNode!.id)) {
                        return;
                    }
                    combos[i].inEdges?.push({
                        source: sourceNode!.id,
                        target: targetNode!.id,
                        controlPoints: points
                    });
                }
                if (sourceNode?.type === NodeType.META) {
                    const i = combos.findIndex((item) => item.id === sourceNode?.id);
                    if (!combos[i] || combos[i].outEdges?.some((oedge) => oedge.source === sourceNode!.id && oedge.target === targetNode!.id)) {
                        return;
                    }
                    combos[i].outEdges?.push({
                        source: sourceNode!.id,
                        target: targetNode!.id,
                        controlPoints: points
                    });
                }
            });
        }
    }

    public getType() {
        return 'dagreCompound';
    }

    /**
     * 确保布局使用的数据与用户输入数据顺序一致
     * 通过 layoutOrder 排序 节点 与 边
     * @param list
     * @private
     */
    private getDataByOrder(list: any[]):  any[] {
        if (list.every((n) => n.layoutOrder !== undefined)) {
            // 所有数据均设置过索引，表示仅布局，数据未变化，无需处理
        } else {
            // 首次布局或动态添加删减节点时重新赋值
            list.forEach((n, i) => {
                n.layoutOrder = i;
            });
        }
        // 按照 layoutOrder 排序
        return list.sort((pre, cur) => pre.layoutOrder - cur.layoutOrder);
    }
}
