import type { StorybookConfig } from '@storybook/react-vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const isDeclarationPlugin = (plugin: unknown) =>
  typeof plugin === 'object' &&
  plugin !== null &&
  'name' in plugin &&
  plugin.name === 'vite:dts';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    'storybook-addon-pseudo-states',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
  viteFinal: async (config) => {
    const storybookConfig = mergeConfig(config, {
      plugins: [svgr()],
      resolve: {
        dedupe: ['react', 'react-dom'],
        alias: {
          react: path.resolve(dirname, '../node_modules/react'),
          'react-dom': path.resolve(dirname, '../node_modules/react-dom'),
          '@floating-ui/react': path.resolve(
            dirname,
            '../node_modules/@floating-ui/react',
          ),
          '@': path.resolve(dirname, '../src'),
        },
      },
    });

    storybookConfig.plugins = storybookConfig.plugins?.filter(
      (plugin) => !isDeclarationPlugin(plugin),
    );
    delete storybookConfig.build?.lib;
    delete storybookConfig.build?.rollupOptions?.external;

    return storybookConfig;
  },
};

export default config;
