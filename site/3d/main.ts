import { Canvas } from '@antv/g';
import { Renderer } from '@antv/g-webgl';
import { Plugin as Plugin3D } from '@antv/g-plugin-3d';
import { Plugin as PluginControl } from '@antv/g-plugin-control';
import { render } from "./render";
import {
  antvlayout as antvlayoutForceatlas2,
  antvlayoutWASM as antvlayoutWASMForceatlas2,
} from "./forceatlas2";
import {
  antvlayout as antvlayoutForce2,
  antvlayoutWASM as antvlayoutWASMForce2,
} from "./force2";
import {
  antvlayout as antvlayoutFruchterman,
  antvlayoutWASM as antvlayoutWASMFruchterman,
} from "./fruchterman";
import { loadDatasets } from "../datasets";
import { CommonLayoutOptions, TestName } from "../types";
import { initThreads } from "../../packages/layout-wasm";

/**
 * We compare graphology, @antv/layout and its WASM versions.
 */
const TestsConfig = [
  {
    name: TestName.ANTV_LAYOUT,
  },
  {
    name: TestName.ANTV_LAYOUT_WASM_SINGLETHREAD,
  },
  {
    name: TestName.ANTV_LAYOUT_WASM_MULTITHREADS,
  },
];

const $mask = document.getElementById("mask") as HTMLSelectElement;
const $iterations = document.getElementById("iterations") as HTMLInputElement;
const $min_movement = document.getElementById(
  "min_movement"
) as HTMLInputElement;
const $distance_threshold_mode = document.getElementById(
  "distance_threshold_mode"
) as HTMLInputElement;
const $dataset = document.getElementById("dataset") as HTMLSelectElement;
const $datasetDesc = document.getElementById("dataset-desc") as HTMLSpanElement;
const $layout = document.getElementById("layout") as HTMLSelectElement;
const $run = document.getElementById("run") as HTMLButtonElement;
const $canvases = TestsConfig.map(({ name }) => {
  return (document.getElementById(name) as HTMLCanvasElement);
});
const canvasesAndRenderers = $canvases.map<[Canvas, Renderer]>(($canvas) => {
  const renderer = new Renderer();
  const plugin3d = new Plugin3D();
  const pluginControl = new PluginControl();
  renderer.registerPlugin(plugin3d);
  renderer.registerPlugin(pluginControl);
  const canvas = new Canvas({
    // @ts-ignore
    canvas: $canvas,
    renderer,
  });

  // adjust camera's position
  const camera = canvas.getCamera();
  camera.setPerspective(0.1, 5000, 45, 1);
  return [canvas, renderer];
});
const $labels = TestsConfig.map((_, i) => {
  return $canvases[i].parentElement!.querySelector("span");
});
const $checkboxes = TestsConfig.map(({ name }, i) => {
  const $checkbox = document.getElementById(
    name + "_checkbox"
  ) as HTMLInputElement;
  $checkbox.onchange = () => {
    $canvases[i].parentElement!.style.display = $checkbox.checked
      ? "block"
      : "none";
  };
  return $checkbox;
});
const $scaling = document.getElementById("scaling") as HTMLInputElement;

const initThreadsPool = async () => {
  const singleThread = await initThreads(false);
  const multiThreads = await initThreads(true);

  return [singleThread, multiThreads];
};


const doLayout = async (
  canvas: Canvas,
  renderer: Renderer,
  $label: HTMLSpanElement,
  layout: any,
  model: any,
  options: CommonLayoutOptions,
  wasmMethod: any,
  scaling: number
) => {
  await canvas.ready;

  const plugin = renderer.getPlugin('device-renderer');
  // @ts-ignore
  const device = plugin.getDevice();

  const start = performance.now();
  const { nodes, edges } = await layout(model, options, wasmMethod);
  $label.innerHTML = `${(performance.now() - start).toFixed(2)}ms`;
  render(canvas, device, nodes, edges, scaling);
};

(async () => {
  $run.innerHTML = 'Loading...';
  $run.disabled = true;
  console.time("Load datasets");
  const datasets = await loadDatasets(3);
  $dataset.onchange = () => {
    $datasetDesc.innerHTML = datasets[$dataset.value].desc;
  };
  console.timeEnd("Load datasets");

  console.time("Init WASM threads");
  const [forceSingleThread, forceMultiThreads] = await initThreadsPool();
  console.timeEnd("Init WASM threads");
  $run.innerHTML = 'Run layouts';
  $run.disabled = false;

  const layoutConfig: any = [
    {
      name: TestName.ANTV_LAYOUT,
      methods: {
        forceatlas2: antvlayoutForceatlas2,
        force2: antvlayoutForce2,
        fruchterman: antvlayoutFruchterman,
      },
    },
    {
      name: TestName.ANTV_LAYOUT_WASM_SINGLETHREAD,
      methods: {
        forceatlas2: antvlayoutWASMForceatlas2,
        force2: antvlayoutWASMForce2,
        fruchterman: antvlayoutWASMFruchterman,
      },
    },
    {
      name: TestName.ANTV_LAYOUT_WASM_MULTITHREADS,
      methods: {
        forceatlas2: antvlayoutWASMForceatlas2,
        force2: antvlayoutWASMForce2,
        fruchterman: antvlayoutWASMFruchterman,
      },
    },
  ];

  $run.onclick = async () => {
    $mask.style.display = "flex";

    const dataset = datasets[$dataset.value];
    const layoutName = $layout.value;

    await Promise.all(
      layoutConfig.map(async ({ name, methods }: any, i: number) => {
        if (methods[layoutName] && $checkboxes[i].checked) {
          await doLayout(
            canvasesAndRenderers[i][0],
            canvasesAndRenderers[i][1],
            $labels[i]!,
            methods[layoutName],
            dataset[name],
            {
              iterations: parseInt($iterations.value),
              min_movement: parseFloat($min_movement.value),
              distance_threshold_mode: $distance_threshold_mode.value as
                | "mean"
                | "max"
                | "min",
            },
            name === TestName.ANTV_LAYOUT_WASM_MULTITHREADS
              ? forceMultiThreads
              : forceSingleThread,
            Number($scaling.value)
          );
        }
      })
    );

    $mask.style.display = "none";
  };
})();
