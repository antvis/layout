import { pluginPlayground } from '@rspress/plugin-playground';
import path from 'path';
import { defineConfig } from 'rspress/config';

export default defineConfig({
  root: 'docs',
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
    enableContentAnimation: true,
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
