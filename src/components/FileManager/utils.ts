import { DialFileNodeType, type DialFile } from '@/models/file';
import type { DialFileAcceptType } from '@/models/file-manager';
import { extensions } from 'mime-types';
import type { ReactNode } from 'react';
import { NotificationVariant, type DropdownItem } from '@epam/ai-dial-ui-kit';
import { DEFAULT_FOLDER_BASE_NAME } from './constants';
import type { FileManagerGridRow } from './FileManagerContext';
import { baseColumnComparator } from '@epam/ai-dial-ui-kit';
import {
  type DialFileManagerActions,
  type FileManagerSort,
  FileManagerSortDirection,
  FileManagerSortField,
} from '@/types/file-manager';

export const findNodeByPath = (
  nodes: DialFile[] | undefined,
  path: string,
): DialFile | undefined => {
  if (!nodes || !nodes.length || !path) return undefined;
  for (const n of nodes) {
    if (n.path === path) return n;
    const found = findNodeByPath(n.items, path);
    if (found) return found;
  }
  return undefined;
};

export const findFolderForPath = (
  root: DialFile[] | undefined,
  path?: string,
): DialFile | undefined => {
  if (!root?.length) return undefined;
  if (!path) return root[0];
  const node = findNodeByPath(root, path);
  if (node && node.nodeType === DialFileNodeType.FOLDER) return node;

  const parts = path.split('/').filter(Boolean);
  if (parts.length <= 1) return root[0];
  const parentPath = '/' + parts.slice(0, parts.length - 1).join('/');
  return findNodeByPath(root, parentPath) ?? root[0];
};

export const normalizeToLowerCase = (input?: string): string =>
  (input ?? '').toLowerCase();

export const normalizeExtensionWithoutDot = (input?: string): string =>
  normalizeToLowerCase(input).replace(/^\./, '');

export const collectAllDescendants = (folder?: DialFile): DialFile[] => {
  if (!folder) return [];
  const result: DialFile[] = [];
  const walk = (node: DialFile) => {
    const children = node.items ?? [];
    for (const child of children) {
      result.push(child);
      if (child.nodeType === DialFileNodeType.FOLDER) {
        walk(child);
      }
    }
  };
  walk(folder);
  return result;
};

/**
 * Removes items (and their entire subtree) whose path matches one of the
 * excluded paths, at any nesting depth. Used to hide specific folders (e.g.
 * a root folder) from the Move/Copy destination popup without affecting the
 * main file manager view.
 *
 * @param nodes - Hierarchical items to filter
 * @param excludedPaths - Paths to exclude; pass `undefined`/empty to no-op
 * @returns A new array with matching nodes (and their descendants) removed
 */
export const excludePathsFromTree = (
  nodes: DialFile[] | undefined,
  excludedPaths?: string[],
): DialFile[] => {
  if (!nodes?.length) return [];
  if (!excludedPaths?.length) return nodes;

  const excluded = new Set(excludedPaths);

  const filter = (items: DialFile[]): DialFile[] =>
    items
      .filter((node) => !excluded.has(node.path))
      .map((node) =>
        node.items?.length ? { ...node, items: filter(node.items) } : node,
      );

  return filter(nodes);
};

/**
 * Checks whether a path is one of the given folders or lies inside one.
 * Trailing slashes are ignored, so `/Docs` and `/Docs/` name the same folder,
 * and a sibling that only shares a prefix (`/Docs-old`) does not match.
 *
 * @param path - Path to check
 * @param folderPaths - Folder paths to check against
 * @returns `true` when `path` equals or descends from any of `folderPaths`
 */
export const isPathWithinFolders = (
  path: string,
  folderPaths: string[],
): boolean => {
  const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
  const target = trimTrailingSlash(path);

  return folderPaths.some((folderPath) => {
    const folder = trimTrailingSlash(folderPath);
    if (!folder) return false;
    return target === folder || target.startsWith(`${folder}/`);
  });
};

/**
 * Finds the folders whose name contains the query, case-insensitively. A
 * matching folder keeps its whole subtree; other folders stay only when they
 * lead to a match. Files and hidden dot-folders outside a match are dropped.
 * @param nodes - Hierarchical items to search
 * @param query - Text to look for in folder names
 * @returns The filtered tree, and the paths of the folders above the matches so the tree can open on them
 */
