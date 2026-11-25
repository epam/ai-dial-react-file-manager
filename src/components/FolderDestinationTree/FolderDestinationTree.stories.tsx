import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { FolderDestination } from '@/models/folder-destination';
import type { FolderNode } from '@/models/folder-tree';
import { FolderDestinationTree } from './FolderDestinationTree';

const meta: Meta<typeof FolderDestinationTree> = {
  title: 'Data Display/FolderDestinationTree',
  component: FolderDestinationTree,
  tags: ['display', 'tree', 'folders'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A folder hierarchy to choose a Copy or Move destination from, with search, folder creation and a single-root or multi-root form.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

const initialItems: FolderNode[] = [
  {
    path: ['Reports'],
    name: 'Reports',
    children: [
      { path: ['Reports', '2024'], name: '2024', children: [] },
      { path: ['Reports', '2025'], name: '2025', children: [] },
    ],
  },
  { path: ['Archive'], name: 'Archive', children: [] },
];

const addFolder = (
  nodes: FolderNode[],
  parentPath: string[],
  name: string,
): FolderNode[] => {
  if (parentPath.length === 0) {
    return [...nodes, { path: [name], name, children: [] }];
  }
  return nodes.map((node) => {
    if (node.path.join('/') === parentPath.join('/')) {
      return {
        ...node,
        children: [
          ...(node.children ?? []),
          { path: [...parentPath, name], name, children: [] },
        ],
      };
    }
    return node.children
      ? { ...node, children: addFolder(node.children, parentPath, name) }
      : node;
  });
};

const SingleRootComponent = ({
  disabled,
  canCreateFolderIn,
}: {
  disabled?: boolean;
  canCreateFolderIn?: (destination: FolderDestination) => boolean;
}) => {
  const [items, setItems] = useState(initialItems);
  const [selectedPath, setSelectedPath] = useState<string[] | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="w-[360px] flex flex-col gap-3">
      <input
        aria-label="Search folders"
        placeholder="Search folders"
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
      />
      <FolderDestinationTree
        items={items}
        selectedPath={selectedPath}
        onSelectedPathChange={setSelectedPath}
        onCreateFolder={async (parentPath, name) =>
          setItems((current) => addFolder(current, parentPath, name))
        }
        searchQuery={searchQuery}
        disabled={disabled}
        canCreateFolderIn={canCreateFolderIn}
      />
    </div>
  );
};

export const SingleRoot: Story = {
  render: () => <SingleRootComponent />,
};

export const Disabled: Story = {
  render: () => <SingleRootComponent disabled />,
  parameters: {
    docs: {
      description: {
        story:
          'While `disabled` is set, the tree ignores the pointer and the keyboard alike.',
      },
    },
  },
};

export const CreateOnlyInsideReports: Story = {
  render: () => (
    <SingleRootComponent
      canCreateFolderIn={({ path }) => path[0] === 'Reports'}
    />
  ),
  parameters: {
    docs: {
      description: {
        story:
          '`canCreateFolderIn` allows new folders only inside `Reports`. Every folder stays selectable, but the root and `Archive` offer no "Create new folder" or "Add child", and their children offer no "Add sibling".',
      },
    },
  },
};

const MultiRootComponent = () => {
  const [personal, setPersonal] = useState(initialItems);
  const [destination, setDestination] = useState<
    FolderDestination | undefined
  >();

  return (
    <div className="w-[360px]">
      <FolderDestinationTree
        searchQuery=""
        collapsibleRoots
        destination={destination}
        onDestinationChange={setDestination}
        onCreateDestinationFolder={async (rootKey, parentPath, name) => {
          if (rootKey === 'personal') {
            setPersonal((current) => addFolder(current, parentPath, name));
          }
        }}
        roots={[
          { key: 'personal', label: 'Personal', items: personal },
          {
            key: 'organization',
            label: 'Organization (read only)',
            canCreateFolders: false,
            items: [
              {
                path: ['Policies'],
                name: 'Policies',
                children: [],
              },
            ],
          },
        ]}
      />
    </div>
  );
};

export const MultiRoot: Story = {
  render: () => <MultiRootComponent />,
  parameters: {
    docs: {
      description: {
        story:
          'Each root is a top-level node. Folders can be created only under roots that allow it.',
      },
    },
  },
};
