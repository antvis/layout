import { render } from "./render";
import {
  antvlayout as antvlayoutDagre,
  antvlayoutWASM as antvlayoutWASMDagre,
} from "./dagre";
import { loadDatasets } from "../datasets";
import { CommonDagreLayoutOptions, CommonLayoutOptions, TestName } from "../types";
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
  // {
  //   name: TestName.ANTV_LAYOUT_WASM_MULTITHREADS,
  // },
];

const $mask = document.getElementById("mask") as HTMLSelectElement;
const $ranksep = document.getElementById("ranksep") as HTMLInputElement;
const $nodesep = document.getElementById("nodesep") as HTMLInputElement;
const $rankdir = document.getElementById("rankdir") as HTMLSelectElement;
const $align = document.getElementById("align") as HTMLSelectElement;
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
  options: CommonDagreLayoutOptions,
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
      name: TestName.ANTV_LAYOUT,
      methods: {
        dagre: antvlayoutDagre,
      },
    },
    {
      name: TestName.ANTV_LAYOUT_WASM_SINGLETHREAD,
      methods: {
        dagre: antvlayoutWASMDagre,
      },
    },
    // {
    //   name: TestName.ANTV_LAYOUT_WASM_MULTITHREADS,
    //   methods: {
    //     dagre: antvlayoutWASMDagre,
    //   },
    // },
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
              rankdir: $rankdir.value as any,
              align: $align.value as any,
              ranksep: $ranksep.valueAsNumber,
              nodesep: $nodesep.valueAsNumber,
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
