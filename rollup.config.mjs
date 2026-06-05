import fs from 'node:fs';
import path from 'node:path';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';

const packageJson = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

const externalPackages = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.peerDependencies ?? {}),
  ...Object.keys(packageJson.optionalDependencies ?? {}),
];

const isExternal = (id) =>
  !id.startsWith('.') &&
  !path.isAbsolute(id) &&
  externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`));

const createPlugins = () => [
  resolve({
    browser: true,
    extensions: ['.mjs', '.js', '.json', '.ts'],
  }),
  commonjs(),
  typescript({
    tsconfig: './tsconfig.rollup.json',
    declaration: false,
  }),
];

const umdConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'Layout',
      sourcemap: true,
    },
    {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'Layout',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: createPlugins(),
};

const esmConfig = {
  input: 'src/index.ts',
  output: [
    {
      dir: 'lib',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
    {
      dir: 'esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
  ],
  external: isExternal,
  plugins: createPlugins(),
};

const workerESMConfig = {
  input: 'src/worker.ts',
  output: [
    {
      file: 'lib/worker.js',
      format: 'esm',
      sourcemap: true,
    },
    {
      file: 'esm/worker.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  external: isExternal,
  plugins: createPlugins(),
};

const workerIIFEConfig = {
  input: 'src/worker.ts',
  output: {
    file: 'dist/worker.js',
    format: 'iife',
    sourcemap: true,
    name: 'LayoutWorker',
    plugins: [terser()],
  },
  plugins: createPlugins(),
};

const dtsConfig = {
  input: 'src/index.ts',
  output: {
    dir: 'lib',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  external: isExternal,
  plugins: [dts({ tsconfig: './tsconfig.rollup.json' })],
};

export default [umdConfig, esmConfig, workerESMConfig, workerIIFEConfig, dtsConfig];
