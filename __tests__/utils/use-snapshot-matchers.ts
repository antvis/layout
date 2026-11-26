import { expect } from 'vitest';
import {
  toMatchSnapshot,
  toMatchSVGSnapshot,
  ToMatchSVGSnapshotOptions,
} from './to-match-svg-snapshot';

declare module 'vitest' {
  interface SnapshotMatcher<R extends void | Promise<void>, T = unknown> {
    (dir: string, detail?: string, options?: ToMatchSVGSnapshotOptions): R;
  }

  interface Assertion {
    toMatchSVGSnapshot(
      dir: string,
      name: string,
      options?: ToMatchSVGSnapshotOptions,
    ): Promise<void>;
  }
}

expect.extend({
  toMatchSVGSnapshot,
  toMatchSnapshot,
});
