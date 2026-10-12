import {
  type DialFile,
  DialFileNodeType,
  DialFilePermission,
} from '@/models/file';
import { GridSelectionMode } from '@/models/selection-mode.ts';
import {
  DialFileManagerActions,
  DialFileManagerTabs,
} from '@/types/file-manager';
import type { FilterChipItem } from '@epam/ai-dial-ui-kit';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { DialFileManager, type DialFileManagerProps } from './FileManager';

/**
 * Builds a mock file or folder node under `parentPath`.
 * @param parentPath - path of the containing folder
 * @param name - display name of the node
 * @param nodeType - file or folder
 * @param extra - fields to override, e.g. `updatedAt` or `contentLength`
 */
const node = (
  parentPath: string,
  name: string,
  nodeType: DialFileNodeType,
  extra: Partial<DialFile> = {},
): DialFile => {
  const path = `${parentPath}/${name}`;

  return {
    id: path,
    name,
    path,
    parentPath,
    nodeType,
    folderId: parentPath,
    permissions: [DialFilePermission.READ, DialFilePermission.WRITE],
    ...extra,
  };
};

const MY_FILES = 'My files';
const SHARED = 'Shared';

const mobileItemsMock: DialFile[] = [
  {
    ...node('', MY_FILES, DialFileNodeType.FOLDER),
    id: MY_FILES,
    path: MY_FILES,
    items: [
      node(MY_FILES, '01folder', DialFileNodeType.FOLDER, {
        updatedAt: '2026-07-15',
        items: [],
      }),
      node(MY_FILES, '08folder', DialFileNodeType.FOLDER, {
        updatedAt: '2026-07-01',
        items: [],
      }),
      node(MY_FILES, '23.02 test chat folder', DialFileNodeType.FOLDER, {
        updatedAt: '2025-08-19',
        items: [],
      }),
      node(MY_FILES, 'DK Test', DialFileNodeType.FOLDER, {
        updatedAt: '2025-09-17',
        items: [
          node(
            `${MY_FILES}/DK Test`,
            'DK Test with nested',
            DialFileNodeType.FOLDER,
            {
              updatedAt: '2025-09-17',
              items: [],
            },
          ),
        ],
      }),
      node(MY_FILES, 'Elbi', DialFileNodeType.FOLDER, {
        updatedAt: '2025-09-17',
        items: [],
      }),
      node(MY_FILES, 'Images', DialFileNodeType.FOLDER, {
        updatedAt: '2025-09-17',
        items: [],
      }),
      node(MY_FILES, '09document_scan.png', DialFileNodeType.ITEM, {
        updatedAt: '2025-09-17',
        contentLength: 13_317_734,
        contentType: 'image/png',
      }),
      node(MY_FILES, 'api keys.xls', DialFileNodeType.ITEM, {
        updatedAt: '2026-07-12',
        contentLength: 6_291_456,
        contentType: 'application/vnd.ms-excel',
      }),
      node(MY_FILES, 'funny jokes.txt', DialFileNodeType.ITEM, {
        updatedAt: '2025-09-17',
        contentLength: 27_648,
        contentType: 'text/plain',
      }),
      node(MY_FILES, 'location.mp4', DialFileNodeType.ITEM, {
        updatedAt: '2026-06-28',
        contentLength: 294_649_856,
        contentType: 'video/mp4',
      }),
      node(MY_FILES, 'result of evaluation.pdf', DialFileNodeType.ITEM, {
        updatedAt: '2026-07-15',
        contentLength: 391_168,
        contentType: 'application/pdf',
      }),
    ],
  },
  {
    ...node('', SHARED, DialFileNodeType.FOLDER),
    id: SHARED,
    path: SHARED,
    items: [
      node(SHARED, 'Q2.pptx', DialFileNodeType.ITEM, {
        updatedAt: '2026-06-28',
        contentLength: 294_649_856,
        contentType:
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      }),
    ],
  },
];

const [myFilesRoot, sharedRoot] = mobileItemsMock;

const itemsByTab: Partial<Record<DialFileManagerTabs, DialFile[]>> = {
  [DialFileManagerTabs.All]: mobileItemsMock,
  [DialFileManagerTabs.MyFiles]: [myFilesRoot],
  [DialFileManagerTabs.Shared]: [sharedRoot],
  [DialFileManagerTabs.Organization]: [],
};

