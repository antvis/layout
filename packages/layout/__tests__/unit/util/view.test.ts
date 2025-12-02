import { calculateCenter } from '@/src/util/view';

describe('view', () => {
  describe('calculateCenter', () => {
    test('should return provided width, height, and center', () => {
      const result = calculateCenter(800, 600, [100, 200]);

      expect(result).toEqual([800, 600, [100, 200]]);
    });

    test('should calculate center from width and height when center not provided', () => {
      const result = calculateCenter(800, 600, undefined);

      expect(result).toEqual([800, 600, [400, 300]]);
    });

    test('should use window dimensions when width is undefined', () => {
      const originalWindow = global.window;
      global.window = { innerWidth: 1024, innerHeight: 768 } as any;

      const result = calculateCenter(undefined, 600, undefined);

      expect(result[0]).toBe(1024);
      expect(result[1]).toBe(600);

      global.window = originalWindow;
    });

    test('should use window dimensions when height is undefined', () => {
      const originalWindow = global.window;
      global.window = { innerWidth: 1024, innerHeight: 768 } as any;

      const result = calculateCenter(800, undefined, undefined);

      expect(result[0]).toBe(800);
      expect(result[1]).toBe(768);

      global.window = originalWindow;
    });

    test('should use window dimensions for both when both are undefined', () => {
      const originalWindow = global.window;
      global.window = { innerWidth: 1024, innerHeight: 768 } as any;

      const result = calculateCenter(undefined, undefined, undefined);

      expect(result).toEqual([1024, 768, [512, 384]]);

      global.window = originalWindow;
    });

    test('should handle zero dimensions', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = calculateCenter(0, 0, undefined);

      expect(result).toEqual([0, 0, [0, 0]]);

      global.window = originalWindow;
    });

    test('should handle negative center coordinates', () => {
      const result = calculateCenter(800, 600, [-100, -200]);

      expect(result).toEqual([800, 600, [-100, -200]]);
    });

    test('should handle fractional dimensions', () => {
      const result = calculateCenter(800.5, 600.3, undefined);

      expect(result).toEqual([800.5, 600.3, [400.25, 300.15]]);
    });

    test('should handle fractional center coordinates', () => {
      const result = calculateCenter(800, 600, [100.5, 200.3]);

      expect(result).toEqual([800, 600, [100.5, 200.3]]);
    });

    test('should handle large dimensions', () => {
      const result = calculateCenter(10000, 8000, undefined);

      expect(result).toEqual([10000, 8000, [5000, 4000]]);
    });

    test('should prioritize provided center over calculated center', () => {
      const result = calculateCenter(800, 600, [0, 0]);

      expect(result[2]).toEqual([0, 0]);
      expect(result[2]).not.toEqual([400, 300]);
    });

    test('should handle only width provided with center', () => {
      const result = calculateCenter(800, undefined, [100, 100]);

      expect(result[2]).toEqual([100, 100]);
    });

    test('should handle only height provided with center', () => {
      const result = calculateCenter(undefined, 600, [100, 100]);

      expect(result[2]).toEqual([100, 100]);
    });

    test('should handle undefined window when dimensions not provided', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = calculateCenter(undefined, undefined, [100, 200]);

      expect(result[0]).toBeUndefined();
      expect(result[1]).toBeUndefined();
      expect(result[2]).toEqual([100, 200]);

      global.window = originalWindow;
    });

    test('should calculate center with partial window dimensions', () => {
      const originalWindow = global.window;
      global.window = { innerWidth: 1920, innerHeight: 1080 } as any;

      const result = calculateCenter(undefined, 600, undefined);

      expect(result).toEqual([1920, 600, [960, 300]]);

      global.window = originalWindow;
    });

    test('should handle zero width with valid height', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = calculateCenter(0, 600, undefined);

      expect(result).toEqual([0, 600, [0, 300]]);

      global.window = originalWindow;
    });

    test('should handle valid width with zero height', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      const result = calculateCenter(800, 0, undefined);

      expect(result).toEqual([800, 0, [400, 0]]);

      global.window = originalWindow;
    });

    test('should preserve provided dimensions even if unusual', () => {
      const result = calculateCenter(1, 1, undefined);

      expect(result).toEqual([1, 1, [0.5, 0.5]]);
    });

    test('should handle negative dimensions with positive center', () => {
      const result = calculateCenter(-800, -600, [100, 100]);

      expect(result).toEqual([-800, -600, [100, 100]]);
    });
  });
});
