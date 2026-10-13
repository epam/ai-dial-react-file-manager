import {
  type DialFile,
  DialFileNodeType,
  DialFilePermission,
} from '@/models/file';
import { DialFileManagerTabs } from '@/types/file-manager';
import type { FilterChipItem } from '@epam/ai-dial-ui-kit';

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

export const mobileItemsMock: DialFile[] = [
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

export const mobileItemsByTab: Partial<
  Record<DialFileManagerTabs, DialFile[]>
> = {
  [DialFileManagerTabs.All]: mobileItemsMock,
  [DialFileManagerTabs.MyFiles]: [myFilesRoot],
  [DialFileManagerTabs.Shared]: [sharedRoot],
  [DialFileManagerTabs.Organization]: [],
};

export const mobileTabs: FilterChipItem<DialFileManagerTabs>[] = [
  { value: DialFileManagerTabs.All, label: 'All' },
  { value: DialFileManagerTabs.MyFiles, label: 'My files' },
  { value: DialFileManagerTabs.Shared, label: 'Shared' },
  { value: DialFileManagerTabs.Organization, label: 'Organization' },
];
