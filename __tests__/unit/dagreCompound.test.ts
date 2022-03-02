import { Layouts } from "../../src";
import { mathEqual } from "../util";

const data: any = {
    nodes: [
        {
            id: 'A',
            label: 'A'
        },
        {
            id: 'B',
            label: 'B',
            comboId: 'GROUP4'
        },
        {
            id: 'C',
            label: 'C',
            comboId: 'GROUP1'
        },
        {
            id: 'D',
            label: 'D',
            comboId: 'GROUP1'
        },
        {
            id: 'E',
            label: 'E',
            comboId: 'GROUP1'
        },
        {
            id: 'F',
            label: 'F',
            comboId: 'GROUP1'
        },
        {
            id: 'G',
            label: 'G',
            comboId: 'GROUP0'
        }
    ],
    edges: [
        {
            source: 'A',
            target: 'B'
        },
        {
            source: 'A',
            target: 'G'
        },
        {
            source: 'B',
            target: 'C'
        },
        {
            source: 'B',
            target: 'D'
        },
        {
            source: 'B',
            target: 'E'
        },
        {
            source: 'B',
            target: 'F'
        }
    ],
    combos: [
        { id: 'GROUP2', label: 'GROUP2' },
        { id: 'GROUP1', label: 'GROUP1', parentId: 'GROUP2' },
        { id: 'GROUP0', label: 'GROUP0', parentId: 'GROUP2' },
        { id: 'GROUP4', label: 'GROUP4', parentId: 'GROUP0' }
    ]
};

describe('#DagreCompoundLayout', () => {
    it('return correct default config', () => {
        const dagreCompound = new Layouts['dagreCompound']();
        expect(dagreCompound.getDefaultCfg()).toEqual({
            rankdir: 'TB', // layout 方向, 可选 TB, BT, LR, RL
            align: undefined, // 节点对齐方式，可选 UL, UR, DL, DR
            begin: undefined, // 布局的起始（左上角）位置
            nodeSize: undefined, // 节点大小
            nodesep: 50, // 节点水平间距(px)
            ranksep: 50, // 每一层节点之间间距
            controlPoints: true, // 是否保留布局连线的控制点
            anchorPoint: true // 是否使用布局计算的锚点
        });
        dagreCompound.layout(data);
        expect((data.nodes[1] as any).layoutOrder).toBe(1); // layoutOrder should be initialized
        expect((data.nodes[2] as any).layoutOrder).toBe(2);
        expect((data.nodes[0] as any).x).not.toBe(undefined);
        expect((data.nodes[0] as any).y).not.toBe(undefined);
    });

    it('dagre-compound with number nodeSize', () => {
        // @ts-ignore
        data.edges.forEach((edgeItem) => {
            delete edgeItem.startPoint;
            delete edgeItem.endPoint;
            delete edgeItem.controlPoints;
        });
        const dagreCompound = new Layouts['dagreCompound']({
            rankdir: 'LR',
            controlPoints: false,
            nodeSize: 30
        });
        dagreCompound.layout(data);

        const node = data.nodes[0];
        const edge = data.edges[0];

        expect(mathEqual(node.x, 15)).toEqual(true);
        expect(mathEqual(node.y, 175)).toEqual(true);
        expect(edge.controlPoints).toBe(undefined);
    });

    it('dagre-compound with array nodeSize', () => {
        // @ts-ignore
        data.edges.forEach((edgeItem) => {
            delete edgeItem.startPoint;
            delete edgeItem.endPoint;
            delete edgeItem.controlPoints;
        });
        const dagreCompound = new Layouts['dagreCompound']({
            rankdir: 'LR',
            controlPoints: true,
            nodeSize: [100, 50]
        });
        dagreCompound.layout(data);

        const node = data.nodes[0];
        const edge = data.edges[0];
        expect(mathEqual(node.x, 50)).toEqual(true);
        expect(mathEqual(node.y, 215)).toEqual(true);
        expect(edge.controlPoints).not.toBe(undefined);
    });

    it('dagre-compound with array size in node data', () => {
        // @ts-ignore
        data.edges.forEach((edgeItem) => {
            delete edgeItem.startPoint;
            delete edgeItem.endPoint;
            delete edgeItem.controlPoints;
        });
        // @ts-ignore
        data.nodes.forEach((node) => {
            node.size = [100, 70];
        });
        const dagreCompound = new Layouts['dagreCompound']({
            rankdir: 'LR',
            controlPoints: false
        });
        dagreCompound.layout(data);
        const node = data.nodes[0];
        const edge = data.edges[0];
        expect(mathEqual(node.x, 50)).toEqual(true);
        expect(mathEqual(node.y, 255)).toEqual(true);
        expect(edge.controlPoints).toEqual(undefined);
    });

    it('dagre-compound node should be aligned', () => {
        const dagreCompound = new Layouts['dagreCompound']({
            rankdir: 'LR',
        });
        dagreCompound.layout(data);
        // test B inside combo GROUP4
        // G is aligned with B/GROUP4
        const node = data.nodes[1]; // B
        const nodeG = data.nodes[6]; // G
        const combo = data.combos[3];
        expect(mathEqual(node.x, combo.offsetX)).toEqual(true);
        expect(mathEqual(node.x, nodeG.x)).toEqual(true);
    });
});
