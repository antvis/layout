import { ForceAtlas2Layout } from '../../src';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const simpleData = {
  nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }, { id: 'node4' }],
  edges: [{ source: 'node1', target: 'node2' }]
};

const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('force atlas2 Layout', () => {
  it('force atlas2 with small data', () => {
    const layout = new ForceAtlas2Layout();
    layout.layout(simpleData);

    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: ['drag-node']
      },
      defaultEdge: {
        style: {
          endArrow: true
        }
      }
    });

    graph.data(simpleData);
    graph.render();
    graph.destroy();
  });
  it('force atlas2 with complex data', () => {
    const graph = new G6.Graph({
      container: div,
      width: 800,
      height: 600,
      fitView: true
    });

    fetch(complexDataUrl)
      .then(res => res.json())
      .then(data => {
        const layout = new ForceAtlas2Layout({
          barnesHut: true,
          preventOverlap: true,
          tick: () => {
            graph.refreshPositions();
          }
        } as any);
        layout.layout(data);
        graph.data(data);
        graph.render();
        // graph.destroy();
      });
  });
  it('swtich data', () => {
    const layout = new ForceAtlas2Layout();
    layout.layout(simpleData);

    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true
        }
      }
    });

    graph.data(simpleData);
    graph.render();
    graph.on('canvas:click', e => {
      fetch(complexDataUrl)
        .then(res => res.json())
        .then(data => {
          layout.layout(data);
          graph.data(data);
          graph.render();
        });
    });
    graph.destroy();
  });
  it('update cfg', () => {
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true
        }
      }
    });

    const layout = new ForceAtlas2Layout();

    fetch(complexDataUrl)
      .then(res => res.json())
      .then(data => {
        layout.layout(data);
        graph.data(data);
        graph.render();
        graph.destroy();
      });

    graph.on('canvas:click', e => {
      layout.updateCfg({
        center: [300, 300],
        preventOverlap: true
      });
      layout.execute();
      graph.refreshPositions();
    });
  });
});
