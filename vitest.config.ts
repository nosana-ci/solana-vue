import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': './src',
      '@laurensv/solana-vue': path.resolve(__dirname, './src'),
      '@laurensv/wallet-standard-vue': path.resolve(__dirname, '../wallet-standard-vue/src'),
    },
  },
});
