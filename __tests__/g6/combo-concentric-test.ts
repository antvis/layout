import { CircularLayout, ComboCombinedLayout, ConcentricLayout, ForceAtlas2Layout, FruchtermanGPULayout, FruchtermanLayout, GForceLayout, GridLayout, RadialLayout } from '../../src';
import G6 from '@antv/g6';

const div = document.createElement('div');
div.id = 'global-spec';
document.body.appendChild(div);

const data = {
  nodes: [
    {
      id: '0',
      comboId: 'a',
    },
    {
      id: '1',
      comboId: 'a',
    },
    {
      id: '2',
      comboId: 'a',
    },
    {
      id: '3',
      comboId: 'a',
    },
    {
      id: '4',
      comboId: 'a',
    },
    {
      id: '5',
      comboId: 'a',
    },
    {
      id: '6',
      comboId: 'a',
    },
    {
      id: '7',
      comboId: 'a',
    },
    {
      id: '8',
      comboId: 'a',
    },
    {
      id: '9',
      comboId: 'a',
    },
    {
      id: '10',
      comboId: 'a',
    },
    {
      id: '11',
      comboId: 'a',
    },
    {
      id: '12',
      comboId: 'a',
    },
    {
      id: '13',
      comboId: 'a',
    },
    {
      id: '14',
      comboId: 'a',
    },
    {
      id: '15',
      comboId: 'a',
    },
    {
      id: '16',
      comboId: 'b',
    },
    {
      id: '17',
      comboId: 'b',
    },
    {
      id: '18',
      comboId: 'b',
    },
    {
      id: '19',
      comboId: 'b',
    },
    {
      id: '20',
    },
    {
      id: '21',
    },
    {
      id: '22',
    },
    {
      id: '23',
      comboId: 'c',
    },
    {
      id: '24',
      comboId: 'a',
    },
    {
      id: '25',
    },
    {
      id: '26',
    },
    {
      id: '27',
      comboId: 'c',
    },
    {
      id: '28',
      comboId: 'c',
    },
    {
      id: '29',
      comboId: 'c',
    },
    {
      id: '30',
      comboId: 'c',
    },
    {
      id: '31',
      comboId: 'c',
    },
    {
      id: '32',
      comboId: 'd',
    },
    {
      id: '33',
      comboId: 'd',
    },
  ],
  edges: [
    {
      source: 'a',
      target: 'b',
      // label: 'Combo A - Combo B',
      size: 3,
      // labelCfg: {
      //   autoRotate: true,
      //   style: {
      //     stroke: '#fff',
      //     lineWidth: 5,
      //     fontSize: 20,
      //   },
      // },
      // style: {
      //   stroke: 'red',
      // },
    },
    {
      source: 'a',
      target: '33',
      // label: 'Combo-Node',
      size: 3,
      // labelCfg: {
      //   autoRotate: true,
      //   style: {
      //     stroke: '#fff',
      //     lineWidth: 5,
      //     fontSize: 20,
      //   },
      // },
      // style: {
      //   stroke: 'blue',
      // },
    },
    {
      source: '0',
      target: '1',
    },
    {
      source: '0',
      target: '2',
    },
    {
      source: '0',
      target: '3',
    },
    {
      source: '0',
      target: '4',
    },
    {
      source: '0',
      target: '5',
    },
    {
      source: '0',
      target: '7',
    },
    {
      source: '0',
      target: '8',
    },
    {
      source: '0',
      target: '9',
    },
    {
      source: '0',
      target: '10',
    },
    {
      source: '0',
      target: '11',
    },
    {
      source: '0',
      target: '13',
    },
    {
      source: '0',
      target: '14',
    },
    {
      source: '0',
      target: '15',
    },
    {
      source: '0',
      target: '16',
    },
    {
      source: '2',
      target: '3',
    },
    {
      source: '4',
      target: '5',
    },
    {
      source: '4',
      target: '6',
    },
    {
      source: '5',
      target: '6',
    },
    {
      source: '7',
      target: '13',
    },
    {
      source: '8',
      target: '14',
    },
    {
      source: '9',
      target: '10',
    },
    {
      source: '10',
      target: '22',
    },
    {
      source: '10',
      target: '14',
    },
    {
      source: '10',
      target: '12',
    },
    {
      source: '10',
      target: '24',
    },
    {
      source: '10',
      target: '21',
    },
    {
      source: '10',
      target: '20',
    },
    {
      source: '11',
      target: '24',
    },
    {
      source: '11',
      target: '22',
    },
    {
      source: '11',
      target: '14',
    },
    {
      source: '12',
      target: '13',
    },
    {
      source: '16',
      target: '17',
    },
    {
      source: '16',
      target: '18',
    },
    {
      source: '16',
      target: '21',
    },
    {
      source: '16',
      target: '22',
    },
    {
      source: '17',
      target: '18',
    },
    {
      source: '17',
      target: '20',
    },
    {
      source: '18',
      target: '19',
    },
    {
      source: '19',
      target: '20',
    },
    {
      source: '19',
      target: '33',
    },
    {
      source: '19',
      target: '22',
    },
    {
      source: '19',
      target: '23',
    },
    {
      source: '20',
      target: '21',
    },
    {
      source: '21',
      target: '22',
    },
    {
      source: '22',
      target: '24',
    },
    {
      source: '22',
      target: '25',
    },
    {
      source: '22',
      target: '26',
    },
    {
      source: '22',
      target: '23',
    },
    {
      source: '22',
      target: '28',
    },
    {
      source: '22',
      target: '30',
    },
    {
      source: '22',
      target: '31',
    },
    {
      source: '22',
      target: '32',
    },
    {
      source: '22',
      target: '33',
    },
    {
      source: '23',
      target: '28',
    },
    {
      source: '23',
      target: '27',
    },
    {
      source: '23',
      target: '29',
    },
    {
      source: '23',
      target: '30',
    },
    {
      source: '23',
      target: '31',
    },
    {
      source: '23',
      target: '33',
    },
    {
      source: '32',
      target: '33',
    },
  ],
  combos: [
    {
      id: 'a',
      label: 'Combo A',
    },
    {
      id: 'b',
      label: 'Combo B',
    },
    {
      id: 'c',
      label: 'Combo C',
    },
    {
      id: 'd',
      label: 'Combo D',
      parentId: 'b',
    },
  ],
};

