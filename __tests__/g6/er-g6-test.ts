import { ERLayout } from '../../src/layout/er';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const simpleData = {
  nodes: [{
    id: 'node1',
    size: [150, 300],
    label: 'node1',
  }, {
    id: 'node2',
    size: [150, 300],
    label: 'node2',
  }, {
    id: 'node3',
    size: [150, 300],
    label: 'node3',
  }, {
    id: 'node4',
    size: [150, 300],
    label: 'node4',
  }, {
    id: 'node5',
    size: [150, 200],
    label: 'node5',
  }, {
    id: 'node6',
    size: [150, 100],
    label: 'node6',
  }],
  edges: [
    {
      source: 'node1',
      target: 'node2',
    },
    {
      source: 'node1',
      target: 'node3',
    },
    {
      source: 'node1',
      target: 'node4',
    },
    {
      source: 'node1',
      target: 'node5',
    },
    {
      source: 'node1',
      target: 'node6',
    },
  ]
};
const erNode1 = {
  nodes: [{
    id: 'relTable1',
    size: [280, 500],
    label: 'relTable1',
  }, {
    id: 'virTable1',
    size: [280, 100],
    label: 'virTable1',
  }, {
    id: 'virTable2',
    size: [280, 100],
    label: 'virTable2',
  }, {
    id: 'virTable3',
    size: [280, 100],
    label: 'virTable3',
  }, {
    id: 'virTable4',
    size: [280, 100],
    label: 'virTable4',
  }, {
    id: 'virTable5',
    size: [280, 100],
    label: 'virTable5',
  }, {
    id: 'virTable6',
    size: [280, 100],
    label: 'virTable6',
  }, {
    id: 'relTable2',
    size: [280, 300],
    label: 'relTable2',
  }, {
    id: 'virTable7',
    size: [280, 100],
    label: 'virTable7',
  }, {
    id: 'virTable8',
    size: [280, 100],
    label: 'virTable8',
  }, {
    id: 'virTable9',
    size: [280, 100],
    label: 'virTable9',
  }],
  edges: [{
    source: 'relTable1',
    target: 'virTable1',
  }, {
    source: 'relTable1',
    target: 'virTable2',
  }, {
    source: 'relTable1',
    target: 'virTable3',
  }, {
    source: 'relTable1',
    target: 'virTable4',
  }, {
    source: 'relTable1',
    target: 'virTable5',
  }, {
    source: 'relTable1',
    target: 'virTable6',
  }, {
    source: 'relTable2',
    target: 'virTable6',
  }, {
    source: 'relTable2',
    target: 'virTable7',
  }, {
    source: 'relTable2',
    target: 'virTable8',
  }]
};
const data = {"nodes":[{"id":"user","label":"用户","attrs":[{"key":"id","type":"number(6)"},{"key":"birthday","type":"date"},{"key":"hometown","type":"varchar(255)"},{"key":"country","type":"varchar(255)"},{"key":"phone","type":"varchar(255)"}],"size":[250,132]},{"id":"order","label":"订单","attrs":[{"key":"id","type":"number(6)"},{"key":"skuid","type":"number(6)","relation":[{"nodeId":"sku","key":"userId"}]},{"key":"number","type":"number(6)"},{"key":"userId","type":"number(6)","relation":[{"nodeId":"user","key":"userId"}]},{"key":"date","type":"number(6)"},{"key":"tagId","type":"number(6)","relation":[{"nodeId":"tag"}]},{"key":"dim1","type":"number(6)","relation":[{"nodeId":"dim1"}]},{"key":"dim2","type":"number(6)","relation":[{"nodeId":"dim2"}]},{"key":"zoneid","type":"number","relation":[{"nodeId":"zone"}]}],"size":[250,212]},{"id":"sku","label":"商品","attrs":[{"key":"id","type":"number(6)"},{"key":"name","type":"varchar(255)"},{"key":"address","type":"varchar(255)"},{"key":"count","type":"number(6)"}],"size":[250,112]},{"id":"zone","label":"区域","attrs":[{"key":"id","type":"number(6)"},{"key":"name","type":"varchar(255)"},{"key":"address","type":"varchar(255)"}],"size":[250,92]},{"id":"tag","label":"标签","attrs":[{"key":"id","type":"number(6)"},{"key":"name","type":"varchar(255)"},{"key":"desc","type":"varchar(255)"}],"size":[250,92]},{"id":"dim1","label":"dim1","attrs":[{"key":"id","type":"number(6)"},{"key":"name","type":"varchar(255)"}],"size":[250,72]},{"id":"dim2","label":"dim2","attrs":[{"key":"id","type":"number(6)"},{"key":"name","type":"varchar(255)"}],"size":[250,72]}],"edges":[{"source":"order","target":"sku","sourceKey":"skuid","targetKey":"userId"},{"source":"order","target":"user","sourceKey":"userId","targetKey":"userId"},{"source":"order","target":"tag","sourceKey":"tagId"},{"source":"order","target":"dim1","sourceKey":"dim1"},{"source":"order","target":"dim2","sourceKey":"dim2"},{"source":"order","target":"zone","sourceKey":"zoneid"}]}
const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('ER Layout', () => {
  it('er layout with small data', async () => {
    const graph = new G6.Graph({
      container: div,
      width: 1200,
      height: 800,
      defaultNode: {
        type: 'rect',
      },
    });
    const er = new ERLayout({
      width: 1200,
      height: 800,
      nodeMinGap: 30,
    });
    await er.layout(simpleData);
    graph.data(simpleData);
    graph.render();
    graph.zoomTo(0.3);
    graph.destroy();
    
  });
  it('er layout with er data', async () => {
    const graph = new G6.Graph({
      container: div,
      width: 1200,
      height: 800,
      defaultNode: {
        type: 'rect',
      },
    });
    const er = new ERLayout({
      width: 1200,
      height: 800,
      nodeMinGap: 30,
    });

    await er.layout(data);
    graph.data(data);
    graph.render();
    graph.zoomTo(0.3);
    // graph.destroy();
  });
  it('er layout with complex data', () => {
  
    const graph = new G6.Graph({
      container: div,
      width: 1200,
      height: 800,
    });
  
    const er = new ERLayout({
      width: 1200,
      height: 800,
      nodeMinGap: 30,
    });
    fetch(complexDataUrl)
    .then((res) => res.json())
    .then(async (data) => {
      await er.layout(data);
      graph.data(data);
      graph.render();
      graph.zoomTo(0.3);
      graph.destroy();
    });
  });
});