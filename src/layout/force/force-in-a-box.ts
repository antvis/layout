import * as d3Force from 'd3-force';
import { getEdgeTerminal } from '../../util';

interface INode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: any;
}

// https://github.com/john-guerra/forceInABox/blob/master/src/forceInABox.js
export default function forceInABox() {
  function constant(_: any): () => any {
    return () => _;
  }

  let groupBy = (d: INode) => {
    return d.cluster;
  };
  let forceNodeSize: (() => number) | ((d: any) => number) = constant(1);
  let forceCharge: (() => number) | ((d: any) => number) = constant(-1);
  let forceLinkDistance: (() => number) | ((d: any) => number) = constant(100);
  let forceLinkStrength: (() => number) | ((d: any) => number) = constant(0.1);
  let offset = [0, 0];

  let nodes: INode[] = [];
  let nodesMap: any = {};
  let links: any[] = [];
  let centerX = 100;
  let centerY = 100;
  let foci: any = {
    none: {
      x: 0,
      y: 0,
    },
  };
  let templateNodes: INode[] = [];
  let templateForce: any;
  let template = 'force';
  let enableGrouping = true;
  let strength = 0.1;

  function force(alpha: number) {
    if (!enableGrouping) {
      return force;
    }
    templateForce.tick();
    getFocisFromTemplate();

    for (let i = 0, n = nodes.length, node, k = alpha * strength; i < n; ++i) {
      node = nodes[i];
      node.vx += (foci[groupBy(node)].x - node.x) * k;
      node.vy += (foci[groupBy(node)].y - node.y) * k;
    }
  }

  function initialize() {
    if (!nodes) return;
    initializeWithForce();
  }

  function initializeWithForce() {
    if (!nodes || !nodes.length) {
      return;
    }

    if (groupBy(nodes[0]) === undefined) {
      throw Error(
        "Couldnt find the grouping attribute for the nodes. Make sure to set it up with forceInABox.groupBy('clusterAttr') before calling .links()",
      );
    }

    // checkLinksAsObjects();

    const net = getGroupsGraph();
    templateForce = d3Force
      .forceSimulation(net.nodes)
      .force('x', d3Force.forceX(centerX).strength(0.1))
      .force('y', d3Force.forceY(centerY).strength(0.1))
      .force('collide', d3Force.forceCollide((d: any) => d.r).iterations(4))
      .force('charge', d3Force.forceManyBody().strength(forceCharge))
      .force(
        'links',
        d3Force
          .forceLink(net.nodes.length ? net.links : [])
          .distance(forceLinkDistance)
          .strength(forceLinkStrength),
      );

    templateNodes = templateForce.nodes();

    getFocisFromTemplate();
  }

  function getGroupsGraph() {
    const gnodes: any = [];
    const glinks: any = [];
    const dNodes: any = {};
    let clustersList = [];
    let clustersCounts: any = {};
    let clustersLinks: any = [];

    clustersCounts = computeClustersNodeCounts(nodes);
    clustersLinks = computeClustersLinkCounts(links);

    clustersList = Object.keys(clustersCounts);

    clustersList.forEach((key, index) => {
      const val = clustersCounts[key];
      // Uses approx meta-node size
      gnodes.push({
        id: key,
        size: val.count,
        r: Math.sqrt(val.sumforceNodeSize / Math.PI),
      });
      dNodes[key] = index;
    });

    clustersLinks.forEach((l: any) => {
      const sourceTerminal = getEdgeTerminal(l, 'source');
      const targetTerminal = getEdgeTerminal(l, 'target');
      const source = dNodes[sourceTerminal];
      const target = dNodes[targetTerminal];
      if (source !== undefined && target !== undefined) {
        glinks.push({
          source,
          target,
          count: l.count,
        });
      }
    });

    return {
      nodes: gnodes,
      links: glinks,
    };
  }

  function computeClustersNodeCounts(nodes: any) {
    const clustersCounts: any = {};

    nodes.forEach((d: any) => {
      const key = groupBy(d);
      if (!clustersCounts[key]) {
        clustersCounts[key] = {
          count: 0,
          sumforceNodeSize: 0,
        };
      }
    });
    nodes.forEach((d: any) => {
      const key = groupBy(d);
      const nodeSize = forceNodeSize(d);
      const tmpCount = clustersCounts[key];
      tmpCount.count = tmpCount.count + 1;
      tmpCount.sumforceNodeSize =
        tmpCount.sumforceNodeSize + Math.PI * (nodeSize * nodeSize) * 1.3;
      clustersCounts[key] = tmpCount;
    });

    return clustersCounts;
  }

  function computeClustersLinkCounts(links: any) {
    const dClusterLinks: any = {};
    const clusterLinks: any = [];
    links.forEach((l: any) => {
      const key = getLinkKey(l);
      let count = 0;
      if (dClusterLinks[key] !== undefined) {
        count = dClusterLinks[key];
      }
      count += 1;
      dClusterLinks[key] = count;
    });

    // @ts-ignore
    const entries = Object.entries(dClusterLinks);

    entries.forEach(([key, count]: any) => {
      const source = key.split('~')[0];
      const target = key.split('~')[1];
      if (source !== undefined && target !== undefined) {
        clusterLinks.push({
          source,
          target,
          count,
        });
      }
    });

    return clusterLinks;
  }

  function getFocisFromTemplate() {
    foci = {
      none: {
        x: 0,
        y: 0,
      },
    };
    templateNodes.forEach((d) => {
      foci[d.id] = {
        x: d.x - offset[0],
        y: d.y - offset[1],
      };
    });
    return foci;
  }

  function getLinkKey(l: any) {
    const source = getEdgeTerminal(l, 'source');
    const target = getEdgeTerminal(l, 'target');
    const sourceID = groupBy(nodesMap[source]);
    const targetID = groupBy(nodesMap[target]);

    return sourceID <= targetID
      ? `${sourceID}~${targetID}`
      : `${targetID}~${sourceID}`;
  }

  function genNodesMap(nodes: any) {
    nodesMap = {};
    nodes.forEach((node: any) => {
      nodesMap[node.id] = node;
    });
  }

  function setTemplate(x: any) {
    if (!arguments.length) return template;
    template = x;
    initialize();
    return force;
  }

  function setGroupBy(x: any) {
    if (!arguments.length) return groupBy;
    if (typeof x === 'string') {
      groupBy = (d: any) => {
        return d[x];
      };
      return force;
    }
    groupBy = x;
    return force;
  }

  function setEnableGrouping(x: any) {
    if (!arguments.length) return enableGrouping;
    enableGrouping = x;
    return force;
  }

  function setStrength(x: any) {
    if (!arguments.length) return strength;
    strength = x;
    return force;
  }

  function setCenterX(_: any) {
    if (arguments.length) {
      centerX = _;
      return force;
    }

    return centerX;
  }

  function setCenterY(_: any) {
    if (arguments.length) {
      centerY = _;
      return force;
    }

    return centerY;
  }

  function setNodes(_: any) {
    if (arguments.length) {
      genNodesMap(_ || []);
      nodes = _ || [];
      return force;
    }
    return nodes;
  }

  function setLinks(_: any) {
    if (arguments.length) {
      links = _ || [];
      initialize();
      return force;
    }
    return links;
  }

  function setForceNodeSize(_: any) {
    if (arguments.length) {
      if (typeof _ === 'function') {
        forceNodeSize = _;
      } else {
        forceNodeSize = constant(+_);
      }
      initialize();
      return force;
    }

    return forceNodeSize;
  }

  function setForceCharge(_: any) {
    if (arguments.length) {
      if (typeof _ === 'function') {
        forceCharge = _;
      } else {
        forceCharge = constant(+_);
      }
      initialize();
      return force;
    }

    return forceCharge;
  }

  function setForceLinkDistance(_: any) {
    if (arguments.length) {
      if (typeof _ === 'function') {
        forceLinkDistance = _;
      } else {
        forceLinkDistance = constant(+_);
      }
      initialize();
      return force;
    }

    return forceLinkDistance;
  }

  function setForceLinkStrength(_: any) {
    if (arguments.length) {
      if (typeof _ === 'function') {
        forceLinkStrength = _;
      } else {
        forceLinkStrength = constant(+_);
      }
      initialize();
      return force;
    }

    return forceLinkStrength;
  }

  function setOffset(_: any) {
    if (arguments.length) {
      offset = _;
      return force;
    }

    return offset;
  }

  force.initialize = (_: any) => {
    nodes = _;
    initialize();
  };

  force.template = setTemplate;

  force.groupBy = setGroupBy;

  force.enableGrouping = setEnableGrouping;

  force.strength = setStrength;

  force.centerX = setCenterX;

  force.centerY = setCenterY;

  force.nodes = setNodes;

  force.links = setLinks;

  force.forceNodeSize = setForceNodeSize;

  // Legacy support
  force.nodeSize = force.forceNodeSize;

  force.forceCharge = setForceCharge;

  force.forceLinkDistance = setForceLinkDistance;

  force.forceLinkStrength = setForceLinkStrength;

  force.offset = setOffset;

  force.getFocis = getFocisFromTemplate;

  return force;
}
