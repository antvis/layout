import {
  Graph,
  LayoutMapping,
  PointTuple,
  FruchtermanLayoutOptions,
  Layout,
  OutNode,
  cloneFormatData,
  IndexMap,
} from '@antv/layout';
import { WebGPUDeviceContribution, BufferUsage } from '@antv/g-device-api';
import create_quadtree from './shader/create_quadtree.wgsl';
import create_sourcelist from './shader/create_sourcelist.wgsl';
import create_targetlist from './shader/create_targetlist.wgsl';
import compute_attractive_new from './shader/compute_attractive_new.wgsl';
// import compute_forces from './shader/compute_forces.wgsl';
import compute_forcesBH from './shader/compute_forcesBH.wgsl';
import apply_forces from './shader/apply_forces.wgsl';

const DEFAULTS_LAYOUT_OPTIONS: Partial<FruchtermanLayoutOptions> = {
  maxIteration: 1000,
  gravity: 10,
  speed: 5,
  clustering: false,
  clusterGravity: 10,
  width: 300,
  height: 300,
  nodeClusterBy: 'cluster',
};
// const SPEED_DIVISOR = 800;

interface FormattedOptions extends FruchtermanLayoutOptions {
  width: number;
  height: number;
  center: PointTuple;
  maxIteration: number;
  nodeClusterBy: string;
  gravity: number;
  speed: number;
}

/**
 * Layout with fructherman force model
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new FruchtermanLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new FruchtermanLayout({ center: [100, 100] });
 * const positions = await layout.execute(graph, { center: [100, 100] }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { center: [100, 100] });
 */
export class FruchtermanLayout implements Layout<FruchtermanLayoutOptions> {
  id = 'fruchtermanWebGPU';

