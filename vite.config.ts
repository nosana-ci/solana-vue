import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import typescript2 from 'rollup-plugin-typescript2';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    vue(),
    typescript2({
      check: false,
      include: ['src/components/*.vue', 'src/components/**/*.vue', 'src/*.ts', 'src/**/*.ts'],
      tsconfigOverride: {
        compilerOptions: {
          outDir: 'dist',
          sourceMap: true,
          declaration: true,
          declarationMap: true,
        },
      },
      exclude: ['vite.config.ts', 'vitest.config.ts'],
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
