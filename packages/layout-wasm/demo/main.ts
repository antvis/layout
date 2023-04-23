import "./enable-threads";
import { render } from "./render";
import {
  graphology as graphologyForceatlas2,
  antvlayout as antvlayoutForceatlas2,
  antvlayoutWASM as antvlayoutWASMForceatlas2,
} from "./forceatlas2";
import {
  antvlayout as antvlayoutForce2,
  antvlayoutGPU as antvlayoutGPUForce2,
  antvlayoutWASM as antvlayoutWASMForce2,
} from "./force2";
import {
  graphology as graphologyFruchterman,
  antvlayout as antvlayoutFruchterman,
  antvlayoutGPU as antvlayoutGPUFruchterman,
  antvlayoutWASM as antvlayoutWASMFruchterman,
} from "./fruchterman";
import { loadDatasets } from "./datasets";
import { TestName } from "./types";

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
const $dataset = document.getElementById("dataset") as HTMLSelectElement;
const $datasetDesc = document.getElementById("dataset-desc") as HTMLSpanElement;
const $layout = document.getElementById("layout") as HTMLSelectElement;
const $run = document.getElementById("run") as HTMLButtonElement;
const contexts = TestsConfig.map(({ name }) => {
  return (document.getElementById(name) as HTMLCanvasElement).getContext("2d");
});
const $labels = TestsConfig.map((_, i) => {
  return contexts[i].canvas.parentElement.querySelector("span");
});
const $checkboxes = TestsConfig.map(({ name }, i) => {
  const $checkbox = document.getElementById(
    name + "_checkbox"
  ) as HTMLInputElement;
  $checkbox.onchange = () => {
    contexts[i].canvas.parentElement.style.display = $checkbox.checked
      ? "block"
      : "none";
  };
  return $checkbox;
});

const initThreads = async () => {
  const singleThread = await (window as any).layoutWASM.initThreads(false);
  const multiThreads = await (window as any).layoutWASM.initThreads(true);

  return [singleThread, multiThreads];
};

const doLayout = async (
  context: CanvasRenderingContext2D,
  $label: HTMLSpanElement,
  layout: any,
  model: any,
  wasmMethod?: any
) => {
  const start = performance.now();
  const { nodes, edges } = await layout(model, wasmMethod);
  $label.innerHTML = `${(performance.now() - start).toFixed(2)}ms`;
  render(context, nodes, edges);
};

(async () => {
  console.time("Load datasets");
  const datasets = await loadDatasets();
  $dataset.onchange = () => {
    $datasetDesc.innerHTML = datasets[$dataset.value].desc;
  };
  console.timeEnd("Load datasets");

  console.time("Init WASM threads");
  const [forceSingleThread, forceMultiThreads] = await initThreads();
  console.timeEnd("Init WASM threads");

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
        force2: antvlayoutGPUForce2,
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
            contexts[i],
            $labels[i],
            methods[layoutName],
            name === (TestName.ANTV_LAYOUT || TestName.ANTV_LAYOUT_GPU)
              ? JSON.parse(JSON.stringify(dataset[name]))
              : dataset[name],
            name === TestName.ANTV_LAYOUT_WASM_MULTITHREADS
              ? forceMultiThreads
              : forceSingleThread
          );
        } else {
          contexts[i].clearRect(
            0,
            0,
            contexts[i].canvas.width,
            contexts[i].canvas.height
          );
          $labels[i].innerHTML = `not implemented.`;
        }
      })
    );

    $mask.style.display = "none";
  };
})();