export const searchFoldersByName = (
  nodes: DialFile[],
  query: string,
): { items: DialFile[]; expandedPaths: Set<string> } => {
  const normalizedQuery = normalizeToLowerCase(query.trim());
  const expandedPaths = new Set<string>();

  const search = (items: DialFile[]): DialFile[] =>
    items.flatMap((node) => {
      if (node.nodeType !== DialFileNodeType.FOLDER || isHiddenDotFile(node)) {
        return [];
      }
      if (normalizeToLowerCase(node.name).includes(normalizedQuery)) {
        return [node];
      }

      const children = search(node.items ?? []);
      if (children.length === 0) return [];

      expandedPaths.add(node.path);
      return [{ ...node, items: children }];
    });

  return { items: search(nodes), expandedPaths };
};

/**
 * Lists the paths of the folders that contain the given path, nearest first.
 * @param path - Path of a file or folder
 * @returns Parent paths, e.g. `['/a/b', '/a']` for `'/a/b/c'`
 */
export const getAncestorPaths = (path: string): string[] => {
  const ancestors: string[] = [];
  let separatorIndex = path.lastIndexOf('/');

  while (separatorIndex > 0) {
    ancestors.push(path.slice(0, separatorIndex));
    separatorIndex = path.lastIndexOf('/', separatorIndex - 1);
  }

  return ancestors;
};

export const isHiddenDotFile = (node: DialFile) => {
  const name = node.name ?? node.path.split('/').pop() ?? '';
  return name.startsWith('.');
};

/**
 * Formats bytes into a short, human-readable string.
 *
 * @param bytes - Number of bytes to format
 * @returns Formatted string (e.g., "15.0 MB", "150 KB", "512 bytes")
 *
 * @example
 * ```ts
 * formatBytes(2150) // "2 KB"
 * formatBytes(15728640) // "15.0 MB"
 * formatBytes(512) // "512 bytes"
 * ```
 */
export const formatBytes = (bytes?: number): string => {
  if (!bytes) return '0 bytes';
  const KB = 1024;
  const MB = KB * 1024;
  if (bytes >= MB) return `${(bytes / MB).toFixed(1)} MB`;
  if (bytes >= KB) return `${(bytes / KB).toFixed(0)} KB`;
  return `${bytes} bytes`;
};

/**
 * Formats date string into a localized date string.
 *
 * @param date - ISO date string or any valid date string
 * @param locale - BCP 47 language tag (e.g., 'en-US', 'ru-RU')
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string or original string if formatting fails
 *
 * @example
 * ```ts
 * formatDate('2025-09-05T10:30:00Z', 'en-US', { year: 'numeric', month: 'short', day: '2-digit' })
 * // "Sep 05, 2025"
 *
 * formatDate('2025-09-05T10:30:00Z', 'ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })
 * // "5 сентября 2025 г."
 * ```
 */
export const formatDate = (
  date?: string,
  locale: Intl.LocalesArgument = 'en-US',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  },
): string => {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  } catch {
    return date;
  }
};

export function isFileAccepted(
  allowedFileTypes: DialFileAcceptType[] | undefined,
  contentType: string,
  fileName?: string,
): boolean {
  if (!allowedFileTypes || allowedFileTypes.includes('*/*')) {
    return true;
  }

  const normalizedType = contentType.toLowerCase();

  const extension =
    fileName && fileName.includes('.')
      ? `.${fileName.split('.').at(-1)!.toLowerCase()}`
      : undefined;

  return allowedFileTypes.some((rule) => {
    const normalizedRule = rule.toLowerCase();

    if (normalizedRule.startsWith('.')) {
      return extension === normalizedRule;
    }

    if (normalizedRule.endsWith('/*')) {
      const baseType = normalizedRule.slice(0, -1);
      return normalizedType.startsWith(baseType);
    }

    return normalizedType === normalizedRule;
  });
}

export const formatAllowedFileTypesForTooltip = (
  allowedFileTypes: DialFileAcceptType[] | undefined,
): string => {
  return (
    allowedFileTypes
      ?.map((type) => {
        if (type.endsWith('/*')) {
          return type.replace('/*', 's');
        }

        return getExtensionsListForMimeType(type)
          .flat()
          .map((type) => `.${type}`);
      })
      .flat()
      .join(', ') || ''
  );
};

export const getExtensionsListForMimeType = (mimeType: string) => {
  const [subset, name] = mimeType.split('/');

  if (subset === '*') {
    return ['all'];
  } else if (name === '*') {
    return Object.entries(extensions).reduce((acc, [key, value]) => {
      const [keySubset] = key.split('/');
      if (keySubset === subset) {
        acc.push(...value);
      }

      return acc;
    }, [] as string[]);
  } else {
    return extensions[mimeType] || [];
  }
};

export const cleanForbiddenSymbolsRegExp = (
  forbiddenSymbolsRegExp?: RegExp,
) => {
  if (!forbiddenSymbolsRegExp) return undefined;

  const flags = forbiddenSymbolsRegExp.flags.replace(/[gy]/g, '');
  return new RegExp(forbiddenSymbolsRegExp.source, flags);
};

