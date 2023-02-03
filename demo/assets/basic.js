import init, {
  ForceGraphSimulator,
} from "../../packages/layout-wasm/pkg/antv_layout_wasm.js";

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const context = canvas.getContext("2d");
const circleRadius = 5;
const lineWidth = 2;
const zoom = 1;
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const stepTime = 0.035;

await init();

let sim = new ForceGraphSimulator();

const graph = await fetch(
  "https://raw.githubusercontent.com/jsongraph/json-graph-specification/master/examples/les_miserables.json"
)
  .then((response) => response.json())
  .then((response) => response.graph);

sim.graph = graph;

// sim.graph = {
//     "nodes": {
//         "A": {},
//         "B": {},
//         "C": {}
//     },
//     "edges": [
//         {
//             "source": "A",
//             "target": "B",
//         },
//         {
//             "source": "B",
//             "target": "C"
//         },
//         {
//             "source": "C",
//             "target": "A"
//         }
//     ]
// };

sim.setDimensions(2);
sim.resetNodePlacement();

function step() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  sim.edges.forEach((edge) => {
    let source = edge.source;
    let target = edge.target;

    context.beginPath();
    context.moveTo(
      source.location[0] * zoom + centerX,
      source.location[1] * zoom + centerY
    );
    context.lineTo(
      target.location[0] * zoom + centerX,
      target.location[1] * zoom + centerY
    );
    context.lineWidth = lineWidth;
    context.strokeStyle = "grey";
    context.stroke();
  });

  sim.nodes.forEach((node) => {
    context.beginPath();
    context.arc(
      node.location[0] * zoom + centerX,
      node.location[1] * zoom + centerY,
      circleRadius,
      0,
      2 * Math.PI,
      false
    );
    context.fillStyle = "red";
    context.fill();
    context.stroke();
  });

  sim.update(stepTime);
  window.requestAnimationFrame(step);
}

window.requestAnimationFrame(step);
