import { sort } from '../../../../packages/layout/src/antv-dagre/order/sort';

describe('sort', function () {
  test('sorts nodes by barycenter', function () {
    let input = [
      { vs: ['a'], i: 0, barycenter: 2, weight: 3 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ];
    expect(sort(input)).toEqual({
      vs: ['b', 'a'],
      barycenter: (2 * 3 + 1 * 2) / (3 + 2),
      weight: 3 + 2,
    });
  });

  test('can sort super-nodes', function () {
    let input = [
      { vs: ['a', 'c', 'd'], i: 0, barycenter: 2, weight: 3 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 2 },
    ];
    expect(sort(input)).toEqual({
      vs: ['b', 'a', 'c', 'd'],
      barycenter: (2 * 3 + 1 * 2) / (3 + 2),
      weight: 3 + 2,
    });
  });

  test('biases to the left by default', function () {
    let input = [
      { vs: ['a'], i: 0, barycenter: 1, weight: 1 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 1 },
    ];
    expect(sort(input)).toEqual({
      vs: ['a', 'b'],
      barycenter: 1,
      weight: 2,
    });
  });

  test('biases to the right if biasRight = true', function () {
    let input = [
      { vs: ['a'], i: 0, barycenter: 1, weight: 1 },
      { vs: ['b'], i: 1, barycenter: 1, weight: 1 },
    ];
    expect(sort(input, true)).toEqual({
      vs: ['b', 'a'],
      barycenter: 1,
      weight: 2,
    });
  });

  test('can sort nodes without a barycenter', function () {
    let input = [
      { vs: ['a'], i: 0, barycenter: 2, weight: 1 },
      { vs: ['b'], i: 1, barycenter: 6, weight: 1 },
      { vs: ['c'], i: 2 },
      { vs: ['d'], i: 3, barycenter: 3, weight: 1 },
    ];
    expect(sort(input)).toEqual({
      vs: ['a', 'd', 'c', 'b'],
      barycenter: (2 + 6 + 3) / 3,
      weight: 3,
    });
  });

  test('can handle no barycenters for any nodes', function () {
    let input = [
      { vs: ['a'], i: 0 },
      { vs: ['b'], i: 3 },
      { vs: ['c'], i: 2 },
      { vs: ['d'], i: 1 },
    ];
    expect(sort(input)).toEqual({ vs: ['a', 'd', 'c', 'b'] });
  });

  test('can handle a barycenter of 0', function () {
    let input = [
      { vs: ['a'], i: 0, barycenter: 0, weight: 1 },
      { vs: ['b'], i: 3 },
      { vs: ['c'], i: 2 },
      { vs: ['d'], i: 1 },
    ];
    expect(sort(input)).toEqual({
      vs: ['a', 'd', 'c', 'b'],
      barycenter: 0,
      weight: 1,
    });
  });
});
