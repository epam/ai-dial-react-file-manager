import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, useCallback, useState } from 'react';
import { DialFileNodeType, type DialFile } from '@/models/file';
import { DialFoldersTree } from './FoldersTree';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import {
  IconClipboardCopy,
  IconBuilding,
  IconCopy,
  IconCut,
  IconDownload,
  IconPencil,
  IconTrashX,
} from '@tabler/icons-react';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';

const meta: Meta<typeof DialFoldersTree> = {
  title: 'Data Display/FoldersTree',
  component: DialFoldersTree,
  tags: ['display', 'tree', 'folders'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A hierarchical tree view for folders and files with selection, loading, and context menu support.',
      },
    },
  },
  argTypes: {
    onItemClick: {
      action: 'onItemClick',
      description: 'Callback fired when an item is clicked.',
    },
    showFiles: {
      control: 'boolean',
      description: 'Whether to display files in addition to folders.',
      defaultValue: false,
    },
    getContextMenuItems: {
      description:
        'Function that provides context menu items for a given folder or file.',
    },
  },
};
export default meta;

type Story = StoryObj<typeof meta>;

const sharedByMePaths = new Set<string>([
  '/root/Images/icon.svg',
  '/root/Videos',
]);

const mockFolders: DialFile[] = [
  {
    name: 'Root Folder',
    path: '/root',
    nodeType: DialFileNodeType.FOLDER,
    folderId: '1',
    items: [
      {
        name: 'Documents',
        path: '/root/Documents',
        nodeType: DialFileNodeType.FOLDER,
        folderId: '2',
        items: [
          {
            name: 'Reports',
            path: '/root/Documents/Reports',
            nodeType: DialFileNodeType.FOLDER,
            folderId: '3',
          },
        ],
      },
      {
        name: 'Images',
        path: '/root/Images',
        nodeType: DialFileNodeType.FOLDER,
        folderId: '4',
        items: [
          {
            name: 'icon.svg',
            path: '/root/Images/icon.svg',
            nodeType: DialFileNodeType.ITEM,
            folderId: '7',
          },
        ],
      },
      {
        name: 'Videos',
        path: '/root/Videos',
        nodeType: DialFileNodeType.FOLDER,
        folderId: '5',
        items: [
          {
            name: '2024',
            path: '/root/Videos/2024',
            nodeType: DialFileNodeType.FOLDER,
            folderId: '6',
          },
        ],
      },
    ],
  },
];

