<div align="center">

# AntV Layout

Basic layout algorithms for visualization

[![Build Status](https://github.com/antvis/layout/actions/workflows/build.yml/badge.svg)](https://github.com/antvis/layout/actions)
[![Coverage](https://codecov.io/gh/antvis/layout/branch/v5/graph/badge.svg)](https://app.codecov.io/gh/antvis/layout/tree/v5)
[![npm Version](https://img.shields.io/npm/v/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)
[![npm Download](https://img.shields.io/npm/dm/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)
[![npm License](https://img.shields.io/npm/l/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)

<img src="https://mdn.alipayobjects.com/huamei_aphk1k/afts/img/A*oV6nR7oW4PMAAAAAgFAAAAgAegfkAQ/original" width="720" alt="AntV Layout Preview">

</div>

**@antv/layout** is a collection of basic layout algorithms. It ships with a wide range of layouts, unifies graph data and layout APIs, and turns graph structures into renderable coordinates.

<div align="center">
  <a href="https://layout.antv.vision/">
    <img src="https://img.shields.io/badge/Website-2F54EB?style=for-the-badge" alt="Website" />
  </a>
  <a href="https://layout.antv.vision/guide/start/getting-started">
    <img src="https://img.shields.io/badge/Docs-722ED1?style=for-the-badge" alt="Docs" />
  </a>
  <a href="https://layout.antv.vision/guide/api/api/introduction">
    <img src="https://img.shields.io/badge/API%20Reference-13C2C2?style=for-the-badge" alt="API Reference" />
  </a>
  <!-- <a href="https://observablehq.com/d/2db6b0cc5e97d8d6">
    <img src="https://img.shields.io/badge/Demo-FA8C16?style=for-the-badge" alt="Demo" />
  </a> -->
  <a href="https://layout.antv.vision/perf">
    <img src="https://img.shields.io/badge/Benchmark-D46A6A?style=for-the-badge" alt="Benchmark" />
  </a>
</div>

## ✨ Highlights

- **Coverage**: common graph layouts (force, dagre, radial, grid, combo)
- **Built for visualization**: real-world scenarios and workflows
- **Performance**: fast defaults + optional WebWorker offloading
- **Integration**: easy to plug into your rendering pipeline
- **TypeScript & docs**: typed APIs with complete documentation

## 🧩 Layouts

| Layout | Preview | Description |
| --- | --- | --- |
| <img alt="Force" src="https://img.shields.io/badge/Force-2F54EB?style=flat-square"> [ForceAtlas2](https://layout.antv.vision/guide/api/force/force-atlas2) | <img alt="ForceAtlas2" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*-HgiS6CyuuEAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Force-directed layout for large graphs with acceleration options (e.g. Barnes–Hut). |
| <img alt="Force" src="https://img.shields.io/badge/Force-2F54EB?style=flat-square"> [Force](https://layout.antv.vision/guide/api/force/force) | <img alt="Force" src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*Ce2WSIlo_fcAAAAAAAAAAABkARQnAQ" width="240" /> | Highly configurable force model for fine-grained tuning and process control. |
| <img alt="Force" src="https://img.shields.io/badge/Force-2F54EB?style=flat-square"> [Fruchterman](https://layout.antv.vision/guide/api/force/fruchterman) | <img alt="Fruchterman" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*1AvnTorIogUAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Classic force-directed layout for small/medium graphs with balanced distribution. |
| <img alt="Force" src="https://img.shields.io/badge/Force-2F54EB?style=flat-square"> [D3Force](https://layout.antv.vision/guide/api/force/d3-force) | <img alt="D3Force" src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*9VXcQLLyzHgAAAAAAAAAAABkARQnAQ" width="240" /> | d3-force style simulation wrapper for composing link/manyBody/collide forces. |
| <img alt="Force" src="https://img.shields.io/badge/Force-2F54EB?style=flat-square"> [D3Force3D](https://layout.antv.vision/guide/api/force/d3-force-3d) | <img alt="D3Force3D" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*4mbSTJLOXkgAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | 3D force layout based on d3-force-3d with z-axis forces and z output. |
| <img alt="Hierarchy" src="https://img.shields.io/badge/Hierarchy-722ED1?style=flat-square"> [Dagre](https://layout.antv.vision/guide/api/hierarchy/dagre) | <img alt="Dagre" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*v5mBSopYr_wAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Layered directed layout for DAGs, workflows, and dependency graphs. |
| <img alt="Hierarchy" src="https://img.shields.io/badge/Hierarchy-722ED1?style=flat-square"> [AntVDagre](https://layout.antv.vision/guide/api/hierarchy/antv-dagre) | <img alt="AntVDagre" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*gQGOTYlN6BMAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Production-oriented hierarchical layout with spacing, alignment, and path info. |
| <img alt="Radial" src="https://img.shields.io/badge/Radial-13C2C2?style=flat-square"> [Circular](https://layout.antv.vision/guide/api/radial/circular) | <img alt="Circular" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*qJi5Q4qg6W8AAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Place nodes on a circle (or spiral) with ordering, angle, and radius controls. |
| <img alt="Radial" src="https://img.shields.io/badge/Radial-13C2C2?style=flat-square"> [Concentric](https://layout.antv.vision/guide/api/radial/concentric) | <img alt="Concentric" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*KXunQKOLCSAAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Layer nodes by an importance score (default: degree), pulling higher scores inward. |
| <img alt="Radial" src="https://img.shields.io/badge/Radial-13C2C2?style=flat-square"> [Radial](https://layout.antv.vision/guide/api/radial/radial) | <img alt="Radial" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*vpXjTIFKy1QAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Focus-centered rings based on shortest-path distance for relationship exploration. |
| <img alt="Regular" src="https://img.shields.io/badge/Regular-52C41A?style=flat-square"> [Grid](https://layout.antv.vision/guide/api/regular/grid) | <img alt="Grid" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*8RYVTrENVCcAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Stable grid placement for predictable layouts like cards, lists, and matrices. |
| <img alt="Others" src="https://img.shields.io/badge/Others-8C8C8C?style=flat-square"> [MDS](https://layout.antv.vision/guide/api/others/mds) | <img alt="MDS" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*myM6T6R_d34AAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Multidimensional scaling to match ideal distances and produce a balanced global structure. |
| <img alt="Combo" src="https://img.shields.io/badge/Combo-FA8C16?style=flat-square"> [ComboCombined](https://layout.antv.vision/guide/api/combo/combo-combined) | <img alt="ComboCombined" src="https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*zPAzSZ3XxpUAAAAAAAAAAAAADmJ7AQ/original" width="240" /> | Composite layout for combos/subgraphs with per-level strategies and consistent bounds/spacing. |

## 🚀 Installation

```bash
npm install @antv/layout
```

## 📝 Quick Start

```ts
import { CircularLayout } from '@antv/layout';

const data = {
  nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }],
  edges: [
    { source: 'node1', target: 'node2' },
    { source: 'node2', target: 'node3' },
  ],
};

async function run() {
  const layout = new CircularLayout({ center: [200, 200], radius: 150 });

  await layout.execute(data);

  layout.forEachNode((node) => {
    console.log(node.id, node.x, node.y);
  });
}

run();
```

## 🧵 Worker support

Set `enableWorker: true` to run layouts in a WebWorker when supported. See the docs for worker setup and layout configuration details.

## 🤝 Contributing

Contributions are welcome. See `CONTRIBUTING.md` for guidelines and local workflows.

## 📄 License

MIT licensed. See `LICENSE` for details.
