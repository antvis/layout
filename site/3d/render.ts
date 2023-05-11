import { Canvas, Line } from "@antv/g";
import { DirectionalLight, Mesh, MeshPhongMaterial, SphereGeometry } from "@antv/g-plugin-3d";

export function render(
  canvas: Canvas,
  device: any,
  nodes: number[],
  edges: number[],
  scaling: number
) {
  // clear
  canvas.document.documentElement.removeChildren();

  // add a directional light into scene
  const light = new DirectionalLight({
    // @ts-ignore
    style: {
      fill: 'white',
      direction: [-1, 0, 1],
      // intensity
    },
  });
  canvas.appendChild(light);

  // if (!canvas.sphereGeometry) {
    // create a sphere geometry
    const sphereGeometry = new SphereGeometry(device, {
      radius: 10,
      latitudeBands: 32,
      longitudeBands: 32,
    });
  //   canvas.sphereGeometry = sphereGeometry;
  // }

  // if (!canvas.material) {
    // create a material with Phong lighting model
    const material = new MeshPhongMaterial(device, {
      shininess: 30,
    });
  //   canvas.material = material;
  // }

  for (let i = 0; i < edges.length; i += 6) {
    const line = new Line({
      style: {
        x1: edges[i],
        y1: edges[i + 1],
        z1: edges[i + 2],
        x2: edges[i + 3],
        y2: edges[i + 4],
        z2: edges[i + 5],
        lineWidth: 1,
        stroke: "grey",
        isBillboard: true,
      },
    });
    canvas.appendChild(line);
  }
  for (let i = 0; i < nodes.length; i += 3) {
    const sphere = new Mesh({
      style: {
        // x: node.data.x,
        // y: node.data.y,
        // z: node.data.z,
        fill: 'red',
        opacity: 1,
        geometry: sphereGeometry,
        material,
        cursor: 'pointer',
      },
    });

    sphere.setPosition(nodes[i], nodes[i + 1], nodes[i + 2]);
    canvas.appendChild(sphere);
  }
}