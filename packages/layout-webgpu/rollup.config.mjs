import { readFileSync } from 'fs';
import { string } from "rollup-plugin-string";
import { createConfig } from '../../rollup.config.mjs';

export default createConfig({
  pkg: JSON.parse(
    readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
  ),
  umdName: 'LayoutWebGPU',
  external: ['@antv/layout'],
  globals: {
    '@antv/layout': 'window.Layout',
  },
  plugins: [
    string({
      include: "**/*.wgsl",
    })
  ],
});
