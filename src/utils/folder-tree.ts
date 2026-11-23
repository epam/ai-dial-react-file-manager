import { type DialFile, DialFileNodeType } from '@/models/file';
import type { FolderNode } from '@/models/folder-tree';

/*
 * Case-insensitive, digit-aware name comparison so "Folder 2" precedes
 * "Folder 10" and casing never splits otherwise-adjacent names.
 */
const compareFolderNames = (a: string, b: string): number =>
  a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true });

/** Returns `items` ordered by folder name at every level; the input array and its nodes are left untouched. */
export const sortFolderTree = (items: FolderNode[]): FolderNode[] =>
  [...items]
    .sort((a, b) => compareFolderNames(a.name, b.name))
    .map((node) =>
      node.children
        ? { ...node, children: sortFolderTree(node.children) }
        : node,
    );

const withFolderPath = (
  items: FolderNode[],
  path: string[],
  parentPath: string[],
): FolderNode[] => {
  const [name, ...rest] = path;
  if (name == null) {
    return items;
  }
  const nodePath = [...parentPath, name];
  const existing = items.find((node) => node.name === name);
  if (!existing) {
    return [
      ...items,
      {
        path: nodePath,
        name,
        children: rest.length
          ? withFolderPath([], rest, nodePath)
          : /* Leaf: children are unknown, not empty — same as a folder the host has not listed yet. */
            undefined,
      },
    ];
  }
  if (!rest.length) {
    return items;
  }
  return items.map((node) =>
    node === existing
      ? {
          ...node,
          children: withFolderPath(node.children ?? [], rest, nodePath),
        }
      : node,
  );
};

/**
 * Returns `items` with a folder node added for every path in `paths` that is
 * not already present, creating any missing ancestor along the way. Existing
 * nodes and their children are preserved as-is.
 */
export const mergeFolderPaths = (
  items: FolderNode[],
  paths: string[][],
): FolderNode[] =>
  paths.reduce(
    (acc, path) => (path.length ? withFolderPath(acc, path, []) : acc),
    items,
  );

/** Returns every folder path (joined by "/") in `items`, recursively. */
export const collectFolderKeys = (items: FolderNode[]): string[] =>
  items.flatMap((node) => [
    node.path.join('/'),
    ...(node.children ? collectFolderKeys(node.children) : []),
  ]);

/** Joins folder path segments into the string path key used by `DialFile`/`DialFoldersTree`. */
export const toFolderPathKey = (path: string[]): string => path.join('/');

/** Splits a `DialFile`/`DialFoldersTree` string path back into folder path segments. */
export const fromFolderPathKey = (pathKey: string): string[] =>
  pathKey.split('/').filter(Boolean);

/** Returns the last segment of a `/`-joined folder path, or `rootLabel` for the public root (`''`). */
export const getFolderDisplayName = (
  pathKey: string,
  rootLabel: string,
): string => fromFolderPathKey(pathKey).at(-1) ?? rootLabel;

/** Converts `FolderNode[]` to the `DialFile[]` shape `DialFoldersTree` requires. */
export const toDialFileTree = (items: FolderNode[]): DialFile[] =>
  items.map((node) => {
    const path = toFolderPathKey(node.path);
    return {
      path,
      name: node.name,
      folderId: path,
      nodeType: DialFileNodeType.FOLDER,
      items: node.children ? toDialFileTree(node.children) : undefined,
    };
  });

/** Converts the `DialFile[]` shape `DialFoldersTree` uses back to `FolderNode[]`; the inverse of {@link toDialFileTree}. */
export const fromDialFileTree = (files: DialFile[]): FolderNode[] =>
  files.map((file) => ({
    path: fromFolderPathKey(file.path),
    name: file.name,
    children: file.items ? fromDialFileTree(file.items) : undefined,
  }));

/** Characters forbidden in a destination folder name, mirroring the backend's path validation rules. */
export const FORBIDDEN_FOLDER_NAME_CHARS_RE = /[/\\:;,={}&"]/;

/** Returns the node at `path` anywhere in `items`, or `undefined` when there is none. */
export const findFolderNode = (
  items: FolderNode[],
  path: string[],
): FolderNode | undefined => {
  const key = toFolderPathKey(path);
  for (const node of items) {
    if (toFolderPathKey(node.path) === key) {
      return node;
    }
    const found = node.children
      ? findFolderNode(node.children, path)
      : undefined;
    if (found) {
      return found;
    }
  }
  return undefined;
};

/** Names of the direct children of the folder at `parentPath` (root siblings when empty). */
export const getSiblingFolderNames = (
  items: FolderNode[],
  parentPath: string[],
): string[] => {
  if (parentPath.length === 0) {
    return items.map((node) => node.name);
  }
  return (findFolderNode(items, parentPath)?.children ?? []).map(
    (node) => node.name,
  );
};
