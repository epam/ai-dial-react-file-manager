import react from '@vitejs/plugin-react';
import path from 'node:path';
import {
  configDefaults,
  coverageConfigDefaults,
  defineConfig,
} from 'vitest/config';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  root: __dirname,
  plugins: [react(), svgr()],
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
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      reportsDirectory: './coverage/',
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70,
      },
      exclude: [
        ...coverageConfigDefaults.exclude,
        '**/*.stories.tsx',
        'storybook-static/**',
        '.storybook/**',
        '**/index.ts',
        '**/__mocks__/**',
        'src/models/**',
        '*.config.[jt]s',
        'scripts/**',
        'tools/**',
      ],
    },
    exclude: [...configDefaults.exclude],
  },
});
