import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  DialFileManagerSearchBar,
  type DialFileManagerSearchBarProps,
} from './FileManagerSearchBar';

const meta = {
  title: 'FileManager/components/FileManagerSearchBar',
  component: DialFileManagerSearchBar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The full-width search row that heads the File Manager grid card. The input is controlled by the parent.',
      },
    },
  },
  argTypes: {
    elementId: { control: { type: 'text' } },
    value: { control: { type: 'text' } },
    placeholder: { control: { type: 'text' } },
    disabled: { control: { type: 'boolean' } },
    invalid: { control: { type: 'boolean' } },
    searchClassName: { control: { type: 'text' } },
    searchContainerClassName: { control: { type: 'text' } },
    className: { control: { type: 'text' } },
    onSearchChange: { action: 'onSearchChange' },
  },
  args: {
    elementId: 'storybook-fm-search',
    value: '',
    placeholder: 'Search in My files...',
  },
} satisfies Meta<DialFileManagerSearchBarProps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const ControlledComponent = (args: DialFileManagerSearchBarProps) => {
  const [query, setQuery] = useState(args.value as string);

  return (
    <DialFileManagerSearchBar
      {...args}
      value={query}
      onSearchChange={setQuery}
    />
  );
};

export const Controlled: Story = {
  render: (args) => <ControlledComponent {...args} />,
};

export const WithQuery: Story = {
  args: { value: 'diagram' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Invalid: Story = {
  args: { value: 'unsupported/*', invalid: true },
};
