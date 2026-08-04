import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import svgr from 'vite-plugin-svgr';

import { dependencies, peerDependencies } from './package.json';

const externalPackages = [
  ...Object.keys(dependencies),
  ...Object.keys(peerDependencies),
];

export default defineConfig({
  plugins: [
    react(),
    svgr(),
    dts({
      exclude: [
        '.cursor/**',
        '**/*.stories.tsx',
        '**/*.spec.tsx',
        '**/*.test.tsx',
      ],
      aliasesExclude: ['react', 'react-dom', '@floating-ui/react'],
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      react: path.resolve(__dirname, './node_modules/react'),
      'react-dom': path.resolve(__dirname, './node_modules/react-dom'),
      '@floating-ui/react': path.resolve(
        __dirname,
        './node_modules/@floating-ui/react',
      ),
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'aiDialReactFileManager',
      fileName: 'ai-dial-react-file-manager.es',
      formats: ['es'],
    },
    rollupOptions: {
      external: (id) =>
        externalPackages.some(
          (packageName) =>
            id === packageName || id.startsWith(`${packageName}/`),
        ),
    },
  },
});