const mobileTabs: FilterChipItem<DialFileManagerTabs>[] = [
  { value: DialFileManagerTabs.All, label: 'All' },
  { value: DialFileManagerTabs.MyFiles, label: 'My files' },
  { value: DialFileManagerTabs.Shared, label: 'Shared' },
  { value: DialFileManagerTabs.Organization, label: 'Organization' },
];

const actionLabels = {
  [DialFileManagerActions.Download]: 'Download',
  [DialFileManagerActions.Move]: 'Move to',
  [DialFileManagerActions.Copy]: 'Copy to',
  [DialFileManagerActions.Duplicate]: 'Duplicate',
  [DialFileManagerActions.Rename]: 'Rename',
  [DialFileManagerActions.Delete]: 'Delete',
};

const meta = {
  title: 'FileManager/Customization',
  component: DialFileManager,
  parameters: { layout: 'fullscreen' },
  globals: { viewport: { value: 'mobile1', isRotated: false } },
} satisfies Meta<DialFileManagerProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Host page for the mobile "File storage" mockup, configured only through
 * props the file manager exposes today.
 * @param args - story args forwarded to `DialFileManager`
 */
const MobileFileStorageComponent = (args: DialFileManagerProps) => {
  const [activeTab, setActiveTab] = useState(DialFileManagerTabs.MyFiles);
  const items = itemsByTab[activeTab] ?? [];

  return (
    <div className="flex h-dvh flex-col bg-layer-base">
      <h1 className="dial-h1-text text-primary px-3 py-1">File storage</h1>
      <div className="min-h-0 flex-1">
        <DialFileManager
          key={activeTab}
          {...args}
          items={items}
          defaultPath={items.length === 1 ? items[0].path : undefined}
          className="p-3 pt-2"
          contentClassName="gap-5 px-0"
          treeOptions={{
            tabs: mobileTabs,
            activeTab,
            onTabChange: setActiveTab,
            expandedPaths: new Set([MY_FILES]),
            actionLabels,
          }}
          navigationPanelOptions={{
            searchable: true,
            placeholder: 'Search...',
          }}
          toolbarOptions={{
            newActions: {
              newFolder: { label: 'New folder' },
              uploadFiles: { label: 'Upload files' },
            },
          }}
          gridOptions={{
            selectionMode: GridSelectionMode.MULTIPLE,
            filterable: false,
            dateLocale: 'en-US',
            dateOptions: { month: 'short', day: 'numeric', year: 'numeric' },
            actionLabels,
          }}
          bulkActionsToolbarOptions={{
            getSelectionLabel: (count) =>
              `item${count === 1 ? '' : 's'} selected`,
            actionLabels,
          }}
        />
      </div>
    </div>
  );
};

/**
 * Target: the mobile "File storage" frames in Figma
 * (`-DIAL--Client-Concepts`, node `1597:43580`). The story reaches as close as
 * current props allow; each gap below becomes an opt-in prop and the story
 * adopts it as it lands.
 */
export const MobileFileStorage: Story = {
  render: MobileFileStorageComponent,
  parameters: {
    docs: {
      description: {
        story: [
          'Mobile "File storage" mockup built only from existing props.',
          '',
          'Covered by existing props: page padding and 20px gaps (`className`, `contentClassName`), "Jul 15, 2026" dates (`gridOptions.dateLocale` / `dateOptions`), multi-select with a bulk actions bar.',
          '',
          'Gaps still to close:',
          '',
          '- [x] "My files" card that opens into the section chips and folder tree, closes on pick and shows the current folder name',
          '- [x] One action row: search, `…` menu, icon-only Sort and round `+` button',
          '- [x] Icon-only Sort trigger',
          '- [x] Icon-only Add (`+`) trigger',
          '- [x] Horizontal `…` menu icon with an active state',
          '- [ ] Row details as "date • size" (today: "size • date")',
          '- [ ] Folder rows: no leading gap before the date (the empty size slot keeps its spacing)',
          '- [ ] Sort indicator in the "Name" column header',
          '- [x] Section chips in one scrolling row (today: wrapping)',
          '- [ ] Selection bar docked full-width at the bottom, icon-only actions',
          '- [ ] Move/Copy destination as a bottom sheet with a folders-only list',
        ].join('\n'),
      },
    },
  },
};
