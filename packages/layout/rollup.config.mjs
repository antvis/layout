import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';

const external = ['comlink'];

// 主库配置
const mainConfig = {
  input: 'src/index.ts',
  external,
  output: [
    // UMD 格式
    {
      file: 'dist/index.js',
      format: 'umd',
      name: 'Layout',
      sourcemap: true,
      globals: { comlink: 'Comlink' },
    },
    {
      file: 'dist/index.min.js',
      format: 'umd',
      name: 'Layout',
      sourcemap: true,
      globals: { comlink: 'Comlink' },
      plugins: [terser()],
    },
    // ESM 格式
    {
      dir: 'lib',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.rollup.json',
      declaration: false,
    }),
  ],
};

// Worker ESM
const workerESMConfig = {
  input: 'src/worker.ts',
  external,
  output: {
    file: 'lib/worker.js',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.rollup.json',
      declaration: false,
    }),
  ],
};

// Worker IIFE
const workerIIFEConfig = {
  input: 'src/worker.ts',
  external: [], // Worker 需要打包所有依赖
  output: {
    file: 'dist/worker.js',
    format: 'iife',
    sourcemap: true,
    name: 'LayoutWorker',
    plugins: [terser()], // 压缩 Worker
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.rollup.json',
      declaration: false,
    }),
  ],
};

const dtsConfig = {
  input: 'src/index.ts',
  output: {
    dir: 'lib',
    format: 'esm',
    preserveModules: true,
    preserveModulesRoot: 'src',
  },
  plugins: [dts({ tsconfig: './tsconfig.rollup.json' })],
};

export default [
  mainConfig,
  workerESMConfig,
  workerIIFEConfig,
  dtsConfig,
];
