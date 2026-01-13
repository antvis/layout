import type { GraphLib } from '../model/data';
import type { LayoutNode, NodeData, Sorter } from '../types';

/**
 * 通用排序核心函数
 */
function sort<N extends NodeData = NodeData>(
  model: GraphLib<N>,
  compareFn: (a: LayoutNode<N>, b: LayoutNode<N>) => number,
): GraphLib<N> {
  const nodes = model.nodes();

  nodes.sort(compareFn);
  model.setNodeOrder(nodes);

  return model;
}

export function orderByDegree<N extends NodeData = NodeData>(
  model: GraphLib<N>,
  order: 'asc' | 'desc' = 'desc',
): GraphLib<N> {
  return sort(model, (nodeA, nodeB) => {
    const degreeA = model.degree(nodeA.id);
    const degreeB = model.degree(nodeB.id);
    if (order === 'asc') {
      return degreeA - degreeB; // ascending order
    }
    return degreeB - degreeA; // descending order
  });
}

/**
 * 按 ID 排序
 */
export function orderById<N extends NodeData = NodeData>(
  model: GraphLib<N>,
): GraphLib<N> {
  return sort(model, (nodeA, nodeB) => {
    const idA = nodeA.id;
    const idB = nodeB.id;

    if (typeof idA === 'number' && typeof idB === 'number') {
      return idA - idB;
    }

    return String(idA).localeCompare(String(idB));
  });
}

/**
 * 按自定义比较函数排序
 */
export function orderBySorter<N extends NodeData = NodeData>(
  model: GraphLib<N>,
  sorter: Sorter<N>,
): GraphLib<N> {
  return sort(model, (nodeA, nodeB) => {
    const a = model.originalNode(nodeA.id);
    const b = model.originalNode(nodeB.id);
    return sorter(a!, b!);
  });
}

/**
 * Order nodes according to graph topology
 */
export function orderByTopology<N extends NodeData = NodeData>(
  model: GraphLib<N>,
  directed: boolean = false,
): GraphLib<N> {
  const n = model.nodeCount();

  if (n === 0) return model;

  const nodes = model.nodes();
  const orderedNodes: LayoutNode<N>[] = [nodes[0]];
  const pickFlags: { [id: string]: boolean } = {};
  pickFlags[nodes[0].id] = true;

  let k = 0;
  let i = 0;
  model.forEachNode((node) => {
    if (i !== 0) {
      const currentDegree = model.degree(node.id, 'both');
      const nextDegree = i < n - 1 ? model.degree(nodes[i + 1].id, 'both') : 0;
      const currentNodeId = orderedNodes[k].id;
      const isNeighbor = model
        .neighbors(currentNodeId, 'both')
        .includes(node.id);

      if (
        (i === n - 1 || currentDegree !== nextDegree || isNeighbor) &&
        !pickFlags[node.id]
      ) {
        orderedNodes.push(node);
        pickFlags[node.id] = true;
        k++;
      } else {
        const children = directed
          ? model.successors(currentNodeId)
          : model.neighbors(currentNodeId);
        let foundChild = false;

        for (let j = 0; j < children.length; j++) {
          const childId = children[j];
          const child = model.node(childId);
          if (
            child &&
            model.degree(childId) === model.degree(node.id) &&
            !pickFlags[childId]
          ) {
            orderedNodes.push(child);
            pickFlags[childId] = true;
            foundChild = true;
            break;
          }
        }

        let ii = 0;
        while (!foundChild) {
          if (!pickFlags[nodes[ii].id]) {
            orderedNodes.push(nodes[ii]);
            pickFlags[nodes[ii].id] = true;
            foundChild = true;
          }
          ii++;
          if (ii === n) {
            break;
          }
        }
      }
    }
    i++;
  });

  // Update model with ordered nodes
  model.setNodeOrder(orderedNodes);

  return model;
}