const simpleData = {
  nodes: [
    {
      id: '0',
      comboId: 'b',
    },
    {
      id: '1',
      comboId: 'b',
    },
    {
      id: '2',
      comboId: 'b',
    },
    {
      id: '3',
      comboId: 'b',
    },
    {
      id: '4',
      comboId: 'c',
    },
    {
      id: '5',
      comboId: 'c',
    },
    {
      id: '6',
      comboId: 'c',
    },
  ],
  edges: [
    // {
    //   source: '0',
    //   target: '1',
    // },
    // {
    //   source: '1',
    //   target: '2',
    // },
    // {
    //   source: '0',
    //   target: '3',
    // },
    // {
    //   source: '0',
    //   target: '4',
    // },
    {
      source: '6',
      target: '5',
    }
 ],
 combos: [
  //  {
  //    id: 'a',
  //    label: 'Combo A',
  //  },
   {
     id: 'b',
     label: 'Combo B',
   },
   {
     id: 'c',
     label: 'Combo C',
     parentId: 'b'
   },
  ]
}

const simpleData2 = {
  nodes: [
    {
      id: '0',
      comboId: 'a',
    },
    {
      id: '1',
      comboId: 'a',
    },
    {
      id: '2',
      comboId: 'b',
    },
    {
      id: '3',
      comboId: 'b',
    },
    {
      id: '4',
      comboId: 'b',
    },
    {
      id: '5',
    },
    {
      id: '6',
    },
  ],
  edges: [
    {
      source: '0',
      target: '1',
    },
    {
      source: '1',
      target: '2',
    },
    {
      source: '0',
      target: '3',
    },
    {
      source: '0',
      target: '4',
    },
    {
      source: '6',
      target: '5',
    }
 ],
 combos: [
   {
     id: 'a',
     label: 'Combo A',
   },
   {
     id: 'b',
     label: 'Combo B',
     parentId: 'a'
   },
   {
     id: 'c',
     label: 'Combo C',
   },
  ]
}

