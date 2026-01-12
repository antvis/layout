import { evaluateExpression, format } from '@/src';

describe('util/expr', () => {
  test('evaluateExpression returns result for valid expression', () => {
    expect(evaluateExpression('x + y', { x: 10, y: 20 })).toBe(30);
  });

  test('evaluateExpression supports dot notation and array access', () => {
    const data = { values: [1, 2, 3], status: 'active' };
    expect(
      evaluateExpression('data.values[0] + data.values[1]', { data }),
    ).toBe(3);
  });

  test('evaluateExpression returns undefined for non-string/empty/invalid expression', () => {
    expect(evaluateExpression(123, { x: 1 })).toBeUndefined();
    expect(evaluateExpression('   ', { x: 1 })).toBeUndefined();
    expect(evaluateExpression('x +', { x: 1 })).toBeUndefined();
  });
});

describe('util/format', () => {
  test('format converts string expression to function by default', () => {
    const fn = format('x + y') as (ctx: { x: number; y: number }) => unknown;
    expect(typeof fn).toBe('function');
    expect(fn({ x: 1, y: 2 })).toBe(3);
  });

  test('format returns function as-is', () => {
    const original = (ctx: { x: number }) => ctx.x;
    expect(format(original)).toBe(original);
  });

  test('format returns other types as-is', () => {
    expect(format(123)).toBe(123);
    expect(format({ a: 1 })).toEqual({ a: 1 });
  });

  test('format returns string as-is when mode is string', () => {
    expect(format('x + y', 'string')).toBe('x + y');
  });
});
