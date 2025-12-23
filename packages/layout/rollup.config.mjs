import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';


// 主库配置
const mainConfig = {
  input: 'src/index.ts',
  output: [
    // UMD 格式
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
