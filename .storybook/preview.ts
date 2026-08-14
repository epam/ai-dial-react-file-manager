import type { Preview } from '@storybook/react-vite';
import '@epam/ai-dial-ui-kit/styles.css';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: ['DIAL'],
      },
    },
    backgrounds: {
      options: {
        light: { name: 'Light', value: '#F5F7FA' },
      },
    },
    a11y: {
      test: 'todo',
    },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
  tags: ['autodocs'],
};

export default preview;
