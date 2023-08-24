export default {
  nodes: [
    {
      id: '0',
      data: {
        label: '0',
        parentId: 'a',
      },
    },
    {
      id: '1',
      data: {
        label: '1',
        parentId: 'a',
      },
    },
    {
      id: '2',
      data: {
        label: '2',
        parentId: 'a',
      },
    },
    {
      id: '3',
      data: {
        label: '3',
        parentId: 'a',
      },
    },
    {
      id: '4',
      data: {
        label: '4',
        parentId: 'a',
      },
    },
    {
      id: '5',
      data: {
        label: '5',
        parentId: 'a',
      },
    },
    {
      id: '6',
      data: {
        label: '6',
        parentId: 'a',
      },
    },
    {
      id: '7',
      data: {
        label: '7',
        parentId: 'a',
      },
    },
    {
      id: '8',
      data: {
        label: '8',
        parentId: 'a',
      },
    },
    {
      id: '9',
      data: {
        label: '9',
        parentId: 'a',
      },
    },
    {
      id: '10',
      data: {
        label: '10',
        parentId: 'a',
      },
    },
    {
      id: '11',
      data: {
        label: '11',
        parentId: 'a',
      },
    },
    {
      id: '12',
      data: {
        label: '12',
        parentId: 'a',
      },
    },
    {
      id: '13',
      data: {
        label: '13',
        parentId: 'b',
      },
    },
    {
      id: '14',
      data: {
        label: '14',
        parentId: 'b',
      },
    },
    {
      id: '15',
      data: {
        label: '15',
        parentId: 'b',
      },
    },
    {
      id: '16',
      data: {
        label: '16',
        parentId: 'b',
      },
    },
    {
      id: '17',
      data: {
        label: '17',
        parentId: 'b',
      },
    },
    {
      id: '18',
      data: {
        label: '18',
        parentId: 'c',
      },
    },
    {
      id: '19',
      data: {
        label: '19',
        parentId: 'c',
      },
    },
    {
      id: '20',
      data: {
        label: '20',
        parentId: 'c',
      },
    },
    {
      id: '21',
      data: {
        label: '21',
        parentId: 'c',
      },
    },
    {
      id: '22',
      data: {
        label: '22',
        parentId: 'c',
      },
    },
    {
      id: '23',
      data: {
        label: '23',
        parentId: 'c',
      },
    },
    {
      id: '24',
      data: {
        label: '24',
        parentId: 'c',
      },
    },
    {
      id: '25',
      data: {
        label: '25',
        parentId: 'c',
      },
    },
    {
      id: '26',
      data: {
        label: '26',
        parentId: 'c',
      },
    },
    {
      id: '27',
      data: {
        label: '27',
        parentId: 'c',
      },
    },
    {
      id: '28',
      data: {
        label: '28',
        parentId: 'c',
      },
    },
    {
      id: '29',
      data: {
        label: '29',
        parentId: 'c',
      },
    },
    {
      id: '30',
      data: {
        label: '30',
        parentId: 'c',
      },
    },
    {
      id: '31',
      data: {
        label: '31',
        parentId: 'd',
      },
    },
    {
      id: '32',
      data: {
        label: '32',
        parentId: 'd',
      },
    },
    {
      id: '33',
      data: {
        label: '33',
        parentId: 'd',
      },
    },
    {
      id: 'a',
      data: {
        label: 'combo a',
        _isCombo: true,
      },
    },
    {
      id: 'b',
      data: {
        label: 'combo b',
        _isCombo: true,
      },
    },
    {
      id: 'c',
      data: {
        label: 'combo c',
        _isCombo: true,
      },
    },
    {
      id: 'd',
      data: {
        label: 'combo d',
        parentId: 'b',
        _isCombo: true,
      },
    },
  ],
  edges: [
    {
      source: 'a',
      target: 'b',
      size: 3,
      style: {
        stroke: 'red',
      },
    },
    {
      source: 'a',
      target: '33',
      size: 3,
      style: {
        stroke: 'blue',
      },
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
};
