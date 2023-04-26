import Graph from "graphology-types";
import { fruchtermanReingoldImpl } from "./fruchterman-reingold";
import {
  FruchtermanReingoldLayoutOptions,
  LayoutMapping,
  parseOptions,
  parseGraph,
} from "./utils";

interface IFruchtermanReingoldLayout {
  (
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): LayoutMapping;
  assign(
    graph: Graph,
    options?: Partial<FruchtermanReingoldLayoutOptions>
  ): void;
}

function genericFruchtermanReingoldLayout(
  assign: false,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): LayoutMapping;
function genericFruchtermanReingoldLayout(
  assign: true,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): void;
function genericFruchtermanReingoldLayout(
  assign: boolean,
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
): void | LayoutMapping {
  const parsedOptions = parseOptions(options || {});
  const [EdgeMatrix, order, parseLayout] = parseGraph(
    graph,
    options?.weightAttribute
  );

  const updateCb = assign
    ? (layout: Float32Array) => {
        graph.updateEachNodeAttributes(
          (nodeKey, attr) => ({
            ...attr,
            ...parseLayout(layout)[nodeKey],
          }),
          { attributes: ["x", "y"] }
        );
      }
    : undefined;

  const positions = fruchtermanReingoldImpl(
    order,
    EdgeMatrix,
    parsedOptions,
    updateCb
  );

  if (!assign) return parseLayout(positions);
}

const fruchtermanReingoldLayout: IFruchtermanReingoldLayout = (
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
) => genericFruchtermanReingoldLayout(false, graph, options);
fruchtermanReingoldLayout.assign = (
  graph: Graph,
  options?: Partial<FruchtermanReingoldLayoutOptions>
) => genericFruchtermanReingoldLayout(true, graph, options);

export { fruchtermanReingoldLayout };
