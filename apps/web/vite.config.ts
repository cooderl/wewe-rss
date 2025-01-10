import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync } from 'fs';

const projectRootDir = resolve(__dirname);

const isProd = process.env.NODE_ENV === 'production';
const baseUrl = loadEnv('mode', process.cwd()).VITE_WEWERSS_BASE_URL || '';
console.log('process.env.NODE_ENV: ', process.env.NODE_ENV);

const packageJson = JSON.parse(
  readFileSync(resolve(__dirname, './package.json'), 'utf-8'),
);

// https://vitejs.dev/config/
export default defineConfig({
  base: `${baseUrl}/dash`,
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
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
