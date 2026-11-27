import {
  AntVDagreLayout,
  CircularLayout,
  ComboCombinedLayout,
  ConcentricLayout,
  D3Force3DLayout,
  D3ForceLayout,
  DagreLayout,
  FishboneLayout,
  ForceAtlas2Layout,
  ForceLayout,
  FruchtermanLayout,
  GridLayout,
  IndentedLayout,
  MDSLayout,
  MindmapLayout,
  RadialLayout,
  RandomLayout,
} from '@antv/layout';
import type { Layout } from '@antv/layout/lib/algorithm/types.js';
import type { GraphData, NodeData } from '@antv/layout/lib/types/data.js';

export type LayoutCallback = (layout: Layout<any>) => void;

export type LayoutDemoConfig = {
  title: string;
  data: GraphData;
  createLayout: (onTick: LayoutCallback) => Layout<any> & { destroy(): void };
  shape?: 'circle' | 'rect';
  showLabels?: boolean;
  animated?: boolean;
  displaySize?: [number, number];
  curve?: 'soft' | 'horizontal';
  directed?: boolean;
  project3d?: boolean;
};

function makeGraph(
  nodes: (string | NodeData)[],
  edges: [string, string][] = [],
): GraphData {
  return {
    nodes: nodes.map((node) =>
      typeof node === 'string' ? { id: node, data: {} } : { data: {}, ...node },
    ),
    edges: edges.map(([source, target]) => ({ source, target })),
  };
}

const forceStyle: Pick<LayoutDemoConfig, 'displaySize' | 'directed' | 'curve'> =
  {
    displaySize: [16, 16],
    directed: true,
    curve: 'soft',
  };

const services = makeGraph(
  [
    'Gateway',
    'Auth',
    'Users',
    'Orders',
    'Billing',
    'Inventory',
    'Search',
    'Cache',
    'Events',
    'Analytics',
  ],
  [
    ['Gateway', 'Auth'],
    ['Gateway', 'Users'],
    ['Gateway', 'Orders'],
    ['Users', 'Billing'],
    ['Orders', 'Billing'],
    ['Orders', 'Inventory'],
    ['Search', 'Cache'],
    ['Users', 'Cache'],
    ['Orders', 'Events'],
    ['Billing', 'Events'],
    ['Events', 'Analytics'],
  ],
);

const communities = makeGraph(
  [
    'Gateway',
    'Auth',
    'Users',
    'Orders',
    'Products',
    'Stock',
    'Search',
    'Cache',
    'Docs',
    'UI',
    'Charts',
    'Forms',
  ].map((id, index) => ({ id, data: {}, group: Math.floor(index / 3) })),
  [
    ['Gateway', 'Auth'],
    ['Auth', 'Users'],
    ['Users', 'Gateway'],
    ['Orders', 'Products'],
    ['Products', 'Stock'],
    ['Stock', 'Orders'],
    ['Search', 'Cache'],
    ['Cache', 'Docs'],
    ['Docs', 'Search'],
    ['UI', 'Charts'],
    ['Charts', 'Forms'],
    ['Forms', 'UI'],
    ['Gateway', 'Orders'],
    ['Orders', 'Search'],
    ['Search', 'UI'],
    ['Users', 'Forms'],
  ],
);

const collaboration = makeGraph(
  ['Mia', 'Chen', 'Lu', 'Sam', 'Iris', 'Kai', 'Nora', 'Leo'],
  [
    ['Mia', 'Chen'],
    ['Mia', 'Lu'],
    ['Chen', 'Sam'],
    ['Lu', 'Iris'],
    ['Sam', 'Kai'],
    ['Iris', 'Nora'],
    ['Kai', 'Leo'],
    ['Nora', 'Mia'],
    ['Chen', 'Iris'],
    ['Lu', 'Leo'],
  ],
);

const packages = makeGraph(
  [
    'App',
    'Router',
    'Store',
    'API',
    'UI',
    'Forms',
    'Table',
    'Charts',
    'Utils',
    'i18n',
  ],
  [
    ['App', 'Router'],
    ['App', 'Store'],
    ['App', 'UI'],
    ['Router', 'API'],
    ['Store', 'API'],
    ['UI', 'Forms'],
    ['UI', 'Table'],
    ['UI', 'Charts'],
    ['Forms', 'Utils'],
    ['Table', 'Utils'],
    ['Charts', 'Utils'],
    ['App', 'i18n'],
  ],
);