  constructor(
    public options: FruchtermanLayoutOptions = {} as FruchtermanLayoutOptions,
  ) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: Graph, options?: FruchtermanLayoutOptions) {
    return this.genericFruchtermanLayout(false, graph, options);
  }
  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: Graph, options?: FruchtermanLayoutOptions) {
    this.genericFruchtermanLayout(true, graph, options);
  }

  private async genericFruchtermanLayout(
    assign: false,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericFruchtermanLayout(
    assign: true,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<void>;
  private async genericFruchtermanLayout(
    assign: boolean,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<LayoutMapping | void> {
    const formattedOptions = this.formatOptions(options);
    const {
      width,
      height,
      center,
      clustering,
      clusterGravity,
      nodeClusterBy,
      maxIteration,
      gravity,
      speed,
    } = formattedOptions;

    let nodes = graph.getAllNodes();
    let edges = graph.getAllEdges();

    if (!nodes?.length) {
      return { nodes: [], edges };
    }

    if (nodes.length === 1) {
      if (assign) {
        graph.mergeNodeData(nodes[0].id, {
          x: center[0],
          y: center[1],
        });
      }
      return {
        nodes: [
          {
            ...nodes[0],
            data: {
              ...nodes[0].data,
              x: center[0],
              y: center[1],
            },
          },
        ],
        edges,
      };
    }

    const layoutNodes: OutNode[] = nodes.map(
      (node) => cloneFormatData(node, [width, height]) as OutNode,
    );

    // const area = height * width;
    // let maxDisplace = Math.sqrt(area) / 10;
    // const k2 = area / (layoutNodes.length + 1);
    // const k = Math.sqrt(k2);

    const nodeData: Array<number> = [];
    const edgeData: Array<number> = [];
    const sourceEdges: Array<number> = [];
    const targetEdges: Array<number> = [];
    const mapIdPos: IndexMap = {};
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      mapIdPos[n.id] = i + 1;
      if (n.data.x) {
        nodeData.push(0.0, n.data.x, n.data.y, 1.0);
      } else {
        nodeData.push(0.0, Math.random(), Math.random(), 1.0);
      }
    }
    for (let i = 0; i < edges.length; i++) {
      const source = edges[i].source;
      const target = edges[i].target;
      edgeData.push(mapIdPos[source], mapIdPos[target]);
    }
    edges.sort(function (a, b) {
      return mapIdPos[a.source] > mapIdPos[b.source]
        ? 1
        : mapIdPos[b.source] > mapIdPos[a.source]
        ? -1
        : 0;
    });
    for (let i = 0; i < edges.length; i++) {
      const source = edges[i].source;
      const target = edges[i].target;
      sourceEdges.push(mapIdPos[source], mapIdPos[target]);
    }
    edges.sort(function (a, b) {
      return mapIdPos[a.target] > mapIdPos[b.target]
        ? 1
        : mapIdPos[b.target] > mapIdPos[a.target]
        ? -1
        : 0;
    });
    for (let i = 0; i < edges.length; i++) {
      const source = edges[i].source;
      const target = edges[i].target;
      targetEdges.push(mapIdPos[source], mapIdPos[target]);
    }
    const edgeLength = edgeData.length;
    const nodeLength = nodeData.length / 4;
    let coolingFactor = 0.985;
    let l = 0.01;
    let force = 10000.0;

    const $canvas = document.createElement('canvas');
    const deviceContribution = new WebGPUDeviceContribution({});
    const swapChain = await deviceContribution.createSwapChain($canvas);
    const device = swapChain.getDevice();

    const forceDataBuffer = device.createBuffer({
      viewOrSize: new Float32Array(nodeLength * 2 * 4),
      usage: BufferUsage.STORAGE,
    });
    const quadTreeLength = nodeLength * 12 * 4;
    const quadTreeBuffer = device.createBuffer({
      viewOrSize: new Float32Array(quadTreeLength),
      usage: BufferUsage.STORAGE | BufferUsage.COPY_SRC,
    });
    const sourceEdgeBuffer = device.createBuffer({
      viewOrSize: new Uint32Array(sourceEdges),
      usage: BufferUsage.STORAGE,
    });
    const targetEdgeBuffer = device.createBuffer({
      viewOrSize: new Uint32Array(targetEdges),
      usage: BufferUsage.STORAGE,
    });
    const sourceListBuffer = device.createBuffer({
      viewOrSize: new Uint32Array(edgeLength),
      usage: BufferUsage.STORAGE,
    });
    const targetListBuffer = device.createBuffer({
      viewOrSize: new Uint32Array(edgeLength),
      usage: BufferUsage.STORAGE,
    });
    const edgeInfoBuffer = device.createBuffer({
      viewOrSize: new Float32Array(nodeLength * 4),
      usage: BufferUsage.STORAGE,
    });

    const paramsBuffer = device.createBuffer({
      viewOrSize: new Float32Array([nodeLength, edgeLength, coolingFactor, l]), // u32 * 2 + f32 * 2
      usage: BufferUsage.UNIFORM,
    });

    const rangeBuffer = device.createBuffer({
      viewOrSize: new Int32Array([0, 1000, 0, 1000]),
      usage: BufferUsage.STORAGE,
    });

    const nodeDataBuffer = device.createBuffer({
      viewOrSize: new Float32Array(nodeData),
      usage: BufferUsage.STORAGE | BufferUsage.COPY_SRC,
    });
    console.log(nodeData);

    const edgeDataBuffer = device.createBuffer({
      viewOrSize: 16,
      usage: BufferUsage.STORAGE,
    });

    const createSourceListProgram = device.createProgram({
      compute: {
        wgsl: create_sourcelist,
      },
    });
    const createSourceListPipeline = device.createComputePipeline({
      inputLayout: null,
      program: createSourceListProgram,
    });
    const createTargetListProgram = device.createProgram({
      compute: {
        wgsl: create_targetlist,
      },
    });
    const createTargetListPipeline = device.createComputePipeline({
      inputLayout: null,
      program: createTargetListProgram,
    });
    const computeAttractiveNewProgram = device.createProgram({
      compute: {
        wgsl: compute_attractive_new,
      },
    });
    const computeAttractiveNewPipeline = device.createComputePipeline({
      inputLayout: null,
      program: computeAttractiveNewProgram,
    });
    const computeForcesBHProgram = device.createProgram({
      compute: {
        wgsl: compute_forcesBH,
      },
    });
    const computeForcesBHPipeline = device.createComputePipeline({
      inputLayout: null,
      program: computeForcesBHProgram,
    });

    const createSourceListBindGroup = device.createBindings({
      pipeline: createSourceListPipeline,
      uniformBufferBindings: [
        {
          binding: 3,
          buffer: paramsBuffer,
        },
      ],
      storageBufferBindings: [
        {
          binding: 0,
          buffer: sourceEdgeBuffer,
        },
        {
          binding: 1,
          buffer: edgeInfoBuffer,
        },
        {
          binding: 2,
          buffer: sourceListBuffer,
        },
      ],
    });
    const createTargetListBindGroup = device.createBindings({
      pipeline: createTargetListPipeline,
      uniformBufferBindings: [
        {
          binding: 3,
          buffer: paramsBuffer,
        },
      ],
      storageBufferBindings: [
        {
          binding: 0,
          buffer: targetEdgeBuffer,
        },
        {
          binding: 1,
          buffer: edgeInfoBuffer,
        },
        {
          binding: 2,
          buffer: targetListBuffer,
        },
      ],
    });

    // Run create source and target lists pass
    {
      const computePass = device.createComputePass();
      computePass.setPipeline(createSourceListPipeline);
      computePass.setBindings(createSourceListBindGroup);
      computePass.dispatchWorkgroups(1, 1, 1);
      device.submitPass(computePass);
    }
    {
      const computePass = device.createComputePass();
      computePass.setPipeline(createTargetListPipeline);
      computePass.setBindings(createTargetListBindGroup);
      computePass.dispatchWorkgroups(1, 1, 1);
      device.submitPass(computePass);
    }

    const applyForcesProgram = device.createProgram({
      compute: {
        wgsl: apply_forces,
      },
    });
    const applyForcesPipeline = device.createComputePipeline({
      inputLayout: null,
      program: applyForcesProgram,
    });
    const applyBindGroup = device.createBindings({
      pipeline: applyForcesPipeline,
      uniformBufferBindings: [
        {
          binding: 2,
          buffer: paramsBuffer,
        },
      ],
      storageBufferBindings: [
        {
          binding: 0,
          buffer: nodeDataBuffer,
        },
        {
          binding: 1,
          buffer: forceDataBuffer,
        },
        {
          binding: 3,
          buffer: rangeBuffer,
        },
      ],
    });
    const createQuadTreeProgram = device.createProgram({
      compute: {
        wgsl: create_quadtree,
      },
    });
    const createQuadTreePipeline = device.createComputePipeline({
      inputLayout: null,
      program: createQuadTreeProgram,
    });
    const quadTreeBindGroup = device.createBindings({
      pipeline: createQuadTreePipeline,
      uniformBufferBindings: [
        {
          binding: 2,
          buffer: paramsBuffer,
        },
      ],
      storageBufferBindings: [
        {
          binding: 0,
          buffer: nodeDataBuffer,
        },
        {
          binding: 1,
          buffer: quadTreeBuffer,
        },
        {
          binding: 3,
          buffer: rangeBuffer,
        },
      ],
    });
    const batchBuffer = device.createBuffer({
      viewOrSize: 1 * Uint32Array.BYTES_PER_ELEMENT,
      usage: BufferUsage.UNIFORM,
    });

    const positionReadBuffer = device.createReadback();

    let iterationCount = maxIteration;
    while (iterationCount > 0 && coolingFactor > 0.0001 && force >= 0) {
      iterationCount--;

      // Set up params (node length, edge length)
      paramsBuffer.setSubData(
        0,
        new Uint8Array(
          new Float32Array([nodeLength, edgeLength, coolingFactor, l]).buffer,
        ),
      );

      {
        // Run create quadtree pass
        const computePass = device.createComputePass();
        computePass.setPipeline(createQuadTreePipeline);
        computePass.setBindings(quadTreeBindGroup);
        computePass.dispatchWorkgroups(1, 1, 1);
        device.submitPass(computePass);
      }

      const stackBuffer = device.createBuffer({
        viewOrSize: nodeLength * 1000 * 4,
        usage: GPUBufferUsage.STORAGE,
      });
      const bindGroup = device.createBindings({
        pipeline: computeForcesBHPipeline,
        uniformBufferBindings: [
          {
            binding: 2,
            buffer: paramsBuffer,
          },
        ],
        storageBufferBindings: [
          {
            binding: 0,
            buffer: nodeDataBuffer,
          },
          {
            binding: 1,
            buffer: forceDataBuffer,
          },
          {
            binding: 3,
            buffer: quadTreeBuffer,
          },
          {
            binding: 4,
            buffer: stackBuffer,
          },
          {
            binding: 5,
            buffer: batchBuffer,
          },
        ],
      });

      const attractBindGroup = device.createBindings({
        pipeline: computeAttractiveNewPipeline,
        uniformBufferBindings: [
          {
            binding: 5,
            buffer: paramsBuffer,
          },
        ],
        storageBufferBindings: [
          {
            binding: 0,
            buffer: edgeInfoBuffer,
          },
          {
            binding: 1,
            buffer: sourceListBuffer,
          },
          {
            binding: 2,
            buffer: targetListBuffer,
          },
          {
            binding: 3,
            buffer: forceDataBuffer,
          },
          {
            binding: 4,
            buffer: nodeDataBuffer,
          },
        ],
      });

      {
        // Run attract forces pass
        const computePass = device.createComputePass();
        computePass.setPipeline(computeAttractiveNewPipeline);
        computePass.setBindings(attractBindGroup);
        computePass.dispatchWorkgroups(1, 1, 1);
        device.submitPass(computePass);
      }

      // Run compute forces BH pass
      for (let i = 0; i < 1; i++) {
        batchBuffer.setSubData(0, new Uint8Array(new Uint32Array([i]).buffer));
        const computePass = device.createComputePass();
        computePass.setPipeline(computeForcesBHPipeline);
        computePass.setBindings(bindGroup);
        computePass.dispatchWorkgroups(Math.ceil(nodeLength / 1), 1, 1);
        device.submitPass(computePass);
      }

      rangeBuffer.setSubData(
        0,
        new Uint8Array(new Int32Array([0, 1000, 0, 1000]).buffer),
      );

      {
        // Run apply forces pass
        const computePass = device.createComputePass();
        computePass.setPipeline(applyForcesPipeline);
        computePass.setBindings(applyBindGroup);
        computePass.dispatchWorkgroups(Math.ceil(nodeLength / 2), 1, 1);
        device.submitPass(computePass);
      }

      stackBuffer.destroy();
      coolingFactor = coolingFactor * coolingFactor;
    }

    const result = (await positionReadBuffer.readBuffer(
      nodeDataBuffer,
    )) as Float32Array;
    console.log(result);

    const r = device.createReadback();
    const rr = (await r.readBuffer(quadTreeBuffer)) as Float32Array;
    console.log(width, height, center, rr);

    layoutNodes.forEach((node, i) => {
      node.data.x = result[4 * i + 1] * 400 + 200;
      node.data.y = result[4 * i + 2] * 400 + 200;
    });

    if (assign) {
      layoutNodes.forEach(({ id, data }) =>
        graph.mergeNodeData(id, {
          x: data.x,
          y: data.y,
        }),
      );
    }

    forceDataBuffer.destroy();
    quadTreeBuffer.destroy();
    sourceEdgeBuffer.destroy();
    targetEdgeBuffer.destroy();
    sourceListBuffer.destroy();
    targetListBuffer.destroy();
    rangeBuffer.destroy();
    nodeDataBuffer.destroy();
    edgeDataBuffer.destroy();
    edgeInfoBuffer.destroy();
    paramsBuffer.destroy();
    batchBuffer.destroy();

    applyForcesProgram.destroy();
    createQuadTreeProgram.destroy();
    createSourceListProgram.destroy();
    createTargetListProgram.destroy();
    computeAttractiveNewProgram.destroy();
    computeForcesBHProgram.destroy();

    applyForcesPipeline.destroy();
    createQuadTreePipeline.destroy();
    createSourceListPipeline.destroy();
    createTargetListPipeline.destroy();
    computeAttractiveNewPipeline.destroy();
    computeForcesBHPipeline.destroy();

    positionReadBuffer.destroy();

    device.destroy();

    return { nodes: layoutNodes, edges };
  }

  private formatOptions(
    options: FruchtermanLayoutOptions = {},
  ): FormattedOptions {
    const mergedOptions = { ...this.options, ...options } as FormattedOptions;
    const { clustering, nodeClusterBy } = mergedOptions;

    const {
      center: propsCenter,
      width: propsWidth,
      height: propsHeight,
    } = mergedOptions;
    mergedOptions.width =
      !propsWidth && typeof window !== 'undefined'
        ? window.innerWidth
        : (propsWidth as number);
    mergedOptions.height =
      !propsHeight && typeof window !== 'undefined'
        ? window.innerHeight
        : (propsHeight as number);
    mergedOptions.center = !propsCenter
      ? [mergedOptions.width / 2, mergedOptions.height / 2]
      : (propsCenter as PointTuple);

    mergedOptions.clustering = clustering && !!nodeClusterBy;

    return mergedOptions;
  }
}
