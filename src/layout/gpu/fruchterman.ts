// @ts-nocheck
/**
 * @fileOverview fruchterman layout
 * @author shiwu.wyy@antfin.com
 */

import { OutNode, Edge, PointTuple, IndexMap } from "../types";
import { Base } from "../base";
import { isNumber } from "../../util";
// @ts-ignore
import { World } from "@antv/g-webgpu";
// compile at runtime in dev mode
// @ts-ignore
// import { Compiler } from '@antv/g-webgpu-compiler'
// import { fruchtermanCode, clusterCode } from './fruchtermanShader'
import { buildTextureData, attributesToTextureData } from "../../util/gpu";
// use compiled bundle in prod mode
import { fruchtermanBundle, clusterBundle } from "./fruchtermanShader";
import { LAYOUT_MESSAGE } from "../worker/layoutConst";

type INode = OutNode & {
  cluster: string | number;
};

type NodeMap = {
  [key: string]: INode;
};

/**
 * fruchterman 布局
 */
export class FruchtermanGPULayout extends Base {
  /** 布局中心 */
  public center: PointTuple;

  /** 停止迭代的最大迭代数 */
  public maxIteration: number = 1000;

  /** 重力大小，影响图的紧凑程度 */
  public gravity: number = 10;

  /** 速度 */
  public speed: number = 1;

  /** 是否产生聚类力 */
  public clustering: boolean = false;

  /** 根据哪个字段聚类 */
  public clusterField: string = "cluster";

  /** 聚类力大小 */
  public clusterGravity: number = 10;

  /** 是否启用web worker。前提是在web worker里执行布局，否则无效	*/
  public workerEnabled: boolean = false;

  public nodes: INode[] = [];

  public edges: Edge[] = [];

  public width: number = 300;

  public height: number = 300;

  public nodeMap: NodeMap = {};

  public nodeIdxMap: IndexMap = {};

  public canvasEl: HTMLCanvasElement;

  public onLayoutEnd: () => void;

  constructor(options?: FruchtermanGPULayout.FruchtermanGPULayoutOptions) {
    super();
    this.updateCfg(options);
  }

  public getDefaultCfg() {
    return {
      maxIteration: 1000,
      gravity: 10,
      speed: 1,
      clustering: false,
      clusterGravity: 10
    };
  }

