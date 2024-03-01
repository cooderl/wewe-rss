import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const projectRootDir = resolve(__dirname);

const isProd = process.env.NODE_ENV === 'production';

console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);

// https://vitejs.dev/config/
export default defineConfig({
  base: '/dash',
  plugins: [
    react(),
    !isProd
      ? null
      : {
          name: 'renameIndex',
          enforce: 'post',
          generateBundle(options, bundle) {
            const indexHtml = bundle['index.html'];
            indexHtml.fileName = 'index.hbs';
          },
        },
  ],
  resolve: {
    alias: [
      {
        find: '@server',
        replacement: resolve(projectRootDir, '../apps/server/src'),
      },
      {
        find: '@web',
        replacement: resolve(projectRootDir, './src'),
      },
    ],
  },
  build: {
    emptyOutDir: true,
    outDir: resolve(projectRootDir, '..', 'server', 'client'),
  },
});
