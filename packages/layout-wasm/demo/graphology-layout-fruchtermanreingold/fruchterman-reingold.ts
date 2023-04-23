import { FruchtermanReingoldLayoutBaseOptions } from "./utils";

export function fruchtermanReingoldImpl(
  order: number,
  EdgeMatrix: Float32Array,
  options: FruchtermanReingoldLayoutBaseOptions,
  cb?: (layout: Float32Array, i: number) => void
): Float32Array {
  /**
   * Calculate the length of a vector with arbitrary dimensions.
   *
   * @param {number[]} v
   * @return {*}  {number}
   */
  const lengthVector = (v: number[]): number =>
    Math.sqrt(v.reduce((prev, cur) => prev + cur * cur, 0));

  const w = options.width; // { W and L are the width and length of the frame }
  const l = options.height;

  const area = w * l;
  const k = options.C * Math.sqrt(area / (order + 1));

  const fa = (d: number) => (d * d) / k;
  const fr = (d: number) => (k * k) / d;

  const positions = new Float32Array(order * 2).map((_, i) =>
    i % 2 === 0
      ? (Math.random() * w - w / 2) / 2
      : (Math.random() * l - l / 2) / 2
  );

  let t = w / 10.0;
  const cool = (t: number) => t / (options.iterations + 1.0); // ? maybe better cooling function eg quenching and simmering

  for (let i = 0; i < options.iterations; i++) {
    const displacements = [] as number[][];

    // { calculate repulsive forces }
    for (let v = 0; v < order; v++) {
      const vBaseIndex = v * 2;
      const vPos = [positions[vBaseIndex + 0], positions[vBaseIndex + 1]];
      displacements[v] = [0, 0];

      for (let u = 0; u < order; u++) {
        const uBaseIndex = v * 2;
        const uPos = [positions[uBaseIndex + 0], positions[uBaseIndex + 1]];

        if (v !== u) {
          const d = [vPos[0] - uPos[0], vPos[1] - uPos[1]];

          const delta = lengthVector(d);

          // Nodes that are far apart (1000 * k) are not worth computing
          if (delta !== 0 || delta > 1000 * k) {
            const force = fr(delta);

            displacements[v][0] += (d[0] / delta) * force;
            displacements[v][1] += (d[1] / delta) * force;
          }
        }
      }
    }

    // { calculate attractive forces }
    for (let e = 0; e < EdgeMatrix.length / 3; e++) {
      const baseIndex = e * 3;
      const source = EdgeMatrix[baseIndex + 0];
      const sourceBaseIndex = source * 2;
      const target = EdgeMatrix[baseIndex + 1];
      const targetBaseIndex = target * 2;
      const weight = EdgeMatrix[baseIndex + 2];

      const d = [
        positions[sourceBaseIndex + 0] - positions[targetBaseIndex + 0],
        positions[sourceBaseIndex + 1] - positions[targetBaseIndex + 1],
      ];

      const delta = lengthVector(d);

      // Nodes that are far apart (1000 * k) are not worth computing
      if (delta !== 0 || delta > 1000 * k) {
        const force = fa(delta);
        const scaleByWeight = Math.pow(weight, options.edgeWeightInfluence);

        displacements[source][0] -= (d[0] / delta) * force * scaleByWeight;
        displacements[source][1] -= (d[1] / delta) * force * scaleByWeight;
        displacements[target][0] += (d[0] / delta) * force * scaleByWeight;
        displacements[target][1] += (d[1] / delta) * force * scaleByWeight;
      }
    }

    // { limit the maximum displacement to the temperature t }
    // { and then prevent from being displaced outside frame }
    // Also apply some gravity and speed (not standard furchterman reingold)
    for (let v = 0; v < order; v++) {
      const vBaseIndex = v * 2;
      const vPos = [positions[vBaseIndex + 0], positions[vBaseIndex + 1]];
      const d = displacements[v];

      // Gravity
      const diffFromCenter = lengthVector(vPos);
      const gravityForce = 0.01 * k * options.gravity * diffFromCenter;
      d[0] -= (gravityForce * vPos[0]) / diffFromCenter;
      d[1] -= (gravityForce * vPos[1]) / diffFromCenter;

      // Speed
      d[0] *= options.speed;
      d[1] *= options.speed;

      const delta = lengthVector(d);

      if (delta !== 0) {
        // limit the maximum displacement to the temperature t * speed
        const maxDisplacement = Math.min(delta, t * options.speed);

        // Apply displacement
        const x = vPos[0] + (d[0] / delta) * maxDisplacement;
        const y = vPos[1] + (d[1] / delta) * maxDisplacement;

        // prevent from being displaced outside frame
        positions[vBaseIndex + 0] = Math.min(w / 2, Math.max(-w / 2, x));
        positions[vBaseIndex + 1] = Math.min(l / 2, Math.max(-l / 2, y));
      }
    }

    t = cool(t);

    if (i === options.iterations - 1 || (i % options.skipUpdates) + 1 === 0) {
      cb?.(positions, i);
    }
  }

  return positions;
}
