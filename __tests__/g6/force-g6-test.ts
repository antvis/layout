import { ForceLayout, GridLayout } from '../../src';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const simpleData = {
  nodes: [{ id: 'node1' }, { id: 'node2' }, { id: 'node3' }, { id: 'node4' }],
  edges: [{ source: 'node1', target: 'node2' }]
};

const complexDataUrl = 'https://gw.alipayobjects.com/os/antvdemo/assets/data/relations.json';

describe('Force Layout', () => {
  it('force layout with small data', () => {
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

    // @ts-ignore
    const layout = new ForceLayout({
      center: [250, 250],
      tick: () => {
        graph.refreshPositions();
      },
      onLayoutEnd: () => {
        graph.destroy();
      }
    });
    layout.layout(simpleData);
    graph.data(simpleData);
    graph.render();
  });
  it('force layout with complex data with pre grid layout', () => {
    const graph = new G6.Graph({
      container: div,
      width: 500,
      height: 500,
      modes: {
        default: ['drag-node']
      }
    });

    fetch(complexDataUrl)
      .then(res => res.json())
      .then(data => {
        // @ts-ignore
        const preLayout = new GridLayout({
          width: 500,
          height: 500
        });
        preLayout.layout(data);
        // @ts-ignore
        const layout = new ForceLayout({
          center: [250, 250],
          tick: () => {
            graph.refreshPositions();
          },
          onLayoutEnd: () => {
            graph.destroy();
          }
        });
        layout.layout(data);

        graph.data(data);
        graph.render();

        graph.on('dragstart', e => {
          const { item } = e;
          // @ts-ignore
          const model = item.getModel();
          model.fx = e.x;
          model.fy = e.y;
          layout.execute();
        });
      });
  });
  it('swtich data', () => {
    // @ts-ignore
    const layout = new ForceLayout({
      center: [250, 250],
      tick: () => {
        graph.refreshPositions();
      },
      onLayoutEnd: () => {
        graph.destroy();
      }
    });
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
          graph.changeData(data);
          layout.layout(data);
        });
    });
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

    // @ts-ignore
    const layout = new ForceLayout({
      preventOverlap: false,
      center: [250, 250],
      tick: () => {
        graph.refreshPositions();
      }
    });

    fetch(complexDataUrl)
      .then(res => res.json())
      .then(data => {
        data.nodes.forEach((node: any) => {
          node.size = Math.random() * 20 + 20;
        });
        layout.layout(data);
        graph.data(data);
        graph.render();
        graph.destroy();
      });

    graph.on('canvas:click', e => {
      // @ts-ignore
      layout.updateCfg({
        preventOverlap: true,
        nodeSize: (node: any) => {
          return node.size / 2;
        },
        nodeSpacing: (node: any) => {
          return node.size / 5;
        },
        onLayoutEnd: () => {
          graph.destroy();
        }
      });
      layout.execute();
      graph.refreshPositions();
    });
  });
});
