import { isEmpty } from '@antv/util';
import type { GraphLib } from '../../model/data';
import { initNodePosition } from '../../model/data';
import type { EdgeData, NodeData, Point, PointObject } from '../../types';
import { normalizeViewport } from '../../util';
import { formatFn, formatNodeSizeFn, formatNumberFn } from '../../util/format';
import { BaseLayoutWithIterations } from '../base-layout';
import { forceAttractive } from './attractive';
import { forceCentripetal } from './centripetal';
import { forceCollide } from './collide';
import { forceGravity } from './gravity';
import { forceRepulsive } from './repulsive';
import { ForceSimulation } from './simulation';
import {
  ForceLayoutOptions,
  GetCenterFn,
  NodeClusterByFn,
  ParsedForceLayoutOptions,
} from './types';

export type { ForceLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<ForceLayoutOptions> = {
  nodeSize: 30,
  dimensions: 2,
  maxIteration: 500,
  gravity: 10,
  factor: 1,
  edgeStrength: 50,
  nodeStrength: 1000,
  coulombDisScale: 0.005,
  damping: 0.9,
  maxSpeed: 200,
  minMovement: 0.4,
  interval: 0.02,
  linkDistance: 200,
  clusterNodeStrength: 20,
  collideStrength: 1,
  preventOverlap: true,
  distanceThresholdMode: 'mean',
};

/**
 * <zh/> 力导向布局 (Force)
 *
 * <en/> Force-directed layout (Force)
 *
 * @remarks
 * <zh/> 基于自定义物理模拟的力导向布局，使用库伦定律计算斥力，胡克定律计算引力
 *
 * <en/> Force-directed layout based on custom physics simulation, using Coulomb's law for repulsion and Hooke's law for attraction
 */
export class ForceLayout extends BaseLayoutWithIterations<ForceLayoutOptions> {
  public id = 'force';

  public simulation: ForceSimulation | null = null;

  protected getDefaultOptions(): Partial<ForceLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(): Promise<void> {
    const options = this.parseOptions(this.options);
    const { width, height, dimensions } = options;

    this.initializePhysicsData(this.model, options);

    initNodePosition(this.model, width, height, dimensions);

    if (!this.model.nodes()?.length) return;

    const simulation = this.setSimulation(options);

    simulation.data(this.model);
    simulation.initialize(options);
    simulation.restart();

    return new Promise<void>((resolve) => {
      simulation.on('end', () => resolve());
    });
  }

  /**
   * Initialize physics properties on model nodes and edges
   */
  private initializePhysicsData(
    model: GraphLib,
    options: ParsedForceLayoutOptions,
  ) {
    const { nodeSize, getMass, nodeStrength, edgeStrength, linkDistance } =
      options;

    model.forEachNode((node) => {
      const raw = node._original;
      node.size = nodeSize(raw);
      node.mass = getMass(raw);
      node.nodeStrength = nodeStrength(raw);
    });

    model.forEachEdge((edge) => {
      const raw = edge._original;
      edge.edgeStrength = edgeStrength(raw);
      edge.linkDistance = linkDistance(
        raw,
        model.originalNode(edge.source)!,
        model.originalNode(edge.target)!,
      );
    });
  }

  /**
   * Setup simulation and forces
   */
  protected setSimulation(options: ParsedForceLayoutOptions): ForceSimulation {
    const simulation = this.simulation || new ForceSimulation();

    if (!this.simulation) {
      this.simulation = simulation.on('tick', () => {
        options.onTick?.(this);
      });
    }

    // Setup all forces
    this.setupRepulsiveForce(simulation, options);
    this.setupAttractiveForce(simulation, options);
    this.setupCollideForce(simulation, options);
    this.setupGravityForce(simulation, options);
    this.setupCentripetalForce(simulation, options);

    return simulation;
  }

  /**
   * Setup repulsive force (Coulomb's law)
   */
  protected setupRepulsiveForce(
    simulation: ForceSimulation,
    options: ParsedForceLayoutOptions,
  ) {
    const { factor, coulombDisScale, dimensions } = options;

    let force = simulation.force('repulsive');
    if (!force) {
      force = forceRepulsive(factor, coulombDisScale, dimensions);
      simulation.force('repulsive', force);
    }

    if (force.factor) force.factor(factor);
    if (force.coulombDisScale) force.coulombDisScale(coulombDisScale);
    if (force.dimensions) force.dimensions(dimensions);
  }

  /**
   * Setup attractive force (Hooke's law)
   */
  protected setupAttractiveForce(
    simulation: ForceSimulation,
    options: ParsedForceLayoutOptions,
  ) {
    const { dimensions, preventOverlap } = options;
    const edges = this.model.edges() || [];

    if (edges.length > 0) {
      let force = simulation.force('attractive');
      if (!force) {
        force = forceAttractive(dimensions);
        simulation.force('attractive', force);
      }

      if (force.dimensions) force.dimensions(dimensions);
      if (force.preventOverlap) force.preventOverlap(preventOverlap);
    } else {
      simulation.force('attractive', null);
    }
  }

  /**
   * Setup gravity force toward center
   */
  protected setupGravityForce(
    simulation: ForceSimulation,
    options: ParsedForceLayoutOptions,
  ) {
    const { center, gravity, getCenter } = options;

    if (gravity) {
      let force = simulation.force('gravity');
      if (!force) {
        force = forceGravity(center, gravity);
        simulation.force('gravity', force);
      }

      if (force.center) force.center(center);
      if (force.gravity) force.gravity(gravity);
      if (force.getCenter) force.getCenter(getCenter);
    } else {
      simulation.force('gravity', null);
    }
  }

  /**
   * Setup collision force to prevent overlap
   */
  protected setupCollideForce(
    simulation: ForceSimulation,
    options: ParsedForceLayoutOptions,
  ) {
    const { preventOverlap, collideStrength = 1, dimensions } = options;

    if (preventOverlap && collideStrength) {
      let force = simulation.force('collide');
      if (!force) {
        force = forceCollide(dimensions);
        simulation.force('collide', force);
      }

      if (force.strength) force.strength(collideStrength);
      if (force.dimensions) force.dimensions(dimensions);
    } else {
      simulation.force('collide', null);
    }
  }

  /**
   * Setup centripetal force (unique to Force)
   */
  protected setupCentripetalForce(
    simulation: ForceSimulation,
    options: ParsedForceLayoutOptions,
  ) {
    const { centripetalOptions, width, height } = options;

    if (centripetalOptions) {
      let force = simulation.force('centripetal');
      if (!force) {
        force = forceCentripetal(centripetalOptions);
        simulation.force('centripetal', force);
      }

      if (force.options) force.options(centripetalOptions);
      if (force.width) force.width(width);
      if (force.height) force.height(height);
    } else {
      simulation.force('centripetal', null);
    }
  }

  /**
   * Parse and format options
   */
  protected parseOptions(
    options: ForceLayoutOptions,
  ): ParsedForceLayoutOptions {
    const _ = {
      ...options,
      ...normalizeViewport(options),
    } as ParsedForceLayoutOptions;

    // Format nodeClusterBy (for clustering / leafCluster)
    if (_.nodeClusterBy) {
      _.nodeClusterBy = formatFn(_.nodeClusterBy, ['node']) as NodeClusterByFn;
    }

    // Format node mass
    if (!options.getMass) {
      _.getMass = (node: NodeData) => {
        if (!node) return 1;
        const massWeight = 1;
        const degree = this.model.degree(node.id, 'both');
        return !degree || degree < 5 ? massWeight : degree * 5 * massWeight;
      };
    } else {
      _.getMass = formatNumberFn(options.getMass, 1);
    }

    // Format per-node center force callback
    if (options.getCenter) {
      const params = ['node', 'degree'];
      _.getCenter = formatFn(options.getCenter, params) as GetCenterFn;
    }

    // Format node size
    const nodeSizeVec = formatNodeSizeFn(options.nodeSize, options.nodeSpacing);
    _.nodeSize = (node: NodeData) => {
      if (!node) return 0;
      const [w, h, z] = nodeSizeVec(node);
      return Math.max(w, h, z);
    };

    // Format node / edge strengths
    _.linkDistance = options.linkDistance
      ? (formatFn(options.linkDistance, ['edge', 'source', 'target']) as any)
      : (_: EdgeData, source: NodeData, target: NodeData) =>
          1 + _.nodeSize(source) + _.nodeSize(target);
    _.nodeStrength = formatNumberFn(options.nodeStrength, 1);
    _.edgeStrength = formatNumberFn(options.edgeStrength, 1, 'edge');
    _.clusterNodeStrength = formatNumberFn(options.clusterNodeStrength, 1);

    // Format centripetal options
    this.formatCentripetal(_);

    return _ as ParsedForceLayoutOptions;
  }

  /**
   * Format centripetal options
   */
  private formatCentripetal(options: ParsedForceLayoutOptions) {
    const {
      dimensions,
      centripetalOptions,
      center,
      leafCluster,
      clustering,
      nodeClusterBy,
    } = options;

    const leafParams = ['node', 'nodes', 'edges'];
    const leafFn = formatFn(centripetalOptions?.leaf, leafParams);
    const singleFn = formatNumberFn(centripetalOptions?.single, 2);
    const othersFn = formatNumberFn(centripetalOptions?.others, 1);

    const centerRaw =
      centripetalOptions?.center ??
      ((_: NodeData) => {
        return {
          x: center[0],
          y: center[1],
          z: dimensions === 3 ? center[2] : undefined,
        };
      });

    const centerFn = formatFn(centerRaw, [
      'node',
      'nodes',
      'edges',
      'width',
      'height',
    ]) as any;

    const basicCentripetal = {
      ...centripetalOptions,
      leaf: leafFn,
      single: singleFn,
      others: othersFn,
      center: centerFn,
    };

    // If user provided centripetalOptions, normalize them even without clustering modes.
    if (centripetalOptions) {
      options.centripetalOptions = basicCentripetal as any;
    }

    let sameTypeLeafMap: any;
    let clusters: string[];

    // Leaf cluster mode
    if (leafCluster && nodeClusterBy) {
      sameTypeLeafMap = this.getSameTypeLeafMap(nodeClusterBy);
      clusters =
        Array.from(
          new Set(
            this.model
              .nodes()
              ?.map((node) => nodeClusterBy(node._original) as string),
          ),
        ) || [];

      options.centripetalOptions = Object.assign({}, basicCentripetal, {
        single: () => 100,
        leaf: (node: NodeData) => {
          const { siblingLeaves, sameTypeLeaves } =
            sameTypeLeafMap[node.id] || {};
          if (
            sameTypeLeaves?.length === siblingLeaves?.length ||
            clusters?.length === 1
          ) {
            return 1;
          }
          return options.clusterNodeStrength(node);
        },
        others: () => 1,
        center: (node: NodeData) => {
          const degree = this.model.degree(node.id, 'both');
          if (!degree) {
            return { x: 100, y: 100, z: 0 };
          }
          let centerPos: PointObject | undefined;
          if (degree === 1) {
            const { sameTypeLeaves = [] } = sameTypeLeafMap[node.id] || {};
            if (sameTypeLeaves.length === 1) {
              centerPos = undefined;
            } else if (sameTypeLeaves.length > 1) {
              centerPos = this.getAvgNodePosition(sameTypeLeaves);
            }
          } else {
            centerPos = undefined;
          }
          return {
            x: centerPos?.x!,
            y: centerPos?.y!,
            z: centerPos?.z!,
          };
        },
      });
    }

    // Full clustering mode
    if (clustering && nodeClusterBy) {
      if (!sameTypeLeafMap) {
        sameTypeLeafMap = this.getSameTypeLeafMap(nodeClusterBy);
      }
      let clusters: string[] = [];
      if (isEmpty(clusters)) {
        this.model.forEachNode((node) => {
          const cluster = nodeClusterBy(node._original);
          if (cluster && !clusters.includes(cluster)) {
            clusters.push(cluster);
          }
        });
      }

      const centerInfo: { [key: string]: PointObject } = {};
      clusters.forEach((cluster) => {
        const sameTypeNodes = this.model
          .nodes()
          .filter((node) => nodeClusterBy(node._original) === cluster);
        centerInfo[cluster] = this.getAvgNodePosition(sameTypeNodes);
      });

      options.centripetalOptions = Object.assign(basicCentripetal, {
        single: (node: NodeData) => options.clusterNodeStrength(node),
        leaf: (node: NodeData) => options.clusterNodeStrength(node),
        others: (node: NodeData) => options.clusterNodeStrength(node),
        center: (node: NodeData) => {
          const centerPos = centerInfo[nodeClusterBy(node._original)];
          return {
            x: centerPos?.x!,
            y: centerPos?.y!,
            z: centerPos?.z!,
          };
        },
      });
    }
  }

  /**
   * Get same type leaf map for clustering
   */
  private getSameTypeLeafMap(nodeClusterBy: (node: NodeData) => string) {
    const sameTypeLeafMap: Record<string, any> = {};

    this.model.forEachNode((node) => {
      const degree = this.model.degree(node.id, 'both');
      if (degree === 1) {
        sameTypeLeafMap[node.id] = this.getCoreNodeAndSiblingLeaves(
          node,
          nodeClusterBy,
        );
      }
    });

    return sameTypeLeafMap;
  }

  /**
   * Get core node and sibling leaves
   */
  private getCoreNodeAndSiblingLeaves(
    node: NodeData,
    nodeClusterBy: (node: NodeData) => string,
  ) {
    const inDegree = this.model.degree(node.id, 'in');
    const outDegree = this.model.degree(node.id, 'out');

    let coreNode: NodeData = node;
    let siblingLeaves: NodeData[] = [];

    if (inDegree === 0) {
      const successors = this.model.successors(node.id);
      coreNode = this.model.node(successors[0])!;
      siblingLeaves = this.model
        .neighbors(coreNode.id)
        .map((id) => this.model.node(id)!);
    } else if (outDegree === 0) {
      const predecessors = this.model.predecessors(node.id);
      coreNode = this.model.node(predecessors[0])!;
      siblingLeaves = this.model
        .neighbors(coreNode.id)
        .map((id) => this.model.node(id)!);
    }

    siblingLeaves = siblingLeaves.filter(
      (n) =>
        this.model.degree(n.id, 'in') === 0 ||
        this.model.degree(n.id, 'out') === 0,
    );

    const typeName = nodeClusterBy(node._original) || '';
    const sameTypeLeaves = siblingLeaves.filter(
      (item) =>
        nodeClusterBy(item._original) === typeName &&
        (this.model.degree(item.id, 'in') === 0 ||
          this.model.degree(item.id, 'out') === 0),
    );

    return { coreNode, siblingLeaves, sameTypeLeaves };
  }

  /**
   * Get average position of nodes
   */
  private getAvgNodePosition(nodes: NodeData[]): PointObject {
    const totalNodes: PointObject = { x: 0, y: 0 };
    nodes.forEach((node) => {
      totalNodes.x += node.x || 0;
      totalNodes.y += node.y || 0;
    });
    const n = nodes.length || 1;
    return {
      x: totalNodes.x / n,
      y: totalNodes.y / n,
    };
  }

  /**
   * Manually step the simulation
   */
  public tick(iterations: number = 1): this {
    if (this.simulation) {
      this.simulation.tick(iterations);
    }
    return this;
  }

  /**
   * Stop the simulation
   */
  public stop(): this {
    if (this.simulation) {
      this.simulation.stop();
    }
    return this;
  }

  /**
   * Restart the simulation
   */
  public restart(): this {
    if (this.simulation) {
      this.simulation.restart();
    }
    return this;
  }

  /**
   * Set fixed position for a node
   */
  public setFixedPosition(nodeId: string, position: Point | null): this {
    if (this.simulation) {
      this.simulation.setFixedPosition(nodeId, position);
    }
    return this;
  }
}