export function getForbiddenSymbolsTooltip(
  item: { name: string; isFolder: boolean },
  forbiddenSymbolsRegExp?: RegExp,
  forbiddenSymbolsTooltip?: ReactNode,
): ReactNode | undefined {
  if (!forbiddenSymbolsRegExp) return undefined;

  if (cleanForbiddenSymbolsRegExp(forbiddenSymbolsRegExp)?.test(item.name)) {
    return (
      forbiddenSymbolsTooltip ??
      `This ${item.isFolder ? 'folder' : 'file'} contains forbidden characters in its name. Please rename it.`
    );
  }
  return undefined;
}

export const splitPathAndName = (
  fullPath: string,
): { parent: string; name: string } => {
  const lastSlash = fullPath.lastIndexOf('/');
  return lastSlash >= 0
    ? {
        parent: fullPath.slice(0, lastSlash),
        name: fullPath.slice(lastSlash + 1),
      }
    : { parent: '', name: fullPath };
};

export const isFileSelectable = (
  file: Pick<DialFile, 'contentLength' | 'contentType' | 'name'>,
  allowedFileTypes?: DialFileAcceptType[],
  maxSelectableFileSize?: number,
): boolean => {
  const isSizeOk =
    !file.contentLength ||
    maxSelectableFileSize == null ||
    file.contentLength <= maxSelectableFileSize;

  const isTypeOk =
    !file.contentType ||
    isFileAccepted(allowedFileTypes, file.contentType, file.name);

  return isSizeOk && isTypeOk;
};

export const getRowTooltip = (
  file: FileManagerGridRow,
  allowedFileTypes?: DialFileAcceptType[],
  maxSelectableFileSize?: number,
  unsupportedFileTypeTooltip?: string,
  fileTooLargeTooltip?: string,
): string | undefined => {
  if (file.nodeType === DialFileNodeType.FOLDER) return undefined;

  const isFileSizeAccepted =
    !file.contentLength ||
    maxSelectableFileSize == null ||
    file.contentLength <= maxSelectableFileSize;

  const isFileTypeAccepted =
    !file.contentType ||
    isFileAccepted(allowedFileTypes, file.contentType, file.name);

  if (!isFileTypeAccepted) {
    return (
      unsupportedFileTypeTooltip ??
      (allowedFileTypes?.length
        ? `Unsupported file type. Supported types: ${formatAllowedFileTypesForTooltip(allowedFileTypes)}.`
        : 'Unsupported file type.')
    );
  }
  if (!isFileSizeAccepted) {
    return (
      fileTooLargeTooltip ??
      `File is too large. Maximum size: ${formatBytes(maxSelectableFileSize!)}.`
    );
  }
  return undefined;
};

export const getFolderNestingDepth = (folderPath: string): number => {
  const segments = folderPath.replace(/\/+$/, '').split('/').filter(Boolean);
  return segments.length;
};

/**
 * Picks the default name for a new folder: `<baseName> <max+1>`, bumped until
 * no name in `existingNames` (case-insensitive) takes it. The one naming rule
 * shared by the grid and the destination folder tree.
 * @param existingNames - Names already taken by the sibling folders
 * @param baseName - Name the number is appended to; defaults to `'New folder'`
 * @returns The first free default name, e.g. `'New folder 3'`
 */
export const getNextFolderNameFromNames = (
  existingNames: string[],
  baseName: string = DEFAULT_FOLDER_BASE_NAME,
): string => {
  const prefix = `${baseName} `;
  const escapedBaseName = baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedBaseName} (\\d+)$`);

  const takenNames = new Set(existingNames.map((name) => name.toLowerCase()));

  const maxNumber = existingNames
    .map((name) => {
      const match = name.match(regex);
      return match ? parseInt(match[1], 10) : 0;
    })
    .reduce((max, n) => Math.max(max, n), 0);

  let candidate = `${prefix}${maxNumber + 1}`;
  let counter = maxNumber + 1;
  while (takenNames.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${prefix}${counter}`;
  }

  return candidate;
};

export const getNextFolderName = (existingFolders: DialFile[]): string =>
  getNextFolderNameFromNames(existingFolders.map((folder) => folder.name));

/** Error messages returned by {@link getFolderNameError} for each rejection reason. */
export interface FolderNameValidationMessages {
  /** Shown when the trimmed name is empty. */
  empty: string;
  /** Shown when the name contains `..` or a character matched by `forbiddenChars`. */
  invalid: string;
  /** Shown when a sibling folder already has this name (case-insensitive). */
  duplicate: string;
  /** Shown when the name equals the parent folder's name (case-insensitive). Falls back to `duplicate`. */
  sameAsParent?: string;
  /** Non-blocking notice for a name starting with a dot, which hides the folder. Omit for no notice. */
  hidden?: string;
}

