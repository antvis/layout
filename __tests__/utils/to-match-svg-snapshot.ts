import type { Canvas } from '@antv/g';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { optimize } from 'svgo';
import { serializeToString } from 'xmlserializer';
import { getSnapshotDir } from './dir';
import { sleep } from './sleep';

// Optional dependency: allow running tests in minimal installs.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const chalk = (() => {
  try {
    // eslint-disable-next-line global-require
    return require('chalk');
  } catch {
    return {
      green: (s: string) => s,
      red: (s: string) => s,
    };
  }
})();

const format = (svg: SVGElement) => {
  return optimize(serializeToString(svg as any), {
    js2svg: {
      pretty: true,
      indent: 2,
    },
    plugins: [
      'cleanupIds',
      'cleanupAttrs',
      'sortAttrs',
      'sortDefsChildren',
      'removeUselessDefs',
      {
        name: 'convertPathData',
        params: {
          floatPrecision: 4,
          forceAbsolutePath: true,

          applyTransforms: false,
          applyTransformsStroked: false,
          straightCurves: false,
          convertToQ: false,
          lineShorthands: false,
          convertToZ: false,
          curveSmoothShorthands: false,
          smartArcRounding: false,
          removeUseless: false,
          collapseRepeated: false,
          utilizeAbsolute: false,
          negativeExtraSpace: false,
        },
      },
      {
        name: 'convertTransform',
        params: {
          floatPrecision: 4,

          convertToShorts: false,
          matrixToTransform: false,
          shortTranslate: false,
          shortScale: false,
          shortRotate: false,
          removeUseless: false,
          collapseIntoOne: false,
        },
      },
      {
        name: 'cleanupNumericValues',
        params: {
          floatPrecision: 4,
        },
      },
    ],
  }).data;
};

export type ToMatchSVGSnapshotOptions = {
  fileFormat?: string;
};

// @see https://jestjs.io/docs/26.x/expect#expectextendmatchers
export async function toMatchSVGSnapshot(
  canvas: Canvas,
  dir: string,
  name: string,
  options: ToMatchSVGSnapshotOptions = {},
): Promise<{ message: () => string; pass: boolean }> {
  await sleep(300);

  const { fileFormat = 'svg' } = options;
  const namePath = join(dir, name);
  const actualPath = join(dir, `${name}-actual.${fileFormat}`);
  const expectedPath = join(dir, `${name}.${fileFormat}`);

  let actual: string = '';

  // Clone <svg>
  const svg = (
    canvas.getContextService().getDomElement() as unknown as SVGElement
  ).cloneNode(true) as SVGElement;
  const gRoot = svg.querySelector('#g-root');
  // remove css style
  svg.style.gridArea = '';

  const dom = (
    canvas.getContextService().getDomElement() as unknown as SVGElement
  ).cloneNode(true) as SVGElement;
  // @ts-expect-error dom is SVGElement
  gRoot?.append(...(dom.querySelector('#g-root')?.childNodes || []));

  actual += svg ? format(svg) : '';

  try {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    if (!existsSync(expectedPath)) {
      if (process.env.CI === 'true') {
        throw new Error(`Please generate golden image for ${namePath}`);
      }
      console.warn(`! generate ${namePath}`);
      writeFileSync(expectedPath, actual);
      return {
        message: () => `generate ${namePath}`,
        pass: true,
      };
    } else {
      const expected = readFileSync(expectedPath, {
        encoding: 'utf8',
        flag: 'r',
      });
      if (actual === expected) {
        if (existsSync(actualPath)) unlinkSync(actualPath);
        return {
          message: () => `match ${namePath}`,
          pass: true,
        };
      }

      // Perverse actual file.
      if (actual) writeFileSync(actualPath, actual);

      const formatPath = (p: string) => p.split('/g6/')[1];
      return {
        message: () =>
          `mismatch: \n expected: ${chalk.green(
            formatPath(expectedPath),
          )}\n received: ${chalk.red(formatPath(actualPath))}`,
        pass: false,
      };
    }
  } catch (e) {
    return {
      message: () => `${e}`,
      pass: false,
    };
  }
}

export async function toMatchSnapshot(
  canvas: Canvas,
  dir: string,
  detail?: string,
  options: ToMatchSVGSnapshotOptions = {},
) {
  return await toMatchSVGSnapshot(
    canvas,
    ...getSnapshotDir(dir, detail),
    options,
  );
}
