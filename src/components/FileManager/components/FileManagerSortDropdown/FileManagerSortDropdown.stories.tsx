import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import {
  type FileManagerSort,
  FileManagerSortDirection,
  FileManagerSortField,
} from '@/types/file-manager';
import {
  DialFileManagerSortDropdown,
  type DialFileManagerSortDropdownProps,
} from './FileManagerSortDropdown';

const meta = {
  title: 'FileManager/components/FileManagerSortDropdown',
  component: DialFileManagerSortDropdown,
  parameters: {
    docs: {
      description: {
        component:
          'The "Sort" menu beside the File Manager search field: the sort fields, a divider, then the directions, each group marked with a trailing check. The sort is controlled by the parent.',
      },
    },
  },
  argTypes: {
    label: { control: { type: 'text' } },
    disabled: { control: { type: 'boolean' } },
    onSortChange: { action: 'onSortChange' },
  },
  args: {
    sort: {
      field: FileManagerSortField.Name,
      direction: FileManagerSortDirection.Asc,
    },
  },
} satisfies Meta<DialFileManagerSortDropdownProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const ControlledComponent = (args: DialFileManagerSortDropdownProps) => {
  const [sort, setSort] = useState<FileManagerSort>(args.sort);

  return (
    <div className="flex justify-end p-4">
      <DialFileManagerSortDropdown
        {...args}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          args.onSortChange?.(next);
        }}
      />
    </div>
  );
};

export const Default: Story = {
  render: ControlledComponent,
};

export const CustomLabels: Story = {
  render: ControlledComponent,
  args: {
    label: 'Order',
    fieldLabels: { [FileManagerSortField.UpdatedAt]: 'Last changed' },
    directionLabels: {
      [FileManagerSortDirection.Asc]: 'A → Z',
      [FileManagerSortDirection.Desc]: 'Z → A',
    },
  },
};
