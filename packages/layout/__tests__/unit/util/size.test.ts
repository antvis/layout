import { parseSize } from '../../../src/util/size';

describe('size', () => {
  it('parseSize', () => {
    expect(parseSize()).toEqual([0, 0, 0]);
    expect(parseSize(1)).toEqual([1, 1, 1]);
    expect(parseSize([1])).toEqual([1, 1, 1]);
    expect(parseSize([1, 2])).toEqual([1, 2, 1]);
    expect(parseSize([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