  /**
   * 执行布局
   */
  public async execute() {
    const self = this;
    const nodes = self.nodes;

    if (!nodes || nodes.length === 0) {
      if (self.onLayoutEnd) self.onLayoutEnd();
      return;
    }
    if (!self.width && typeof window !== "undefined") {
      self.width = window.innerWidth;
    }
    if (!self.height && typeof window !== "undefined") {
      self.height = window.innerHeight;
    }
    if (!self.center) {
      self.center = [self.width / 2, self.height / 2];
    }
    const center = self.center;
    if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      if (self.onLayoutEnd) self.onLayoutEnd();
      return;
    }
    const nodeMap: NodeMap = {};
    const nodeIdxMap: IndexMap = {};
    nodes.forEach((node, i) => {
      if (!isNumber(node.x)) node.x = Math.random() * this.width;
      if (!isNumber(node.y)) node.y = Math.random() * this.height;
      nodeMap[node.id] = node;
      nodeIdxMap[node.id] = i;
    });
    self.nodeMap = nodeMap;
    self.nodeIdxMap = nodeIdxMap;
    // layout
    await self.run();
  }

  public async executeWithWorker(canvas?: HTMLCanvasElement, ctx?: any) {
    const self = this;
    const nodes = self.nodes;
    const center = self.center;

    if (!nodes || nodes.length === 0) {
      return;
    }
    if (nodes.length === 1) {
      nodes[0].x = center[0];
      nodes[0].y = center[1];
      return;
    }
    const nodeMap: NodeMap = {};
    const nodeIdxMap: IndexMap = {};
    nodes.forEach((node, i) => {
      if (!isNumber(node.x)) node.x = Math.random() * this.width;
      if (!isNumber(node.y)) node.y = Math.random() * this.height;
      nodeMap[node.id] = node;
      nodeIdxMap[node.id] = i;
    });
    self.nodeMap = nodeMap;
    self.nodeIdxMap = nodeIdxMap;
    // layout
    await self.run(canvas, ctx);
  }

  public async run(canvas?: HTMLCanvasElement, ctx?: any) {
    const self = this;
    const nodes = self.nodes;
    const edges = self.edges;
    const maxIteration = self.maxIteration;
    const center = self.center;
    const area = self.height * self.width;
    let maxDisplace = Math.sqrt(area) / 10;
    const k2 = area / (nodes.length + 1);
    const k = Math.sqrt(k2);
    const speed = self.speed;
    const clustering = self.clustering;

    const {
      array: attributeArray,
      count: clusterCount
    } = attributesToTextureData([self.clusterField], nodes);

    const numParticles = nodes.length;
    const { maxEdgePerVetex, array: nodesEdgesArray } = buildTextureData(
      nodes,
      edges
    );

    const workerEnabled = self.workerEnabled;

    let world;

    if (workerEnabled) {
      world = World.create({
        canvas,
        engineOptions: {
          supportCompute: true
        }
      });
    } else {
      world = World.create({
        engineOptions: {
          supportCompute: true
        }
      });
    }

    // compile at runtime in dev mode
    // const compiler = new Compiler()
    // const fruchtermanBundle = compiler.compileBundle(fruchtermanCode)
    // const clusterBundle = compiler.compileBundle(clusterCode)

    // use compiled bundle in prod mode
    // console.log(fruchtermanBundle.toString())
    // console.log(clusterBundle.toString())

    const onLayoutEnd = self.onLayoutEnd;

    const clusterCenters = [];
    for (let i = 0; i < clusterCount; i++) {
      clusterCenters.push(0, 0, 0, 0);
    }

    const kernelFruchterman = world
      .createKernel(fruchtermanBundle)
      .setDispatch([numParticles, 1, 1])
      .setBinding({
        u_Data: nodesEdgesArray,
        u_K: k,
        u_K2: k2,
        u_Gravity: self.gravity,
        u_ClusterGravity: self.clusterGravity || self.gravity || 1,
        u_Speed: speed,
        u_MaxDisplace: maxDisplace,
        u_Clustering: clustering ? 1 : 0,
        u_Center: center,
        u_AttributeArray: attributeArray,
        u_ClusterCenters: clusterCenters,
        MAX_EDGE_PER_VERTEX: maxEdgePerVetex,
        VERTEX_COUNT: numParticles
      });

    let kernelCluster: any;
    if (clustering) {
      kernelCluster = world
        .createKernel(clusterBundle)
        .setDispatch([clusterCount, 1, 1])
        .setBinding({
          u_Data: nodesEdgesArray,
          u_NodeAttributes: attributeArray,
          u_ClusterCenters: clusterCenters,
          VERTEX_COUNT: numParticles,
          CLUSTER_COUNT: clusterCount
        });
    }

    const execute = async () => {
      for (let i = 0; i < maxIteration; i++) {
        // eslint-disable-next-line no-await-in-loop
        await kernelFruchterman.execute();

        if (clustering) {
          kernelCluster.setBinding({
            u_Data: kernelFruchterman
          });
          // eslint-disable-next-line no-await-in-loop
          await kernelCluster.execute();
          kernelFruchterman.setBinding({
            u_ClusterCenters: kernelCluster
          });
        }

        kernelFruchterman.setBinding({
          u_MaxDisplace: maxDisplace *= 0.99
        });
      }

      const finalParticleData = await kernelFruchterman.getOutput();

      if (canvas) {
        // 传递数据给主线程
        ctx.postMessage({
          type: LAYOUT_MESSAGE.GPUEND,
          vertexEdgeData: finalParticleData
          // edgeIndexBufferData,
        });
      } else {
        nodes.forEach((node, i) => {
          const x = finalParticleData[4 * i];
          const y = finalParticleData[4 * i + 1];
          node.x = x;
          node.y = y;
        });
      }
      if (onLayoutEnd) onLayoutEnd();
    };

    await execute();
  }

  public getType() {
    return "fruchterman-gpu";
  }
}

export namespace FruchtermanGPULayout {
  export interface FruchtermanGPULayoutOptions {
    type: "fruchterman-gpu";
    center?: PointTuple;
    width?: number;
    height?: number;
    maxIteration?: number;
    gravity?: number;
    speed?: number;
    clustering?: boolean;
    clusterGravity?: number;
    workerEnabled?: boolean;
    gpuEnabled?: boolean;
    onLayoutEnd?: () => void;
  }
}
