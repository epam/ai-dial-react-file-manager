import type { Meta, StoryObj } from '@storybook/react-vite';
import { PrimaryButton } from '@epam/ai-dial-ui-kit';
import { useState } from 'react';
import type {
  FolderDestination,
  FolderDestinationRoot,
} from '@/models/folder-destination';
import {
  FolderDestinationItemIcon,
  FolderDestinationLayout,
} from '@/types/folder-destination-panel';
import type { FolderNode } from '@/models/folder-tree';
import { FolderDestinationPanel } from './FolderDestinationPanel';

const meta: Meta<typeof FolderDestinationPanel> = {
  title: 'Overlays/FolderDestinationPanel',
  component: FolderDestinationPanel,
  tags: ['overlay', 'folders'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'An end-edge panel to pick a Copy or Move destination, for a host that handles `onDestinationRequest`. Steps shows the destination with a Change step; Inline puts the search and tree in the main view.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

const roots: FolderDestinationRoot[] = [
  {
    key: 'personal',
    label: 'Personal',
    items: [
      {
        path: ['Reports'],
        name: 'Reports',
        children: [{ path: ['Reports', '2025'], name: '2025', children: [] }],
      },
      { path: ['Archive'], name: 'Archive', children: [] },
    ],
  },
  {
    key: 'organization',
    label: 'Organization',
    items: [{ path: ['Policies'], name: 'Policies', children: [] }],
  },
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

const PanelComponent = ({ layout }: { layout: FolderDestinationLayout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [rootItems, setRootItems] = useState(roots);
  const [destination, setDestination] = useState<FolderDestination>({
    rootKey: 'personal',
    path: [],
  });

  return (
    <div className="p-6">
      <PrimaryButton label="Open panel" onClick={() => setIsOpen(true)} />
      <FolderDestinationPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        layout={layout}
        item={{
          title: 'quarterly-report.pdf',
          iconKind: FolderDestinationItemIcon.File,
        }}
        roots={rootItems}
        destination={destination}
        onDestinationChange={setDestination}
        onCreateFolder={async (rootKey, parentPath, name) =>
          setRootItems((current) =>
            current.map((root) =>
              root.key === rootKey
                ? { ...root, items: addFolder(root.items, parentPath, name) }
                : root,
            ),
          )
        }
        action={{ label: 'Copy', onClick: () => setIsOpen(false) }}
      />
    </div>
  );
};

export const Steps: Story = {
  render: () => <PanelComponent layout={FolderDestinationLayout.Steps} />,
};

export const Inline: Story = {
  render: () => <PanelComponent layout={FolderDestinationLayout.Inline} />,
};
