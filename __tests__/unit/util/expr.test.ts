import { evaluateExpression } from '@/src/util/expr';

describe('expr', () => {
  describe('evaluateExpression', () => {
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
});