const concentricData = {
  nodes: [
    {
      id: '0'
    },
    {
      id: '1'
    },
    {
      id: '2'
    },
    {
      id: '3'
    },
    {
      id: '4'
    },
    {
      id: '5'
    },
    {
      id: '6'
    },
  ],
  edges: [
    {
      source: '0',
      target: '1',
    },
    {
      source: '1',
      target: '2',
    },
    {
      source: '0',
      target: '3',
    },
    {
      source: '0',
      target: '4',
    },
    {
      source: '6',
      target: '5',
    }
 ],
}
describe('combo concentric force layout', () => {
  // simpleData.combos.forEach(combo => combo.collapsed = true);
  simpleData2.combos[2].x = 400
  simpleData2.combos[2].y = 200
  simpleData2.combos[1].collapsed = true;
  simpleData2.combos[1].x = 200;
  simpleData2.combos[1].y = 400;
  simpleData2.nodes.forEach(node => {
    node.label = node.id;
  });
  // 借助 G6 得到 comboTrees
  const graph = new G6.Graph({
    container: div,
    width: 500,
    height: 500,
    defaultEdge: {
      style: {
        endArrow: true,
      },
    },
    modes: {
      default: ['zoom-canvas', 'drag-canvas', 'drag-combo', 'drag-node', 'collapse-expand-combo']
    }
  });
  graph.data(simpleData2);
  graph.render();

  it.only('forceAtlas2 consistancy', () => {
    const con = new ForceAtlas2Layout({
      preventOverlap: true,
      kr: 10
    });
    con.layout(concentricData);
    graph.refreshPositions();

    graph.on('canvas:click', e => {
      concentricData.nodes.forEach((node, i) => {
        if (i === 0) node.size = 10 + 50 * Math.random();
        else {
          node.fx = node.x;
          node.fy = node.y;
        }
        // node.size = 10 + 30 * Math.random()
      })
      // const spliceId = '1';
      // const newData = {
      //   nodes: concentricData.nodes.filter(node => node.id !== spliceId),
      //   edges: concentricData.edges.filter(edge => edge.source !== spliceId && edge.target !== spliceId)
      // }
      con.layout(concentricData);
      graph.changeData(concentricData);
      console.log(JSON.stringify(concentricData));
    });
  });

  it('default outer + default inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 20,
      spacing: 30,
      innerLayout: new RadialLayout({ unitRadius: 50 }),
      animate: true
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(graph.save()));
    graph.refreshPositions();
  });
  it('default outer + radial inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 50,
      spacing: 50,
      // innerLayout: new RadialLayout({ unitRadius: 60 })
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(data));
    graph.refreshPositions();


    graph.on('aftercollapseexpandcombo', e => {
      layout.layout(graph.save());
      graph.refreshPositions();
    })

  });
  it('default outer + circular inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 50,
      spacing: 50,
      innerLayout: new CircularLayout()//new GridLayout()
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(data));
    graph.refreshPositions();
  });
  it('default outer + grid inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 50,
      spacing: 10,
      innerLayout: new GridLayout()
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(data));
    graph.refreshPositions();
  });
  it('grid outer + default inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 50,
      outerLayout: new GridLayout({ width: 1000, height: 1000 }) 
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(data));
    graph.refreshPositions();
  });
  it('grid outer + circular inner', () => {
    const layout = new ComboCombinedLayout({
      comboTrees: graph.get('comboTrees'),
      comboPadding: 50,
      outerLayout: new GridLayout({ width: 1000, height: 1000 }),
      innerLayout: new CircularLayout();
    });
    layout.layout(data);
    // console.log(data);
    // console.log(JSON.stringify(data));
    graph.refreshPositions();

  });
});