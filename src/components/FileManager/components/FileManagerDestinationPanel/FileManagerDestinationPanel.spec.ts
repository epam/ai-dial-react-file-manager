import { describe, expect, it } from 'vitest';
import { type DialFile, DialFileNodeType } from '@/models/file';
import { toDestinationFolderNodes } from './FileManagerDestinationPanel';

const folder = (path: string, items?: DialFile[]): DialFile => ({
  path,
  name: path.split('/').pop() ?? path,
  folderId: path,
  nodeType: DialFileNodeType.FOLDER,
  items,
});
const file = (path: string): DialFile => ({
  path,
  name: path.split('/').pop() ?? path,
  folderId: path,
  nodeType: DialFileNodeType.ITEM,
});

describe('toDestinationFolderNodes', () => {
  const tree = [
    folder('All files/Docs', [
      file('All files/Docs/a.txt'),
      folder('All files/Docs/2024', []),
    ]),
    folder('All files/.git', []),
    folder('All files/Lazy'),
    file('All files/readme.md'),
  ];

  it('keeps folders only, with paths relative to the root', () => {
    expect(toDestinationFolderNodes(tree, 1, {}).map((n) => n.path)).toEqual([
      ['Docs'],
      ['Lazy'],
    ]);
    expect(toDestinationFolderNodes(tree, 1, {})[0].children).toEqual([
      { path: ['Docs', '2024'], name: '2024', children: [] },
    ]);
  });

  it('leaves children undefined for a folder whose contents are not loaded', () => {
    expect(toDestinationFolderNodes(tree, 1, {})[1].children).toBeUndefined();
  });

  it('lists hidden dot-folders only when shown', () => {
    expect(
      toDestinationFolderNodes(tree, 1, { showHidden: true }).map(
        (n) => n.name,
      ),
    ).toEqual(['Docs', '.git', 'Lazy']);
  });

  it('drops excluded paths with their subtrees', () => {
    expect(
      toDestinationFolderNodes(tree, 1, {
        excludedPaths: ['All files/Docs'],
      }).map((n) => n.name),
    ).toEqual(['Lazy']);
  });
});
