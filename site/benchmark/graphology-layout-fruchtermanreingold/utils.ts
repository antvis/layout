import Graph from "graphology-types";

export type LayoutMapping = { [key: string]: { x: number; y: number } };

export type EdgeMapping = {
  [key: string]: { source: string; target: string; weigth?: number };
};

/**
 * Available options for fruchterman reingold.
 *
 * @property {string="weight"} weightAttribute
 * @export
 * @interface FruchtermanReingoldLayoutOptions
 * @extends {FruchtermanReingoldLayoutBaseOptions}
 */
export interface FruchtermanReingoldLayoutOptions
  extends FruchtermanReingoldLayoutBaseOptions {
  weightAttribute: string;
}

/**
 * Available base options for fruchterman reingold.
 *
 * @property {number=10} iterations
 * @property {number=1} edgeWeightInfluence
 * @property {number=1} speed
 * @property {number=10} gravity
 * @property {number=1} C
 * @property {number=0} skipUpdates skip x updates before dispatching the next update
 *
 * @interface FruchtermanReingoldLayoutBaseOptions
 */
export interface FruchtermanReingoldLayoutBaseOptions {
  iterations: number;
  width: number;
  height: number;
  edgeWeightInfluence: number;
  speed: number;
  gravity: number;
  C: number;
  skipUpdates: number;
}

export const parseOptions = (
  options: Partial<FruchtermanReingoldLayoutOptions>
): FruchtermanReingoldLayoutBaseOptions => {
  const iterations = options?.iterations || 10;
  const edgeWeightInfluence = options?.edgeWeightInfluence || 1;
  const C = options?.C || 1;
  const speed = options?.speed || 1;
  const gravity = options?.gravity || 10;
  const skipUpdates = options?.skipUpdates || 0;
  const width = options?.width || 1;
  const height = options?.height || 1;

  return {
    iterations,
    edgeWeightInfluence,
    C,
    speed,
    gravity,
    skipUpdates,
    width,
    height,
  };
};

export const parseGraph = (
  graph: Graph,
  weightAttribute = "weight"
): [Float32Array, number, (NodeMatrix: Float32Array) => LayoutMapping] => {
  const nodeIndex = graph.nodes();
  const edges = graph.edges();
  const EdgeMatrix = graph.edges().reduce((prev, edge, i) => {
    const baseIndex = i * 3;

    prev[baseIndex + 0] = nodeIndex.indexOf(graph.source(edge));
    prev[baseIndex + 1] = nodeIndex.indexOf(graph.target(edge));
    prev[baseIndex + 2] = graph.getEdgeAttribute(edge, weightAttribute) || 1;

    return prev;
  }, new Float32Array(edges.length * 3));

  const parseLayout = (NodeMatrix: Float32Array): LayoutMapping => {
    return nodeIndex.reduce((prev, cur, i) => {
      const baseIndex = i * 2;

      return {
        ...prev,
        [cur]: {
          x: NodeMatrix[baseIndex + 0],
          y: NodeMatrix[baseIndex + 1],
        },
      };
    }, {} as LayoutMapping);
  };

  return [EdgeMatrix, nodeIndex.length, parseLayout];
};
