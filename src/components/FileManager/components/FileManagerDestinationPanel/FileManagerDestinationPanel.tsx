import { useCallback, useMemo, useState, type FC } from 'react';
import { FolderDestinationPanel } from '@/components/FolderDestinationPanel/FolderDestinationPanel';
import { FOLDER_PLACEHOLDER_FILE_NAME } from '@/components/FileManager/constants';
import {
  findNodeByPath,
  isHiddenDotFile,
  isPathWithinFolders,
} from '@/components/FileManager/utils';
import { type DialFile, DialFileNodeType } from '@/models/file';
import type {
  DialDestinationRequest,
  DialUploadFileItem,
} from '@/models/file-manager';
import type {
  FolderDestination,
  FolderDestinationRoot,
} from '@/models/folder-destination';
import type {
  FolderDestinationPanelContentLabels,
  FolderDestinationPanelLabels,
} from '@/models/folder-destination-panel';
import type { FolderNode } from '@/models/folder-tree';
import { FolderDestinationItemIcon } from '@/types/folder-destination-panel';
import { DestinationFolderMode } from '@/types/file-manager';
import { fromFolderPathKey } from '@/utils/folder-tree';

/** Text and behavior overrides of the destination panel the file manager shows for Copy and Move. */
export interface DialFileManagerDestinationPanelOptions {
  /** Panel title for Copy. Defaults to `'Copy to'`. */
  copyTitle?: string;
  /** Panel title for Move. Defaults to `'Move to'`. */
  moveTitle?: string;
  /** Label of the panel's Copy button. Defaults to `'Copy'`. */
  copyLabel?: string;
  /** Label of the panel's Move button. Defaults to `'Move'`. */
  moveLabel?: string;
  /** Label of the root node when `rootItem` is not set and the items have several top-level folders. Defaults to `'All files'`. */
  rootLabel?: string;
  /** Text naming several items in the panel's summary row. Defaults to `'N items'`. */
  getSourceItemsLabel?: (count: number) => string;
  /** Reason shown when Move targets the folder the items are already in. Defaults to `'Unavailable for the original path. Please select another folder'`. */
  disabledPathTooltip?: string;
  /** Reason shown when Move targets a moved folder or one inside it. Defaults to `"A folder can't be moved into itself or its subfolders"`. */
  movedIntoItselfTooltip?: string;
  /** Paths to leave out of the panel's folder tree, with their subtrees. The main tree and grid are unaffected. */
  excludedPaths?: string[];
  /** Text overrides of the panel's drawer, applied to both Copy and Move; a title set here wins over `copyTitle` and `moveTitle`. */
  labels?: FolderDestinationPanelLabels;
  /** Text overrides of the panel's body. */
  panelLabels?: FolderDestinationPanelContentLabels;
}

export interface FileManagerDestinationPanelProps {
  /** The Copy or Move the user started. */
  request: DialDestinationRequest;
  /** The file manager's items, a tree whose folders become the destination tree. */
  items: DialFile[];
  /** The custom root node of the file manager, when it has one. */
  rootItem?: { path: string; label: string };
  /** Whether dot-folders are listed, like in the main tree. */
  areHiddenFilesVisible?: boolean;
  /** The host's folder creation; without it the panel offers no folder creation. */
  onCreateFolder?: (
    file: DialUploadFileItem,
    folderPath: string,
    fileId: string,
  ) => void | Promise<void>;
  /** The host's check of a new folder's name. */
  onCreateFolderValidate?: (
    name: string,
    parentFolder: DialFile,
  ) => string | null;
  /** Messages of the folder-name checks, shared with the main view's folder creation. */
  folderCreationValidationMessages?: {
    emptyName?: string;
    duplicateName?: string;
    hiddenItemWarning?: string;
    consecutiveDotsError?: string;
    forbiddenChars?: string;
  };
  /** Text and behavior overrides. */
  options?: DialFileManagerDestinationPanelOptions;
  /** Called when the user dismisses the panel without confirming. */
  onCancel: () => void;
  /** Called once the user confirmed a destination. */
  onConfirmed: () => void;
}

