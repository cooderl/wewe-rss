import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const projectRootDir = resolve(__dirname);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
});