const knowledge = makeGraph(
  [
    'AI',
    'Models',
    'Agents',
    'Search',
    'Vector DB',
    'Graph',
    'NLP',
    'Vision',
    'Tools',
    'Evals',
  ],
  [
    ['AI', 'Models'],
    ['AI', 'Agents'],
    ['Models', 'NLP'],
    ['Models', 'Vision'],
    ['Agents', 'Tools'],
    ['Agents', 'Evals'],
    ['Search', 'Vector DB'],
    ['Search', 'Graph'],
    ['NLP', 'Search'],
    ['Tools', 'Search'],
  ],
);

const permissions = makeGraph(
  [
    'Admin',
    'Editor',
    'Viewer',
    'Audit',
    'Billing',
    'Reports',
    'Projects',
    'Teams',
    'Files',
    'Comments',
  ],
  [
    ['Admin', 'Audit'],
    ['Admin', 'Billing'],
    ['Admin', 'Projects'],
    ['Editor', 'Projects'],
    ['Editor', 'Files'],
    ['Editor', 'Comments'],
    ['Viewer', 'Reports'],
    ['Viewer', 'Files'],
    ['Viewer', 'Comments'],
    ['Projects', 'Teams'],
  ],
);

const influence = makeGraph(
  [
    'Key account',
    'Champion',
    'Decision',
    'Finance',
    'Legal',
    'Users',
    'Partner',
    'Support',
    'Press',
  ],
  [
    ['Key account', 'Champion'],
    ['Key account', 'Decision'],
    ['Champion', 'Finance'],
    ['Champion', 'Legal'],
    ['Champion', 'Users'],
    ['Decision', 'Partner'],
    ['Decision', 'Press'],
    ['Users', 'Support'],
  ],
);

const people = makeGraph(
  [
    'Alex',
    'Design',
    'Engineering',
    'Product',
    'Data',
    'Sales',
    'Support',
    'Marketing',
    'HR',
    'Finance',
    'Operations',
  ],
  [
    ['Alex', 'Design'],
    ['Alex', 'Engineering'],
    ['Alex', 'Product'],
    ['Design', 'Product'],
    ['Engineering', 'Data'],
    ['Product', 'Sales'],
    ['Sales', 'Marketing'],
    ['Support', 'Sales'],
    ['HR', 'Operations'],
    ['Operations', 'Finance'],
    ['HR', 'Alex'],
  ],
);

const checklist = makeGraph([
  'API',
  'Auth',
  'Docs',
  'Tests',
  'Build',
  'Deploy',
  'Monitor',
  'Alerts',
]);

const observations = makeGraph(
  [
    'Feedback',
    'Reviews',
    'Search',
    'Sessions',
    'Tickets',
    'Surveys',
    'Clicks',
    'Errors',
    'Notes',
    'Metrics',
  ],
  [
    ['Feedback', 'Reviews'],
    ['Feedback', 'Tickets'],
    ['Reviews', 'Surveys'],
    ['Search', 'Sessions'],
    ['Sessions', 'Clicks'],
    ['Tickets', 'Errors'],
    ['Surveys', 'Metrics'],
    ['Notes', 'Search'],
  ],
);

const similarity = makeGraph(
  [
    'Analytics',
    'Automation',
    'CRM',
    'Email',
    'Forms',
    'Reports',
    'Search',
    'Support',
  ],
  [
    ['Analytics', 'Reports'],
    ['Reports', 'Search'],
    ['CRM', 'Email'],
    ['CRM', 'Support'],
    ['Email', 'Support'],
    ['Forms', 'CRM'],
    ['Automation', 'Email'],
    ['Automation', 'Forms'],
  ],
);

const release = makeGraph(
  [
    'Commit',
    'Lint',
    'Unit tests',
    'Build',
    'Review',
    'Package',
    'Staging',
    'E2E tests',
    'Preview',
    'Deploy',
  ],
  [
    ['Commit', 'Lint'],
    ['Commit', 'Unit tests'],
    ['Commit', 'Build'],
    ['Lint', 'Review'],
    ['Unit tests', 'Review'],
    ['Build', 'Package'],
    ['Package', 'Staging'],
    ['Review', 'Staging'],
    ['Staging', 'E2E tests'],
    ['Staging', 'Preview'],
    ['E2E tests', 'Deploy'],
    ['Preview', 'Deploy'],
  ],
);

const approval = makeGraph(
  ['Request', 'Manager', 'Finance', 'Legal', 'Approve', 'Reject', 'Archive'],
  [
    ['Request', 'Manager'],
    ['Manager', 'Finance'],
    ['Manager', 'Legal'],
    ['Finance', 'Approve'],
    ['Legal', 'Approve'],
    ['Manager', 'Reject'],
    ['Approve', 'Archive'],
    ['Reject', 'Archive'],
  ],
);

