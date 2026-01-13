import type { GraphLib } from '../../model/data';
import type {
  DisplacementMap,
  ID,
  LayoutNode,
  NodeData,
  STDSize,
} from '../../types';

const SPEED_DIVISOR = 800;

export type RadialNonoverlapForceOptions = {
  /** Focus node */
  focusNode: LayoutNode;
  /** Map of node IDs to their radial distances from the focus node */
  radiiMap: Map<ID, number>;
  /** Maximum number of iterations to run the force simulation */
  maxIteration: number;
  /** Width of the layout area */
  width: number;
  /** Repulsion constant */
  k: number;
  /** Whether to enforce strict radial positioning */
  strictRadial: boolean;
  /** Speed factor for position updates */
  speed?: number;
  /** Gravity factor pulling nodes towards their target radius */
  gravity?: number;
  /** Function to get the size of a node (includes node self and spacing) */
  nodeSizeFunc: (node: NodeData) => STDSize;
};

const DEFAULTS_LAYOUT_OPTIONS: Partial<RadialNonoverlapForceOptions> = {
  maxIteration: 10,
  width: 10,
  speed: 100,
  gravity: 10,
  k: 5,
};

export const radialNonoverlapForce = (
  model: GraphLib,
  options: RadialNonoverlapForceOptions,
) => {
  const mergedOptions = { ...DEFAULTS_LAYOUT_OPTIONS, ...options };

  const {
    maxIteration,
    width,
    k,
    speed = DEFAULTS_LAYOUT_OPTIONS.speed,
    strictRadial,
    focusNode,
    radiiMap,
    nodeSizeFunc,
  } = mergedOptions;
  const earlyStopThreshold = k * 0.002;

  const displacements: DisplacementMap = new Map();
  const maxDisplacement = width / 10;

  for (let i = 0; i < maxIteration; i++) {
    model.forEachNode((node) => {
      displacements.set(node.id, { x: 0, y: 0 });
    });

    // 给重叠的节点增加斥力
    getRepulsion(model, displacements, k, radiiMap, nodeSizeFunc);

    const avgDisplacement = updatePositions(
      model,
      displacements,
      speed!,
      strictRadial,
      focusNode,
      maxDisplacement,
      radiiMap,
    );

    if (avgDisplacement < earlyStopThreshold) {
      break;
    }
  }
};

const getRepulsion = (
  model: GraphLib,
  displacements: DisplacementMap,
  k: number,
  radiiMap: Map<ID, number>,
  nodeSizeFunc: (node: NodeData) => STDSize,
) => {
  let i = 0;

  model.forEachNode((nodeU) => {
    let j = 0;
    model.forEachNode((nodeV) => {
      if (j <= i) {
        j++;
        return;
      }

      if (nodeU.id === nodeV.id) return;

      // nodeU and nodeV are not on the same circle, return
      if (radiiMap.get(nodeU.id) !== radiiMap.get(nodeV.id)) return;

      let vecx = nodeU.x - nodeV.x;
      let vecy = nodeU.y - nodeV.y;
      let vecLength = Math.sqrt(vecx * vecx + vecy * vecy);

      // If the two nodes are exactly at the same position, we set a small distance between them
      if (vecLength === 0) {
        vecLength = 1;
        const sign = i > j ? 1 : -1;
        vecx = 0.01 * sign;
        vecy = 0.01 * sign;
      }

      const nodeSizeU = Math.max(...nodeSizeFunc(nodeU._original));
      const nodeSizeV = Math.max(...nodeSizeFunc(nodeV._original));

      // these two nodes overlap
      if (vecLength < nodeSizeV / 2 + nodeSizeU / 2) {
        const common = (k * k) / vecLength;
        const dispU = displacements.get(nodeU.id)!;
        const dispV = displacements.get(nodeV.id)!;
        const deltaX = (vecx / vecLength) * common;
        const deltaY = (vecy / vecLength) * common;
        displacements.set(nodeU.id, {
          x: dispU.x + deltaX,
          y: dispU.y + deltaY,
        });
        displacements.set(nodeV.id, {
          x: dispV.x - deltaX,
          y: dispV.y - deltaY,
        });
      }
      j++;
    });

    i++;
  });
};

const updatePositions = (
  model: GraphLib,
  displacements: DisplacementMap,
  speed: number,
  strictRadial: boolean,
  focusNode: LayoutNode,
  maxDisplacement: number,
  radiiMap: Map<ID, number>,
): number => {
  if (strictRadial) {
    model.forEachNode((node) => {
      const vx = node.x - focusNode.x;
      const vy = node.y - focusNode.y;
      const vLength = Math.sqrt(vx * vx + vy * vy);
      let vpx = vy / vLength;
      let vpy = -vx / vLength;

      const disp = displacements.get(node.id)!;
      const diLength = Math.sqrt(disp.x * disp.x + disp.y * disp.y);
      let alpha = Math.acos((vpx * disp.x + vpy * disp.y) / diLength);
      if (alpha > Math.PI / 2) {
        alpha -= Math.PI / 2;
        vpx *= -1;
        vpy *= -1;
      }
      const tdispLength = Math.cos(alpha) * diLength;
      displacements.set(node.id, {
        x: vpx * tdispLength,
        y: vpy * tdispLength,
      });
    });
  }

  // move
  let totalDisplacement = 0;
  let nodeCount = 0;

  model.forEachNode((node) => {
    if (node.id === focusNode.id) {
      return;
    }

    const disp = displacements.get(node.id)!;
    const distLength = Math.sqrt(disp.x * disp.x + disp.y * disp.y);

    if (distLength > 0) {
      const limitedDist = Math.min(
        maxDisplacement * (speed / SPEED_DIVISOR),
        distLength,
      );
      node.x += (disp.x / distLength) * limitedDist;
      node.y += (disp.y / distLength) * limitedDist;

      if (strictRadial) {
        let vx = node.x - focusNode.x;
        let vy = node.y - focusNode.y;
        const nfDis = Math.sqrt(vx * vx + vy * vy);
        vx = (vx / nfDis) * radiiMap.get(node.id)!;
        vy = (vy / nfDis) * radiiMap.get(node.id)!;
        node.x = focusNode.x + vx;
        node.y = focusNode.y + vy;
      }

      totalDisplacement += limitedDist;
      nodeCount++;
    }
  });

  return nodeCount > 0 ? totalDisplacement / nodeCount : 0;
};
