import { Layout } from '../es'

describe('#GridLayout', () => {
  it('return correct default config', () => {
    const grid = new Layout.GridLayout();
    expect(grid.getDefaultCfg()).toEqual({
      begin: [0, 0],
      cols: undefined,
      condense: false,
      nodeSize: 30,
      position: undefined,
      preventOverlap: true,
      preventOverlapPadding: 10,
      rows: undefined,
      sortBy: 'degree'
    })
  })
})