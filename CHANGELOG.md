# ChangeLog

### 0.3.12

- perf: comboCombined with more accurate combined layout;

### 0.3.11

- fix: dagre with complex combos;

### 0.3.10

- chore: upgrade g-webgpu-core;

### 0.3.9

- chore: upgrade g-webgpu-core;

### 0.3.8

- chore: upgrade g-webgpu and regenerate shader code for gpu layouts, closes: #43;

### 0.3.7

- fix: dagre layout for collapsed combos;

### 0.3.6

- fix: add virtual edges for comboEdges in dagre to make combos be placed in correct layers;

### 0.3.5

- perf: adjust maxSpeed for force2;

### 0.3.4

- perf: improve the performance of dagre with layers;

### 0.3.3

- fix: dagre layer failed when the layer number begin with 0;
- fix: dagre with combo failed with some specified datasets;
- perf: reduce the maxSpeed of force2 to improve the swing problem;

#### 0.3.2

- fix: getAdjMatrix with inexistent source or target of edge;

#### 0.3.1

- perf: force2 with updated node mass;

#### 0.3.0

- feat: forceAtlas2 supports fx and fy to fix position for a node;
- fix: node overlaps in dagre with layer configs and default align;

#### 0.3.0-beta.5

- feat: force2 from graphin-force and better performance;
- chore: use Degree including in, out, all, instead of degree number in layouts;

#### 0.2.5

- fix: comboCombined innerLayout with original node infos;
- fix: DagreLayoutOptions with preset field;

#### 0.2.4

- fix: small width and height values for grid lead to 0 rows or cols;

#### 0.2.3

- perf: combo and node info should be transfered to outerLayout in comboCombined;

#### 0.2.2

- feat: replace @dagrejs/graphlib with @antv/graphlib
- types: reduce ant usage as much as possible
- chore: dagre type and some test fix

#### 0.2.1

- fix: gForce with same node positions;

#### 0.2.0

- chore: the beta features;

#### 0.2.0-beta.4

- feat: dagre layout support radial configuration;

#### 0.2.0-beta.3

- feat: dagreCompoud layout;

#### 0.2.0-beta.0

- feat: comboCombined layout;
- feat: add source and target node to the parameters of gForce linkDistance;
- feat: add hiddenNodes hiddenEdges hiddenCombos to the data of layout instance;

#### 0.1.31

- fix: dagre with sortByCombo error;

#### 0.1.30

- fix: flat problem;

#### 0.1.29

- fix: dagre error;

#### 0.1.28

- fix: dagre error;

#### 0.1.27

- fix: dagre error;

#### 0.1.26

- fix: dagre error;

#### 0.1.25
 
 - fix: array flat and Infinite param problem;
 - fix: dagre with NaN node rank;
 - chore: lint;

#### 0.1.23

- fix: array flat compatibility;

#### 0.1.22

- fix: fruchterman without init clusterMap problem;

#### 0.1.21

- fix: comboForce with unnecessary positions for combos;
- fix: dagre bug;

#### 0.1.20

- chore: migrate dagre from https://github.com/brickmaker/dagre to @antv/layout and re-write in es6 standard;
- chore: fruchterman cluster re-computing problem;
- feat: dagre supports begin position for the layout;

#### 0.1.19

- feat: dagre supports assigning order and layer, import from https://github.com/brickmaker/dagre;
- feat: ER layout;

#### 0.1.18

- fix: add return value for grid layout;
- fix: force atlas 2 default prune and barnesHut;