const ROOT_KEY = '';

const trimTrailingSlash = (path: string) => path.replace(/\/+$/, '');

/**
 * Turns the file manager's items into the folder nodes of a destination tree:
 * folders only, hidden dot-folders left out unless shown, `excludedPaths` and
 * their subtrees dropped, and paths relative to the root (`rootSegments`
 * segments removed). A folder whose contents are not loaded keeps `children`
 * undefined so the tree does not read it as empty.
 */
export const toDestinationFolderNodes = (
  nodes: DialFile[] | undefined,
  rootSegments: number,
  {
    showHidden,
    excludedPaths,
  }: { showHidden?: boolean; excludedPaths?: string[] },
): FolderNode[] =>
  (nodes ?? [])
    .filter(
      (node) =>
        node.nodeType === DialFileNodeType.FOLDER &&
        (showHidden || !isHiddenDotFile(node)) &&
        !(
          excludedPaths?.length && isPathWithinFolders(node.path, excludedPaths)
        ),
    )
    .map((node) => ({
      path: fromFolderPathKey(node.path).slice(rootSegments),
      name: node.name,
      children: node.items
        ? toDestinationFolderNodes(node.items, rootSegments, {
            showHidden,
            excludedPaths,
          })
        : undefined,
    }));

/**
 * The destination picker `DialFileManager` shows for Copy and Move when the
 * host does not handle `onDestinationRequest` itself: a `FolderDestinationPanel`
 * over the file manager's own folders.
 */
export const FileManagerDestinationPanel: FC<
  FileManagerDestinationPanelProps
