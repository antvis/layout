import { Layout } from '../../src';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const simpleData = {
  nodes: [
    {id: 'node1'},
    {id: 'node2'},
    {id: 'node3'},
    {id: 'node4'},
  ],
  edges: [
    {source: 'node1', target: 'node2'},
  ]
}

const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('Force Layout', () => {
  it('force layout with small data', () => {
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });

    const layout = new Layout.ForceLayout({
      center: [250, 250],
      tick: () => {
        graph.refreshPositions();
      },
      onLayoutEnd: () => {
        graph.destroy();
      }
    });
    layout.layout(simpleData);
  
    graph.data(simpleData)
    graph.render();
    
  });
  it.only('force layout with complex data', () => {
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: ['drag-node']
      }
    });
  
    fetch(complexDataUrl)
      .then((res) => res.json())
      .then((data) => {
        const layout = new Layout.ForceLayout({
          center: [250, 250],
          tick: () => {
            graph.refreshPositions();
          },
          onLayoutEnd: () => {
            // graph.destroy();
          }
        });
        layout.layout(data);

        graph.data(data)
        graph.render();

        graph.on('dragstart', e => {
          console.log(e)
          const { item } = e;
          // const model = item.getModel();
          // model.fx = e.x
          // model.fy = e.y
          // layout.execute()
        });
      });
  });
  it('swtich data', () => {
    const layout = new Layout.GridLayout();
    layout.layout(simpleData);
  
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      defaultEdge: {
        style: {
          endArrow: true,
        },
      },
    });
  
    graph.data(simpleData)
    graph.render();
    graph.on('canvas:click', e => {
      fetch(complexDataUrl)
        .then((res) => res.json())
        .then((data) => {
          layout.layout(data);
          graph.data(data)
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
          endArrow: true,
        },
      },
    });
  
    const layout = new Layout.GridLayout({
      rows: 5
    });

    fetch(complexDataUrl)
    .then((res) => res.json())
    .then((data) => {
      layout.layout(data);
      graph.data(data)
      graph.render();
      graph.destroy();
    });

    graph.on('canvas:click', e => {
      layout.updateCfg({
        preventOverlapPadding: 30,
        width: 1000
      });
      layout.execute();
      graph.refreshPositions();
    });
  });
});