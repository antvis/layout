import { render } from "./render";
import {
  graphology as graphologyForceatlas2,
  antvlayout as antvlayoutForceatlas2,
  antvlayoutWASM as antvlayoutWASMForceatlas2,
} from "./forceatlas2";
import {
  antvlayout as antvlayoutForce2,
  antvlayoutWASM as antvlayoutWASMForce2,
} from "./force2";
import {
  graphology as graphologyFruchterman,
  antvlayout as antvlayoutFruchterman,
  antvlayoutGPU as antvlayoutGPUFruchterman,
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
    name: TestName.GRAPHOLOGY,
  },
  {
    name: TestName.ANTV_LAYOUT,
  },
  {
    name: TestName.ANTV_LAYOUT_WASM_SINGLETHREAD,
  },
  {
    name: TestName.ANTV_LAYOUT_WASM_MULTITHREADS,
  },
  {
    name: TestName.ANTV_LAYOUT_GPU,
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
const contexts = TestsConfig.map(({ name }) => {
  return (document.getElementById(name) as HTMLCanvasElement).getContext("2d");
});
const $labels = TestsConfig.map((_, i) => {
  return contexts[i]!.canvas.parentElement!.querySelector("span");
});
const $checkboxes = TestsConfig.map(({ name }, i) => {
  const $checkbox = document.getElementById(
    name + "_checkbox"
  ) as HTMLInputElement;
  $checkbox.onchange = () => {
    contexts[i]!.canvas.parentElement!.style.display = $checkbox.checked
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
  context: CanvasRenderingContext2D,
  $label: HTMLSpanElement,
  layout: any,
  model: any,
  options: CommonLayoutOptions,
  wasmMethod: any,
  scaling: number
) => {
  const start = performance.now();
  const { nodes, edges } = await layout(model, options, wasmMethod);
  $label.innerHTML = `${(performance.now() - start).toFixed(2)}ms`;
  render(context, nodes, edges, scaling);
};

(async () => {
  $run.innerHTML = 'Loading...';
  $run.disabled = true;
  console.time("Load datasets");
  const datasets = await loadDatasets();
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
      name: TestName.GRAPHOLOGY,
      methods: {
        forceatlas2: graphologyForceatlas2,
        fruchterman: graphologyFruchterman,
      },
    },
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
    {
      name: TestName.ANTV_LAYOUT_GPU,
      methods: {
        // force2: antvlayoutGPUForce2,
        fruchterman: antvlayoutGPUFruchterman,
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
            contexts[i]!,
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
        } else {
          contexts[i]!.clearRect(
            0,
            0,
            contexts[i]!.canvas.width,
            contexts[i]!.canvas.height
          );
          $labels[i]!.innerHTML = `not implemented.`;
        }
      })
    );

    $mask.style.display = "none";
  };
})();