> = ({
  request,
  items,
  rootItem,
  areHiddenFilesVisible,
  onCreateFolder,
  onCreateFolderValidate,
  folderCreationValidationMessages,
  options,
  onCancel,
  onConfirmed,
}) => {
  const isMove = request.mode === DestinationFolderMode.Move;
  const {
    copyTitle = 'Copy to',
    moveTitle = 'Move to',
    copyLabel = 'Copy',
    moveLabel = 'Move',
    rootLabel = 'All files',
    getSourceItemsLabel = (count: number) => `${count} items`,
    disabledPathTooltip = 'Unavailable for the original path. Please select another folder',
    movedIntoItselfTooltip = "A folder can't be moved into itself or its subfolders",
    excludedPaths,
    labels,
    panelLabels,
  } = options ?? {};

  /*
   * The root is the host's `rootItem`, or the one top-level folder the items
   * have (the main tree shows it as its top node). With several top-level
   * folders and no `rootItem` the root is virtual: it has no path of its own,
   * so it is not a destination.
   */
  const root = useMemo(() => {
    if (rootItem) {
      return { path: rootItem.path, label: rootItem.label };
    }
    const topLevel = items.filter(
      (item) => item.nodeType === DialFileNodeType.FOLDER,
    );
    return topLevel.length === 1
      ? { path: topLevel[0].path, label: topLevel[0].name }
      : { path: '', label: rootLabel };
  }, [rootItem, items, rootLabel]);
  const rootSegments = fromFolderPathKey(root.path).length;

  const folders = useMemo(
    () =>
      toDestinationFolderNodes(
        root.path ? findNodeByPath(items, root.path)?.items : items,
        rootSegments,
        { showHidden: areHiddenFilesVisible, excludedPaths },
      ),
    [items, root.path, rootSegments, areHiddenFilesVisible, excludedPaths],
  );

  const toFolderPath = useCallback(
    ({ path }: FolderDestination) =>
      root.path ? [root.path, ...path].join('/') : path.join('/'),
    [root.path],
  );
  const toDestination = useCallback(
    (folderPath: string): FolderDestination => {
      const segments = fromFolderPathKey(folderPath);
      const rootPathSegments = fromFolderPathKey(root.path);
      const isInsideRoot =
        segments.length >= rootPathSegments.length &&
        rootPathSegments.every((segment, index) => segments[index] === segment);
      return {
        rootKey: ROOT_KEY,
        path: isInsideRoot ? segments.slice(rootPathSegments.length) : [],
      };
    },
    [root.path],
  );

  const [destination, setDestination] = useState<FolderDestination>(() =>
    toDestination(request.sourceFolder),
  );

  const movedFolderPaths = useMemo(
    () =>
      request.items
        .filter((item) => item.nodeType === DialFileNodeType.FOLDER)
        .map((item) => item.path),
    [request.items],
  );

  const getDisabledReason = useCallback(
    (candidate: FolderDestination): string | undefined => {
      if (!isMove) return undefined;
      const folderPath = toFolderPath(candidate);
      if (isPathWithinFolders(folderPath, movedFolderPaths)) {
        return movedIntoItselfTooltip;
      }
      if (
        trimTrailingSlash(folderPath) ===
        trimTrailingSlash(request.sourceFolder)
      ) {
        return disabledPathTooltip;
      }
      return undefined;
    },
    [
      isMove,
      toFolderPath,
      movedFolderPaths,
      movedIntoItselfTooltip,
      disabledPathTooltip,
      request.sourceFolder,
    ],
  );

  const roots: FolderDestinationRoot[] = useMemo(
    () => [
      {
        key: ROOT_KEY,
        label: root.label,
        items: folders,
        canCreateFolders: !!onCreateFolder && root.path !== '',
      },
    ],
    [root, folders, onCreateFolder],
  );

  const handleCreateFolder = useCallback(
    async (_rootKey: string, parentPath: string[], name: string) => {
      const parent = toFolderPath({ rootKey: ROOT_KEY, path: parentPath });
      const folderPath = parent ? `${parent}/${name}` : name;
      await onCreateFolder?.(
        {
          fileContent: new File([], FOLDER_PLACEHOLDER_FILE_NAME, {
            type: 'text/plain',
          }),
          name: FOLDER_PLACEHOLDER_FILE_NAME,
        },
        folderPath,
        `${folderPath}/${FOLDER_PLACEHOLDER_FILE_NAME}`,
      );
    },
    [onCreateFolder, toFolderPath],
  );

  const handleValidateFolderName = useMemo(
    () =>
      onCreateFolderValidate
        ? (name: string, parent: FolderDestination): string | null => {
            const parentFolder = findNodeByPath(items, toFolderPath(parent));
            return parentFolder
              ? onCreateFolderValidate(name, parentFolder)
              : null;
          }
        : undefined,
    [onCreateFolderValidate, items, toFolderPath],
  );

  const sourceCount = request.items.length;
  const isDestinationUnavailable =
    root.path === '' && destination.path.length === 0;

  return (
    <FolderDestinationPanel
      isOpen
      onClose={onCancel}
      item={{
        title:
          sourceCount === 1
            ? request.items[0].name
            : getSourceItemsLabel(sourceCount),
        iconKind:
          sourceCount === 1 &&
          request.items[0].nodeType === DialFileNodeType.FOLDER
            ? FolderDestinationItemIcon.Folder
            : FolderDestinationItemIcon.File,
      }}
      roots={roots}
      destination={destination}
      onDestinationChange={setDestination}
      onCreateFolder={handleCreateFolder}
      getDisabledReason={getDisabledReason}
      onValidateFolderName={handleValidateFolderName}
      labels={{ title: isMove ? moveTitle : copyTitle, ...labels }}
      panelLabels={{
        createFolderEmptyNameError: folderCreationValidationMessages?.emptyName,
        createFolderInvalidNameError:
          folderCreationValidationMessages?.consecutiveDotsError ??
          folderCreationValidationMessages?.forbiddenChars,
        createFolderDuplicateNameError:
          folderCreationValidationMessages?.duplicateName,
        createFolderHiddenNameWarning:
          folderCreationValidationMessages?.hiddenItemWarning,
        ...panelLabels,
      }}
      action={{
        label: isMove ? moveLabel : copyLabel,
        isDisabled:
          isDestinationUnavailable || getDisabledReason(destination) != null,
        onClick: () => {
          request.confirm(toFolderPath(destination));
          onConfirmed();
        },
      }}
    />
  );
};
