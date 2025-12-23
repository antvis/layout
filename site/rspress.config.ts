import { pluginPlayground } from '@rspress/plugin-playground';
import path from 'path';
import { defineConfig } from 'rspress/config';

const base =
  process.env.RSPRESS_BASE || (process.env.GITHUB_ACTIONS ? '/layout/' : '/');

export default defineConfig({
  root: 'docs',
  base,
  logoText: '@antv/layout',

  // 默认语言
  lang: 'en',

  // 多语言配置
  locales: [
    {
      lang: 'en',
      label: 'English',
      title: 'AntV Layout',
      description: 'Layout algorithms for graphs',
    },
    {
      lang: 'zh',
      label: '简体中文',
      title: 'AntV Layout',
      description: 'AntV 布局算法库',
    },
  ],

  themeConfig: {
    hideNavbar: 'auto',
    outline: true,
    enableScrollToTop: true,
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/antvis/layout',
      },
    ],
  },

  plugins: [pluginPlayground()],

  globalStyles: path.join(__dirname, 'global.css'),
});
