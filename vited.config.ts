import { defineConfig } from '@vited/core';

export default defineConfig({
  base: '/theme-bootstrap/',
  server: {
    open: true,
  },
  docs: {
    title: 'Vited Bootstrap Theme',
    supportedLocales: ['en', 'zh'],
    theme: '@vited/theme-bootstrap',
  },
});