/** Whether a validation result stops a save; a `warning__`-prefixed message is informational only. */
export const isBlockingValidationError = (
  error: string | null | undefined,
): error is string =>
  !!error && !error.startsWith(`${NotificationVariant.Warning}__`);

/** Options of {@link getFolderNameError}. */
export interface FolderNameValidationOptions {
  /** Names of the folders that already exist next to the new one. */
  siblingNames: string[];
  /** Messages returned for each rejection reason. */
  messages: FolderNameValidationMessages;
  /** Name of the parent folder, which a new folder may not take; omit for a root. */
  parentName?: string;
  /** Characters a folder name may not contain, in addition to `..`. */
  forbiddenChars?: RegExp;
  /** The host's own check, called with the trimmed name once the built-in blocking checks pass. */
  onValidate?: (trimmedName: string) => string | null;
}

/**
 * The one validator for a new folder's name, used by the file manager grid and
 * the destination folder tree. Blocking checks run first (empty, `..`,
 * forbidden characters, duplicate sibling, parent name, the host's
 * `onValidate`); the hidden-name notice comes last so it never masks them.
 * @param rawValue - The name as typed, untrimmed
 * @param options - Siblings, messages and the optional extra checks
 * @returns An error or notice message, or `null` when the name is valid
 */
export const getFolderNameError = (
  rawValue: string,
  {
    siblingNames,
    messages,
    parentName,
    forbiddenChars,
    onValidate,
  }: FolderNameValidationOptions,
): string | null => {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return messages.empty;
  }
  if (trimmed.includes('..') || forbiddenChars?.test(trimmed)) {
    return messages.invalid;
  }
  const lowerName = trimmed.toLowerCase();
  if (siblingNames.some((name) => name.toLowerCase() === lowerName)) {
    return messages.duplicate;
  }
  if (parentName?.toLowerCase() === lowerName) {
    return messages.sameAsParent ?? messages.duplicate;
  }
  const customError = onValidate?.(trimmed);
  if (customError) {
    return customError;
  }
  if (messages.hidden && trimmed.startsWith('.') && trimmed.length > 1) {
    return messages.hidden;
  }
  return null;
};

const getRowTime = (row: FileManagerGridRow): number => {
  const time = row.updatedAt ? new Date(row.updatedAt).getTime() : NaN;
  return Number.isNaN(time) ? 0 : time;
};

const getRowSize = (row: FileManagerGridRow): number =>
  row.contentLength ?? row.size ?? 0;

const compareRowsByField = (
  a: FileManagerGridRow,
  b: FileManagerGridRow,
  field: FileManagerSortField,
): number => {
  switch (field) {
    case FileManagerSortField.UpdatedAt:
      return getRowTime(a) - getRowTime(b);
    case FileManagerSortField.Size:
      return getRowSize(a) - getRowSize(b);
    case FileManagerSortField.Name:
    default:
      return baseColumnComparator(a.name, b.name);
  }
};

/**
 * Orders grid rows for the sort menu. A row still being created stays on top
 * so its name input never jumps away, and folders lead files the way every
 * file browser lists them; the chosen field and direction order each group.
 * Ties fall back to the name so equal dates or sizes keep a stable order.
 */
export const sortGridRows = (
  rows: FileManagerGridRow[],
  sort: FileManagerSort,
): FileManagerGridRow[] => {
  const sign = sort.direction === FileManagerSortDirection.Desc ? -1 : 1;

  return [...rows].sort((a, b) => {
    if (!!a.isTemporary !== !!b.isTemporary) return a.isTemporary ? -1 : 1;

    const aIsFolder = a.nodeType === DialFileNodeType.FOLDER;
    const bIsFolder = b.nodeType === DialFileNodeType.FOLDER;
    if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;

    const byField = compareRowsByField(a, b, sort.field);
    if (byField !== 0) return sign * byField;

    return sign * baseColumnComparator(a.name, b.name);
  });
};

/**
 * Asks the consumer whether `action` is blocked for `file`; the returned text is
 * the reason shown beside the disabled action.
 */
export type GetItemActionRestriction = (
  file: DialFile,
  action: DialFileManagerActions,
) => string | undefined;

/** Props that turn a menu item into a disabled one that says why. */
export const getRestrictedItemProps = (
  reason: string | undefined,
): Pick<DropdownItem, 'disabled' | 'interactiveTooltip'> =>
  reason ? { disabled: true, interactiveTooltip: { content: reason } } : {};
