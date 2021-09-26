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
    await er.layout(erNode1);
    graph.data(erNode1);
    graph.render();
    graph.zoomTo(0.3);
    graph.destroy();
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
    });
  });
});