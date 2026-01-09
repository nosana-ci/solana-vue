import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import dts from 'vite-plugin-dts';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['vite.config.ts', 'vitest.config.ts', 'tests/**'],
      outDir: 'dist',
      copyDtsFiles: true,
      insertTypesEntry: true,
    }),
  ],
  build: {
    cssCodeSplit: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      name: 'SolanaVue',
      fileName: 'index',
    },
    rollupOptions: {
      external: [
        'vue',
        '@nosana/wallet-standard-vue',
        '@solana/kit',
        '@solana/promises',
        '@solana/wallet-standard-chains',
        '@solana/wallet-standard-features',
        '@wallet-standard/errors',
        '@wallet-standard/ui-features',
        '@wallet-standard/ui-registry',
      ],
      output: {
        exports: 'named',
        globals: {
          vue: 'Vue',
        },
      },
    },
  },
});
