import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DialFileManagerToolbar } from './DialFileManagerToolbar';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import { ButtonVariant } from '@epam/ai-dial-ui-kit';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import { IconFile, IconFileZip, IconFolder } from '@tabler/icons-react';

const meta: Meta<typeof DialFileManagerToolbar> = {
  title: 'FileManager/components/FileManagerToolbar',
  component: DialFileManagerToolbar,
  tags: ['layout', 'toolbar', 'file-manager'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The action cluster at the trailing edge of the File Manager content header: a switch for hidden files and an optional add button with dropdown. The tab row lives in the folders panel, not here.',
      },
    },
  },
  argTypes: {
    onToggleHiddenFiles: { action: 'onToggleHiddenFiles' },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

const mockCreateItems: DropdownItem[] = [
  {
    key: 'new-folder',
    label: 'New folder',
    icon: (
      <IconFolder className="text-secondary" {...FILE_MANAGER_ICON_PROPS} />
    ),
    onClick: () => alert('Create new folder'),
  },
  {
    key: 'upload-files',
    label: 'Upload files',
    icon: <IconFile className="text-secondary" {...FILE_MANAGER_ICON_PROPS} />,
    onClick: () => alert('Upload files'),
  },
  {
    key: 'upload-archive',
    label: 'Upload archive',
    icon: (
      <IconFileZip className="text-secondary" {...FILE_MANAGER_ICON_PROPS} />
    ),
    onClick: () => alert('Upload archive'),
  },
];

export const Default: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(false);

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
            isNewButtonVisible
            newButtonVariant={ButtonVariant.Primary}
            newButtonDropdownItems={mockCreateItems}
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};

export const WithSecondaryNewButton: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(true);

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
            isNewButtonVisible
            newButtonVariant={ButtonVariant.Secondary}
            newButtonDropdownItems={mockCreateItems}
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};

export const WithoutNewButton: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(false);

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};

export const WithDisabledNewButton: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(false);

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
            isNewButtonVisible
            isNewButtonDisabled
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};

export const WithTextNewActions: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(false);

      const mockCreateItems = [
        {
          key: 'new-folder',
          label: 'New folder',
          icon: null,
          onClick: () => alert('Create new folder'),
        },
        {
          key: 'upload-files',
          label: 'Upload files',
          icon: null,
          onClick: () => alert('Upload files'),
        },
      ];

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
            isNewButtonVisible
            newButtonDropdownItems={mockCreateItems}
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};

export const WithoutHiddenFilesToggle: Story = {
  render: () => {
    const StoryWrapper = () => {
      const [areHiddenFilesVisible, setAreHiddenFilesVisible] = useState(false);

      return (
        <div className="p-4 border rounded-lg bg-layer-base">
          <DialFileManagerToolbar
            areHiddenFilesVisible={areHiddenFilesVisible}
            onToggleHiddenFiles={setAreHiddenFilesVisible}
            isNewButtonVisible
            newButtonVariant={ButtonVariant.Primary}
            newButtonDropdownItems={mockCreateItems}
            showHiddenFilesToggle={false}
          />
        </div>
      );
    };

    return <StoryWrapper />;
  },
};
