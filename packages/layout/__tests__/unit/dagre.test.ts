import { Graph } from '@antv/graphlib';
import { DagreLayout } from '../../src/dagre';
import type { EdgeData, NodeData } from '../../src/types';

const data = {
  nodes: [
    { id: 'kspacey', data: { label: 'Kevin Spacey', width: 144, height: 100 } },
    {
      id: 'swilliams',
      data: { label: 'Saul Williams', width: 160, height: 100 },
    },
    { id: 'bpitt', data: { label: 'Brad Pitt', width: 108, height: 100 } },
    { id: 'hford', data: { label: 'Harrison Ford', width: 168, height: 100 } },
    { id: 'lwilson', data: { label: 'Luke Wilson', width: 144, height: 100 } },
    { id: 'kbacon', data: { label: 'Kevin Bacon', width: 121, height: 100 } },
  ],
  edges: [
    {
      id: 'kspacey->swilliams',
      source: 'kspacey',
      target: 'swilliams',
      data: {},
    },
    {
      id: 'swilliams->kbacon',
      source: 'swilliams',
      target: 'kbacon',
      data: {},
    },
    { id: 'bpitt->kbacon', source: 'bpitt', target: 'kbacon', data: {} },
    { id: 'hford->lwilson', source: 'hford', target: 'lwilson', data: {} },
    { id: 'lwilson->kbacon', source: 'lwilson', target: 'kbacon', data: {} },
  ],
};

describe('DagreLayout', () => {
  test('default layout', async () => {
    const graph = new Graph<NodeData, EdgeData>(data);

    const dagre = new DagreLayout({});

    const positions = await dagre.execute(graph, { width: 100, height: 100 });

    expect(positions).toEqual({
      nodes: [
        {
          id: 'kspacey',
          data: {
            label: 'Kevin Spacey',
            width: 144,
            height: 100,
            x: 80,
            y: 50,
          },
        },
        {
          id: 'swilliams',
          data: {
            label: 'Saul Williams',
            width: 160,
            height: 100,
            x: 80,
            y: 200,
          },
        },
        {
          id: 'bpitt',
          data: { label: 'Brad Pitt', width: 108, height: 100, x: 264, y: 200 },
        },
        {
          id: 'hford',
          data: {
            label: 'Harrison Ford',
            width: 168,
            height: 100,
            x: 440,
            y: 50,
          },
        },
        {
          id: 'lwilson',
          data: {
            label: 'Luke Wilson',
            width: 144,
            height: 100,
            x: 440,
            y: 200,
          },
        },
        {
          id: 'kbacon',
          data: {
            label: 'Kevin Bacon',
            width: 121,
            height: 100,
            x: 264,
            y: 350,
          },
        },
      ],
      edges: [
        {
          id: 'kspacey->swilliams',
          source: 'kspacey',
          target: 'swilliams',
          data: {
            points: [
              { x: 80, y: 100 },
              { x: 80, y: 125 },
              { x: 80, y: 150 },
            ],
          },
        },
        {
          id: 'swilliams->kbacon',
          source: 'swilliams',
          target: 'kbacon',
          data: {
            points: [
              { x: 80, y: 250 },
              { x: 80, y: 275 },
              { x: 203.5, y: 325.3396739130435 },
            ],
          },
        },
        {
          id: 'bpitt->kbacon',
          source: 'bpitt',
          target: 'kbacon',
          data: {
            points: [
              { x: 264, y: 250 },
              { x: 264, y: 275 },
              { x: 264, y: 300 },
            ],
          },
        },
        {
          id: 'hford->lwilson',
          source: 'hford',
          target: 'lwilson',
          data: {
            points: [
              { x: 440, y: 100 },
              { x: 440, y: 125 },
              { x: 440, y: 150 },
            ],
          },
        },
        {
          id: 'lwilson->kbacon',
          source: 'lwilson',
          target: 'kbacon',
          data: {
            points: [
              { x: 440, y: 250 },
              { x: 440, y: 275 },
              { x: 324.5, y: 324.21875 },
            ],
          },
        },
      ],
    });
  });
});