const getMenuFunction =
  ({ onRename }: { onRename?: (path: string) => void }) =>
  (node: DialFile): DropdownItem[] => [
    {
      key: 'copy',
      label: 'Copy',
      icon: (
        <IconCopy {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();
        // eslint-disable-next-line no-console
        console.log('Copy', node.name);
      },
    },
    {
      key: 'cut',
      label: 'Cut',
      icon: <IconCut {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />,
      onClick: (info) => {
        info.domEvent.stopPropagation();
        // eslint-disable-next-line no-console
        console.log('Cut', node.name);
      },
    },
    {
      key: 'paste',
      label: 'Paste',
      icon: (
        <IconClipboardCopy
          {...FILE_MANAGER_ICON_PROPS}
          className="text-secondary"
        />
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();
        // eslint-disable-next-line no-console
        console.log('Paste', node.name);
      },
    },
    {
      key: 'download',
      label: 'Download',
      icon: (
        <IconDownload {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();
        // eslint-disable-next-line no-console
        console.log('Download', node.name);
      },
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: (
        <IconTrashX {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();
        // eslint-disable-next-line no-console
        console.log('Delete', node.name);
      },
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: (
        <IconPencil {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
      ),
      onClick: (info) => {
        info.domEvent.stopPropagation();

        if (onRename) {
          onRename(node.path);
        } else {
          // eslint-disable-next-line no-console
          console.log('Rename', node.name);
        }
      },
    },
  ];

export const Default: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(),
    showFiles: false,
    rootItemLabel: 'My workspace',
    rootItemPath: '/root',
    sharedByMePaths,
  },
  render: (args) => {
    const Wrapper = () => {
      const [expanded, setExpanded] = useState(new Set<string>());
      const [loading, setLoading] = useState(new Set<string>());
      const [loaded, setLoaded] = useState(new Set<string>());
      const [selected, setSelected] = useState<string | undefined>();
      const [renaming, setRenaming] = useState<string | undefined>();
      const [items, setItems] = useState<DialFile[]>(mockFolders);

      const handleRenameStart = useCallback((path: string) => {
        setRenaming(path);
      }, []);

      const updateItemNameByPath = useCallback(
        (items: DialFile[], path: string, newName: string): DialFile[] => {
          return items.map((item) => {
            if (item.path === path) {
              return { ...item, name: newName };
            }
            if (item.items) {
              return {
                ...item,
                items: updateItemNameByPath(item.items, path, newName),
              };
            }
            return item;
          });
        },
        [],
      );

      const handleRenameSave = useCallback(
        (value: string) => {
          if (renaming) {
            setItems((prevItems) =>
              updateItemNameByPath(prevItems, renaming, value),
            );
            setRenaming(undefined);
          }
        },
        [renaming, setItems, updateItemNameByPath],
      );

      const handleRenameCancel = useCallback(() => setRenaming(undefined), []);

      const handleRenameValidation = useCallback(
        (value: string, item: DialFile) => {
          if (!value) {
            return 'Item name should not be empty';
          }

          const isFolder = item.nodeType === DialFileNodeType.FOLDER;

          if (isFolder) {
            const isValid = /^[a-zA-Z0-9_]+$/.test(value);
            if (!isValid) {
              return 'Folder name contains special symbols. Only letters, numbers, and underscores are allowed.';
            }
            return null;
          } else {
            const fileNamePattern = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)?$/;
            if (!fileNamePattern.test(value)) {
              return 'File name is invalid. Only one dot is allowed (for extension), and only letters, numbers, and underscores are allowed in the name and extension.';
            }
            return null;
          }
        },
        [],
      );

      const handleItemClick = (item: DialFile) => {
        const newExpanded = new Set(expanded);
        setSelected(item.path);
        setSelected(selected);

        if (newExpanded.has(item.path)) {
          newExpanded.delete(item.path);
        } else {
          newExpanded.add(item.path);

          if (!loaded.has(item.path)) {
            const newLoading = new Set(loading).add(item.path);
            setLoading(newLoading);

            setTimeout(() => {
              const doneLoading = new Set(newLoading);
              doneLoading.delete(item.path);
              setLoading(doneLoading);
              setLoaded(new Set(loaded).add(item.path));
              setExpanded(newExpanded);
            }, 750);
            return;
          }
        }

        setExpanded(newExpanded);
      };

      const getMenu = getMenuFunction({
        onRename: handleRenameStart,
      });

      return (
        <div className="size-[400px] border rounded p-4 bg-layer-base">
          <DialFoldersTree
            {...args}
            showFiles
            items={items}
            expandedPaths={expanded}
            loadingPaths={loading}
            loadedPaths={loaded}
            selectedPath={selected}
            renamedPath={renaming}
            onItemClick={handleItemClick}
            onRenameSave={handleRenameSave}
            onRenameCancel={handleRenameCancel}
            onRenameValidate={handleRenameValidation}
            getContextMenuItems={getMenu}
          />
        </div>
      );
    };

    return <Wrapper />;
  },
};

export const WithExpandedFolders: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root', '/root/Documents', '/root/Videos']),
    showFiles: false,
    sharedByMePaths,
    getContextMenuItems: getMenuFunction({}),
  },
};

export const WithSearchHighlight: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root', '/root/Documents', '/root/Videos']),
    showFiles: false,
    sharedByMePaths,
    searchQuery: 'doc',
  },
};

export const WithFilesVisible: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root', '/root/Images']),
    showFiles: true,
    sharedByMePaths,
    getContextMenuItems: getMenuFunction({}),
  },
};

export const WithLoaders: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root', '/root/Images']),
    loadingPaths: new Set(['/root/Documents']),
    sharedByMePaths,
    getContextMenuItems: getMenuFunction({}),
  },
};

export const Loading: Story = {
  args: {
    items: [],
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'First load: a skeleton replaces the empty state until the items arrive. It appears after a 400 ms delay, so a fast load never flashes it.',
      },
    },
  },
};

const LOADING_ROOT = '/My files';
const LOADING_LONG_NAME_PATH = `${LOADING_ROOT}/Quarterly reports and presentations for the board`;

export const RootLoading: Story = {
  args: {
    items: [
      {
        name: 'My files',
        path: LOADING_ROOT,
        nodeType: DialFileNodeType.FOLDER,
        folderId: 'bucket',
        items: [],
      },
    ],
    expandedPaths: new Set([LOADING_ROOT]),
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The tree’s own loading signal is set while its first level loads: the root row stays and a decorative skeleton stands in for its children directly underneath it.',
      },
    },
  },
};

export const MultipleRootsLoading: Story = {
  args: {
    items: [
      {
        name: 'Personal',
        path: '/personal',
        folderId: 'personal',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
      {
        name: 'Shared',
        path: '/shared',
        folderId: 'shared',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
    ],
    expandedPaths: new Set(['/personal', '/shared']),
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each expanded root keeps its own loading placeholder directly beneath its row. One live region announces the first-level load.',
      },
    },
  },
};