const fishbone = makeGraph(
  ['Risk', 'People', 'Process', 'Tools', 'Skills', 'Scope', 'Builds'],
  [
    ['Risk', 'People'],
    ['Risk', 'Process'],
    ['Risk', 'Tools'],
    ['People', 'Skills'],
    ['Process', 'Scope'],
    ['Tools', 'Builds'],
  ],
);

const indented = makeGraph(
  [
    'System',
    'Foundations',
    'Colors',
    'Typography',
    'Components',
    'Buttons',
    'Forms',
    'Guidelines',
    'Accessibility',
  ],
  [
    ['System', 'Foundations'],
    ['Foundations', 'Colors'],
    ['Foundations', 'Typography'],
    ['System', 'Components'],
    ['Components', 'Buttons'],
    ['Components', 'Forms'],
    ['System', 'Guidelines'],
    ['Guidelines', 'Accessibility'],
  ],
);

const mindmap = makeGraph(
  [
    'Product',
    'Research',
    'Design',
    'Engineering',
    'Growth',
    'Interviews',
    'Prototypes',
    'Architecture',
    'Activation',
  ],
  [
    ['Product', 'Research'],
    ['Product', 'Design'],
    ['Product', 'Engineering'],
    ['Product', 'Growth'],
    ['Research', 'Interviews'],
    ['Design', 'Prototypes'],
    ['Engineering', 'Architecture'],
    ['Growth', 'Activation'],
  ],
);

const combo = makeGraph(
  [
    {
      id: 'Commerce',
      data: {},
      isCombo: true,
      style: { fill: '#EFF6FF', stroke: '#93C5FD' },
    },
    {
      id: 'Orders',
      data: {},
      parentId: 'Commerce',
      style: { fill: '#DBEAFE', stroke: '#60A5FA' },
    },
    {
      id: 'Payments',
      data: {},
      parentId: 'Commerce',
      style: { fill: '#DBEAFE', stroke: '#60A5FA' },
    },
    {
      id: 'Inventory',
      data: {},
      parentId: 'Commerce',
      style: { fill: '#DBEAFE', stroke: '#60A5FA' },
    },
    {
      id: 'Engagement',
      data: {},
      isCombo: true,
      style: { fill: '#F5F3FF', stroke: '#C4B5FD' },
    },
    {
      id: 'Users',
      data: {},
      parentId: 'Engagement',
      style: { fill: '#EDE9FE', stroke: '#A78BFA' },
    },
    {
      id: 'Messages',
      data: {},
      parentId: 'Engagement',
      style: { fill: '#EDE9FE', stroke: '#A78BFA' },
    },
    {
      id: 'Rewards',
      data: {},
      parentId: 'Engagement',
      style: { fill: '#EDE9FE', stroke: '#A78BFA' },
    },
  ],
  [
    ['Orders', 'Payments'],
    ['Orders', 'Inventory'],
    ['Users', 'Messages'],
    ['Messages', 'Rewards'],
    ['Orders', 'Users'],
    ['Inventory', 'Messages'],
  ],
);

