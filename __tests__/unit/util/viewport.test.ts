/**
 * @jest-environment node
 */
import { normalizeViewport } from '@/src/util/viewport';

describe('viewport', () => {
  describe('normalizeViewport', () => {
    test('should use provided width and height', () => {
      const result = normalizeViewport({
        width: 800,
        height: 600,
      });

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.center).toEqual([400, 300]);
    });

    test('should use provided center point', () => {
      const result = normalizeViewport({
        width: 800,
        height: 600,
        center: [100, 200],
      });

      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
      expect(result.center).toEqual([100, 200]);
    });

    test('should calculate center from width and height when center not provided', () => {
      const result = normalizeViewport({
        width: 1000,
        height: 800,
      });

      expect(result.center).toEqual([500, 400]);
    });

    test('should use zero dimensions when width and height not provided and window is undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (globalThis as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = undefined;
      expect((globalThis as any).window).toBeUndefined();

      const result = normalizeViewport({});

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.center).toEqual([0, 0]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    });

    test('should handle zero width and height', () => {
      const result = normalizeViewport({
        width: 0,
        height: 0,
      });

      expect(result.width).toBe(0);
      expect(result.height).toBe(0);
      expect(result.center).toEqual([0, 0]);
    });

    test('should handle negative center coordinates', () => {
      const result = normalizeViewport({
        width: 800,
        height: 600,
        center: [-100, -200],
      });

      expect(result.center).toEqual([-100, -200]);
    });

    test('should handle only width provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (globalThis as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = undefined;
      expect((globalThis as any).window).toBeUndefined();

      const result = normalizeViewport({
        width: 800,
      });

      expect(result.width).toBe(800);
      expect(result.height).toBe(0);
      expect(result.center).toEqual([400, 0]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    });

    test('should handle only height provided', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const originalWindow = (globalThis as any).window;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = undefined;
      expect((globalThis as any).window).toBeUndefined();

      const result = normalizeViewport({
        height: 600,
      });

      expect(result.width).toBe(0);
      expect(result.height).toBe(600);
      expect(result.center).toEqual([0, 300]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any).window = originalWindow;
    });

    test('should handle large dimensions', () => {
      const result = normalizeViewport({
        width: 10000,
        height: 8000,
      });

      expect(result.width).toBe(10000);
      expect(result.height).toBe(8000);
      expect(result.center).toEqual([5000, 4000]);
    });

    test('should handle fractional dimensions', () => {
      const result = normalizeViewport({
        width: 800.5,
        height: 600.7,
      });

      expect(result.width).toBe(800.5);
      expect(result.height).toBe(600.7);
      expect(result.center).toEqual([400.25, 300.35]);
    });

    test('should handle fractional center coordinates', () => {
      const result = normalizeViewport({
        width: 800,
        height: 600,
        center: [100.5, 200.3],
      });

      expect(result.center).toEqual([100.5, 200.3]);
    });

    test('should override calculated center with provided center', () => {
      const result = normalizeViewport({
        width: 800,
        height: 600,
        center: [0, 0],
      });

      expect(result.center).toEqual([0, 0]);
      expect(result.center).not.toEqual([400, 300]);
    });
  });
});