export const FolderLoading: Story = {
  args: {
    items: [
      {
        name: 'My files',
        path: LOADING_ROOT,
        nodeType: DialFileNodeType.FOLDER,
        folderId: 'bucket',
        items: [
          {
            name: 'Quarterly reports and presentations for the board',
            path: LOADING_LONG_NAME_PATH,
            nodeType: DialFileNodeType.FOLDER,
            folderId: 'bucket',
            items: [],
          },
          {
            name: 'Images',
            path: `${LOADING_ROOT}/Images`,
            nodeType: DialFileNodeType.FOLDER,
            folderId: 'bucket',
          },
        ],
      },
    ],
    expandedPaths: new Set([LOADING_ROOT, LOADING_LONG_NAME_PATH]),
    loadingPaths: new Set([LOADING_LONG_NAME_PATH]),
  },
  parameters: {
    docs: {
      description: {
        story:
          'An expanded folder loading its children (long name): after the 400 ms delay its icon and name become a circle and a bar, and placeholder rows stand in for its children.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    items: [],
    expandedPaths: new Set(),
    showFiles: false,
    emptyStateTitle: 'No folders available',
  },
};

export const WithCustomIcons: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root']),
    showFiles: false,
    getItemIcon: (item) =>
      item.path === '/root' ? (
        <IconBuilding {...FILE_MANAGER_ICON_PROPS} />
      ) : undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A row whose `getItemIcon` returns a node shows it instead of the folder icon; other rows keep theirs.',
      },
    },
  },
};

export const CaretOnlyExpands: Story = {
  args: {
    items: mockFolders,
    expandedPaths: new Set(['/root']),
    showFiles: false,
    sharedByMePaths,
    getContextMenuItems: getMenuFunction({}),
    selectOnCaretClick: false,
    showContextMenuButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The tree as the compact view\'s navigation card shows it: a folder\'s caret only expands or collapses it, and rows drop the hover "more" button while the right-click menu stays.',
      },
    },
  },
};

const disabledRowsItems: DialFile[] = [
  {
    id: 'ou-1',
    name: 'Org unit without write access',
    path: 'files/ou-1',
    folderId: 'files',
    nodeType: DialFileNodeType.FOLDER,
    items: [
      {
        id: 'ou-1-open',
        name: 'Shared drafts',
        path: 'files/ou-1/drafts',
        folderId: 'files/ou-1',
        nodeType: DialFileNodeType.FOLDER,
        items: [],
      },
    ],
  },
  {
    id: 'ou-2',
    name: 'Read-only leaf folder',
    path: 'files/ou-2',
    folderId: 'files',
    nodeType: DialFileNodeType.FOLDER,
    items: [],
  },
  {
    id: 'ou-3',
    name: 'Folder with a very long reason',
    path: 'files/ou-3',
    folderId: 'files',
    nodeType: DialFileNodeType.FOLDER,
    items: [],
  },
  {
    id: 'ou-4',
    name: 'My workspace',
    path: 'files/ou-4',
    folderId: 'files',
    nodeType: DialFileNodeType.FOLDER,
    items: [],
  },
];

const disabledReasons: Record<string, string> = {
  'files/ou-1': 'You have no access to save your QuickApp to this folder',
  'files/ou-2': 'You have no access to save your QuickApp to this folder',
  'files/ou-3':
    'You have no access to save your QuickApp to this folder because the administrator of this organizational unit has restricted publishing to a small group of people. Ask them to add you to the group, or pick another folder.',
};

const DisabledRowsTree = (
  args: Partial<ComponentProps<typeof DialFoldersTree>>,
) => {
  const [expanded, setExpanded] = useState(new Set<string>(['files/ou-1']));
  const [selected, setSelected] = useState<string | undefined>();
  return (
    <div className="w-[360px]">
      <DialFoldersTree
        {...args}
        items={disabledRowsItems}
        expandedPaths={expanded}
        onExpandedPathsChange={setExpanded}
        selectedPath={selected}
        onItemClick={(item) => setSelected(item.path)}
        getDisabledTooltip={(item) => disabledReasons[item.path]}
        getContextMenuItems={getMenuFunction({})}
      />
      <p className="dial-tiny-text text-secondary mt-4">
        Selected: {selected ?? 'nothing'}
      </p>
    </div>
  );
};

export const DisabledRows: Story = {
  render: (args) => <DisabledRowsTree {...args} />,
  parameters: {
    docs: {
      description: {
        story:
          'A row whose `getDisabledTooltip` returns a reason is muted and marked `aria-disabled`, and the reason shows in a tooltip on hover or focus and is announced as its description. It is never selected (see "Selected" below the tree), and has no context menu or item actions, but it stays focusable and a folder still expands from a row click, its caret, Enter, Space and the arrow keys, so its enabled children stay reachable. Try it with the keyboard: Tab into the tree, move with the arrows, press Enter on a disabled row, and ArrowRight to open "Org unit without write access" and pick "Shared drafts". Known limitation: the kit tooltip may not appear on touch devices; the reason still reaches assistive technology through the row\'s description.',
      },
    },
  },
};