export const layoutDemoConfigs = {
  'antv-dagre': {
    title: 'Approval workflow',
    data: approval,
    createLayout: () =>
      new AntVDagreLayout({
        rankdir: 'LR',
        nodeSize: [110, 32],
        nodesep: 24,
        ranksep: 60,
      }),
    shape: 'rect',
    showLabels: true,
    directed: true,
  },
  circular: {
    title: 'Roles and permissions',
    data: permissions,
    createLayout: () => new CircularLayout({ radius: 120 }),
    showLabels: true,
  },
  'combo-combined': {
    title: 'Domain modules',
    data: combo,
    createLayout: () =>
      new ComboCombinedLayout({
        layout: (comboId) =>
          comboId
            ? {
                type: 'grid',
                rows: 2,
                cols: 2,
                width: 232,
                height: 112,
                nodeSize: [88, 28],
                nodeSpacing: 28,
              }
            : {
                type: 'grid',
                rows: 1,
                cols: 2,
                width: 528,
                height: 160,
                nodeSpacing: 64,
              },
        node: (node) => ({ parentId: node.parentId, isCombo: node.isCombo }),
        comboPadding: 36,
        comboSpacing: 90,
      }),
    shape: 'rect',
    showLabels: true,
    displaySize: [88, 28],
    curve: 'soft',
  },
  concentric: {
    title: 'Account influence',
    data: influence,
    createLayout: () =>
      new ConcentricLayout({ nodeSize: 16, preventOverlap: true }),
    showLabels: true,
  },
  'd3-force': {
    title: 'Package dependencies',
    data: packages,
    createLayout: (onTick) =>
      new D3ForceLayout({ width: 400, height: 280, alphaDecay: 0.04, onTick }),
    showLabels: true,
    animated: true,
    ...forceStyle,
  },
  'd3-force-3d': {
    title: '3D knowledge space · projection',
    data: knowledge,
    createLayout: (onTick) =>
      new D3Force3DLayout({
        width: 400,
        height: 280,
        alphaDecay: 0.04,
        onTick,
      }),
    showLabels: true,
    animated: true,
    project3d: true,
    ...forceStyle,
  },
  dagre: {
    title: 'Release pipeline',
    data: release,
    createLayout: () =>
      new DagreLayout({
        rankdir: 'LR',
        nodeSize: [110, 32],
        nodesep: 24,
        ranksep: 60,
      }),
    shape: 'rect',
    showLabels: true,
    directed: true,
  },
  fishbone: {
    title: 'Delivery risk analysis',
    data: fishbone,
    createLayout: () =>
      new FishboneLayout({
        categoryGap: 150,
        categoryDistance: 120,
        itemHStep: 20,
        getWidth: () => 110,
        getHeight: () => 32,
      }),
    shape: 'rect',
    showLabels: true,
    directed: true,
  },
  force: {
    title: 'Service dependencies',
    data: services,
    createLayout: (onTick) =>
      new ForceLayout({
        width: 400,
        height: 280,
        animate: true,
        maxIteration: 180,
        nodeSize: 16,
        preventOverlap: true,
        onTick,
      }),
    showLabels: true,
    animated: true,
    ...forceStyle,
  },
  'force-atlas2': {
    title: 'Community discovery',
    data: communities,
    createLayout: (onTick) =>
      new ForceAtlas2Layout({
        width: 400,
        height: 280,
        animate: true,
        maxIteration: 220,
        nodeSize: 16,
        preventOverlap: true,
        onTick,
      }),
    showLabels: true,
    animated: true,
    ...forceStyle,
  },
  fruchterman: {
    title: 'Team collaboration',
    data: collaboration,
    createLayout: (onTick) =>
      new FruchtermanLayout({
        width: 400,
        height: 280,
        animate: true,
        maxIteration: 240,
        nodeSize: 16,
        preventOverlap: true,
        onTick,
      }),
    showLabels: true,
    animated: true,
    ...forceStyle,
  },
  grid: {
    title: 'Release checklist',
    data: checklist,
    createLayout: () =>
      new GridLayout({
        rows: 2,
        cols: 4,
        nodeSize: [90, 32],
        preventOverlap: true,
      }),
    shape: 'rect',
    showLabels: true,
    displaySize: [90, 32],
  },
  indented: {
    title: 'Design-system hierarchy',
    data: indented,
    createLayout: () =>
      new IndentedLayout({
        rootId: 'System',
        indent: 150,
        rowHeight: 42,
        nodeColors: ['#C7D2FE', '#DDD6FE', '#EDE9FE'],
      }),
    shape: 'rect',
    showLabels: true,
  },
  mds: {
    title: 'Product similarity',
    data: similarity,
    createLayout: () => new MDSLayout({ linkDistance: 100 }),
    showLabels: true,
    curve: 'soft',
  },
  mindmap: {
    title: 'Product strategy',
    data: mindmap,
    createLayout: () =>
      new MindmapLayout({
        levelGap: 70,
        nodeGap: 24,
        branchColors: ['#BFDBFE', '#FBCFE8'],
        getWidth: () => 110,
        getHeight: () => 32,
        getSide: (_node, index, parentSide) =>
          parentSide ?? (index % 2 === 0 ? 'left' : 'right'),
      }),
    shape: 'rect',
    showLabels: true,
    curve: 'horizontal',
  },
  radial: {
    title: 'People around Alex',
    data: people,
    createLayout: () =>
      new RadialLayout({
        focusNode: 'Alex',
        unitRadius: 60,
        nodeSize: 16,
        preventOverlap: true,
      }),
    showLabels: true,
  },
  random: {
    title: 'Unstructured observations',
    data: observations,
    createLayout: () => new RandomLayout({ width: 400, height: 280 }),
    showLabels: true,
  },
} satisfies Record<string, LayoutDemoConfig>;

export type LayoutDemoType = keyof typeof layoutDemoConfigs;
