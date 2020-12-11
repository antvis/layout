import { Layout } from '../src'

describe('#GridLayout', () => {
  it('return correct default config', () => {
    const grid = new Layout({
      type: 'grid'
    })
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