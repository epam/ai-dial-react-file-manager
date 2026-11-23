import { DialFileNodeType } from '../../models/file';
import { describe, expect, it } from 'vitest';
import { FolderNode } from '../../models/folder-tree';
import {
  collectFolderKeys,
  fromDialFileTree,
  fromFolderPathKey,
  getSiblingFolderNames,
  mergeFolderPaths,
  sortFolderTree,
  toDialFileTree,
  toFolderPathKey,
} from '../folder-tree';

const tree: FolderNode[] = [
  {
    path: ['Shared'],
    name: 'Shared',
    children: [
      {
        path: ['Shared', 'Data Science'],
        name: 'Data Science',
        children: [
          {
            path: ['Shared', 'Data Science', 'Published models'],
            name: 'Published models',
          },
        ],
      },
    ],
  },
  {
    path: ['My workspace'],
    name: 'My workspace',
    children: [{ path: ['My workspace', 'Drafts'], name: 'Drafts' }],
  },
];

describe('collectFolderKeys', () => {
  it('returns every path in the tree, recursively', () => {
    expect(collectFolderKeys(tree)).toEqual([
      'Shared',
      'Shared/Data Science',
      'Shared/Data Science/Published models',
      'My workspace',
      'My workspace/Drafts',
    ]);
  });
});

describe('sortFolderTree', () => {
  it('orders root nodes by name', () => {
    expect(sortFolderTree(tree).map((node) => node.name)).toEqual([
      'My workspace',
      'Shared',
    ]);
  });

  it('orders nested children too', () => {
    const unsorted: FolderNode[] = [
      {
        path: ['Shared'],
        name: 'Shared',
        children: [
          { path: ['Shared', 'Zeta'], name: 'Zeta' },
          { path: ['Shared', 'alpha'], name: 'alpha' },
        ],
      },
    ];
    expect(
      sortFolderTree(unsorted)[0].children?.map((node) => node.name),
    ).toEqual(['alpha', 'Zeta']);
  });

  it('compares digits numerically so "Report 2" precedes "Report 10"', () => {
    const unsorted: FolderNode[] = [
      { path: ['Report 10'], name: 'Report 10' },
      { path: ['Report 2'], name: 'Report 2' },
    ];
    expect(sortFolderTree(unsorted).map((node) => node.name)).toEqual([
      'Report 2',
      'Report 10',
    ]);
  });

  it('leaves the input array and its nodes untouched', () => {
    const input: FolderNode[] = [
      { path: ['b'], name: 'b' },
      { path: ['a'], name: 'a' },
    ];
    sortFolderTree(input);
    expect(input.map((node) => node.name)).toEqual(['b', 'a']);
  });

  it('keeps children undefined for a leaf node', () => {
    expect(
      sortFolderTree([{ path: ['a'], name: 'a' }])[0].children,
    ).toBeUndefined();
  });
});

describe('mergeFolderPaths', () => {
  it('adds a missing root-level folder', () => {
    const result = mergeFolderPaths(tree, [['Model releases']]);
    expect(result.map((node) => node.name)).toEqual([
      'Shared',
      'My workspace',
      'Model releases',
    ]);
    expect(result[2]).toEqual({
      path: ['Model releases'],
      name: 'Model releases',
      children: undefined,
    });
  });

  it('adds a missing folder under an existing parent, keeping its siblings', () => {
    const result = mergeFolderPaths(tree, [['My workspace', 'Model releases']]);
    expect(result[1].children?.map((node) => node.name)).toEqual([
      'Drafts',
      'Model releases',
    ]);
    expect(result[1].children?.[1].path).toEqual([
      'My workspace',
      'Model releases',
    ]);
  });

  it('creates every missing ancestor of a nested path', () => {
    const result = mergeFolderPaths([], [['Org', 'Team', 'Q3']]);
    expect(result[0].children?.[0].children?.[0]).toEqual({
      path: ['Org', 'Team', 'Q3'],
      name: 'Q3',
      children: undefined,
    });
  });

  it('leaves the tree unchanged when every path is already present', () => {
    expect(
      mergeFolderPaths(tree, [['Shared'], ['Shared', 'Data Science']]),
    ).toEqual(tree);
  });

  it('ignores empty paths (the bucket root is not a folder node)', () => {
    expect(mergeFolderPaths(tree, [[]])).toEqual(tree);
  });
});

describe('toFolderPathKey / fromFolderPathKey', () => {
  it('joins and splits path segments symmetrically', () => {
    const segments = ['Shared', 'Data Science'];
    expect(fromFolderPathKey(toFolderPathKey(segments))).toEqual(segments);
  });

  it('round-trips an empty path to an empty array', () => {
    expect(fromFolderPathKey(toFolderPathKey([]))).toEqual([]);
  });
});

describe('toDialFileTree', () => {
  it('converts nodes to DialFile with folder node type and joined path', () => {
    const result = toDialFileTree(tree);
    expect(result[0]).toMatchObject({
      path: 'Shared',
      name: 'Shared',
      folderId: 'Shared',
      nodeType: DialFileNodeType.FOLDER,
    });
    expect(result[0].items?.[0]).toMatchObject({
      path: 'Shared/Data Science',
      name: 'Data Science',
    });
  });

  it('leaves items undefined for leaf nodes', () => {
    const result = toDialFileTree(tree);
    const leaf = result[0].items?.[0].items?.[0];
    expect(leaf?.items).toBeUndefined();
  });
});

describe('getSiblingFolderNames', () => {
  it('returns root-level names when parentPath is empty', () => {
    expect(getSiblingFolderNames(tree, [])).toEqual(['Shared', 'My workspace']);
  });

  it('returns child names for a nested parent', () => {
    expect(getSiblingFolderNames(tree, ['Shared'])).toEqual(['Data Science']);
  });

  it('returns an empty array for a parent with no children', () => {
    expect(
      getSiblingFolderNames(tree, [
        'Shared',
        'Data Science',
        'Published models',
      ]),
    ).toEqual([]);
  });
});

describe('fromDialFileTree', () => {
  it('round-trips a tree through toDialFileTree', () => {
    expect(fromDialFileTree(toDialFileTree(tree))).toEqual(tree);
  });

  it("keeps an unlisted folder's children undefined rather than empty", () => {
    const [node] = fromDialFileTree(
      toDialFileTree([{ path: ['Shared'], name: 'Shared' }]),
    );
    expect(node.children).toBeUndefined();
  });
});
