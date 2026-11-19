import {
  DIAL_ICON_SIZE,
  DIAL_KIT_ICON_STROKE,
  type DropdownItem,
  GhostButton,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import { IconFolderPlus, IconPlus } from '@tabler/icons-react';
import { type FC, useEffect, useMemo, useRef, useState } from 'react';
import { type DialFile, DialFileNodeType } from '@/models/file';
import { DialFoldersTree } from '@/components/FileManager/components/FoldersTree/FoldersTree';
import type { FolderDestination } from '@/models/folder-destination';
import type { FolderDestinationTreeProps } from '@/models/folder-destination-tree';
import type { FolderNode } from '@/models/folder-tree';
import {
  buildRootedFolderTree,
  fromRootedPath,
  getRootTokenKeys,
  joinRootedKeys,
  splitRootedKeys,
  toRootedPath,
} from '@/utils/folder-destination';
import {
  collectFolderKeys,
  findFolderNode,
  FORBIDDEN_FOLDER_NAME_CHARS_RE,
  fromDialFileTree,
  fromFolderPathKey,
  getSiblingFolderNames,
  sortFolderTree,
  toDialFileTree,
  toFolderPathKey,
} from '@/utils/folder-tree';
import {
  getFolderNameError,
  getNextFolderNameFromNames,
  isBlockingValidationError,
  searchFoldersByName,
} from '@/components/FileManager/utils';
import { DEFAULT_WARNINGS } from '@/components/FileManager/errors';

const CANCEL_CREATING_FOLDER_ATTRIBUTE = 'data-cancel-creating-folder';

/* The single-root tree's root node path key. */
const SINGLE_ROOT_KEY = '';

const EMPTY_ITEMS: FolderNode[] = [];

/** Destination folder tree ordered by folder name at every level, with search, folder creation (trailing button and context menu), a disabled state, and an optional multi-root mode. */
export const FolderDestinationTree: FC<FolderDestinationTreeProps> = ({
  items = EMPTY_ITEMS,
  selectedPath: selectedPathProp,
  onSelectedPathChange,
  onCreateFolder,
  roots,
  destination,
  onDestinationChange,
  onCreateDestinationFolder,
  onCreateFolderError,
  searchQuery,
  getDisabledReason,
  disabled = false,
  createFolderLabel = 'Create new folder',
  cancelCreatingFolderLabel = 'Cancel',
  addSiblingFolderLabel = 'Add sibling',
  addChildFolderLabel = 'Add child',
  newFolderDefaultName = 'New folder',
  noResultsLabel = 'No folders match "{query}".',
  emptyFolderNameError = 'Folder name cannot be empty.',
  invalidFolderNameError = 'Folder name contains invalid characters.',
  duplicateFolderNameError = 'A folder with this name already exists.',
  sameAsParentFolderNameError = 'A folder cannot have the same name as its parent folder.',
  hiddenFolderNameWarning = DEFAULT_WARNINGS.hiddenItemWarning,
  onValidateFolderName,
  rootLabel = 'Root',
  collapsibleRoots = false,
  expandedPaths: controlledExpandedPaths,
  onExpandedPathsChange,
  loadingPaths: loadingPathsProp,
  styles: stylesProp = {},
}) => {
  const isMultiRoot = roots != null;
  /* Every node in multi-root mode lives under a root token (see `folder-destination.ts`). */
  const treeItems = useMemo(
    () => (roots ? buildRootedFolderTree(roots) : items),
    [roots, items],
  );
  /*
   * "Add child" expands a parent whose children may still be loading. The
   * inline editor can hold on to the validate/confirm callbacks from when it
   * opened, so they read the tree through this ref: a sibling that lands
   * after the editor opened still counts as a duplicate.
   */
  const treeItemsRef = useRef(treeItems);
  useEffect(() => {
    treeItemsRef.current = treeItems;
  }, [treeItems]);
  const rootKeys = useMemo(
    () => (roots ? getRootTokenKeys(roots) : [SINGLE_ROOT_KEY]),
    [roots],
  );
  let selectedPath = selectedPathProp;
  if (isMultiRoot) {
    selectedPath = destination ? toRootedPath(destination) : undefined;
  }

  /* Counts the user's own selections, so a create that finishes later does not override a newer pick. */
  const selectionVersionRef = useRef(0);
  const latestCreationRef = useRef(0);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const selectPath = (path: string[] | undefined) => {
    if (isMultiRoot) {
      onDestinationChange?.(path ? fromRootedPath(path) : undefined);
    } else {
      onSelectedPathChange?.(path);
    }
  };

  const [internalExpandedPaths, setInternalExpandedPaths] = useState<
    Set<string>
  >(
    () =>
      new Set(
        selectedPath?.map((_, i) =>
          toFolderPathKey(selectedPath.slice(0, i + 1)),
        ) ?? [],
      ),
  );
  const multiRootExpandedPaths = useMemo(
    () =>
      roots
        ? new Set([
            ...internalExpandedPaths,
            ...joinRootedKeys(roots, (root) => root.expandedPaths),
          ])
        : undefined,
    [roots, internalExpandedPaths],
  );
  const expandedPaths =
    multiRootExpandedPaths ?? controlledExpandedPaths ?? internalExpandedPaths;
  const loadingPaths = useMemo(
    () =>
      roots
        ? joinRootedKeys(roots, (root) => root.loadingPaths)
        : loadingPathsProp,
    [roots, loadingPathsProp],
  );

  /* Roots the user collapsed; only tracked when roots are collapsible. */
  const [collapsedRootKeys, setCollapsedRootKeys] = useState<Set<string>>(
    () => new Set(),
  );

  /*
   * Root nodes stay expanded unless the tree lets the user collapse them. Their
   * keys are stripped before the set reaches the host, because a root is not
   * a real folder path the host can fetch children for.
   */
  const handleExpandedPathsChange = (next: Set<string>) => {
    /* A search forces every root open, so a toggle during one is not the user collapsing a root. */
    if (collapsibleRoots && !isFiltering) {
      setCollapsedRootKeys(new Set(rootKeys.filter((key) => !next.has(key))));
    }
    const withoutRoots = new Set(next);
    for (const key of rootKeys) withoutRoots.delete(key);
    if (roots) {
      setInternalExpandedPaths(withoutRoots);
      const byRoot = splitRootedKeys(roots, withoutRoots);
      for (const root of roots) {
        root.onExpandedPathsChange?.(byRoot.get(root.key) ?? new Set());
      }
    } else if (onExpandedPathsChange) {
      onExpandedPathsChange(withoutRoots);
    } else {
      setInternalExpandedPaths(withoutRoots);
    }
  };
  const [creatingParentPath, setCreatingParentPath] = useState<string[] | null>(
    null,
  );
  /* Resolved once per creation session to avoid an existing sibling name. */
  const [creatingFolderName, setCreatingFolderName] =
    useState(newFolderDefaultName);
  /*
   * The inline editor (`useEditableItem` in the ui-kit) commits on any press
   * outside it, which includes the Cancel button, and again on the blur raised
   * when the editor is removed. Both run before this component's own cancel
   * handler. A native capture listener registered on mount runs ahead of the
   * hook's (added once the editor opens), so it flags a press on Cancel and
   * `handleConfirmCreatingFolder` drops the commits that follow, until the next
   * creation starts.
   *
   * The same applies to the keyboard: Tab from the editor to Cancel blurs the
   * input (the hook commits on blur) before Enter or Space can activate Cancel,
   * so a `focusout` that lands on Cancel is flagged too. The flag is lifted
   * again when focus or a press goes anywhere else, so tabbing back into the
   * editor and pressing Enter still creates the folder.
   *
   * TODO(ui-kit): `useEditableItem` lives in `@epam/ai-dial-ui-kit`, so this
   * cannot be fixed here. It should let the host exclude elements (or hand it
   * an `onCancel` that wins) so a press on Cancel is not a commit; drop this
   * listener and `CANCEL_CREATING_FOLDER_ATTRIBUTE` once the kit offers that.
   */
  const isCancellingRef = useRef(false);
  useEffect(() => {
    const isCancelTarget = (target: EventTarget | null) =>
      target instanceof Element &&
      target.closest(`[${CANCEL_CREATING_FOLDER_ATTRIBUTE}]`) != null;
    const flagCancelPress = (event: PointerEvent) => {
      isCancellingRef.current = isCancelTarget(event.target);
    };
    const flagCancelFocusOut = (event: FocusEvent) => {
      if (isCancelTarget(event.relatedTarget)) {
        isCancellingRef.current = true;
      }
    };
    const clearOnOtherFocus = (event: FocusEvent) => {
      if (!isCancelTarget(event.target)) {
        isCancellingRef.current = false;
      }
    };
    document.addEventListener('pointerdown', flagCancelPress, true);
    document.addEventListener('focusout', flagCancelFocusOut, true);
    document.addEventListener('focusin', clearOnOtherFocus, true);
    return () => {
      document.removeEventListener('pointerdown', flagCancelPress, true);
      document.removeEventListener('focusout', flagCancelFocusOut, true);
      document.removeEventListener('focusin', clearOnOtherFocus, true);
    };
  }, []);

  const trimmedQuery = searchQuery.trim();
  const isCreatingFolder = creatingParentPath != null;

  /* The file manager's folder search (it skips hidden dot-folders), run over the tree as `DialFile`s. */
  const matchingItems = useMemo(
    () =>
      trimmedQuery
        ? fromDialFileTree(
            searchFoldersByName(toDialFileTree(treeItems), trimmedQuery).items,
          )
        : treeItems,
    [treeItems, trimmedQuery],
  );
  const hasNoSearchMatches =
    trimmedQuery.length > 0 && matchingItems.length === 0;
  /*
   * The filter is suspended while the inline create-folder row is open: the
   * row is rendered by `DialFoldersTree` underneath its parent node, so a
   * query that filters that parent out (a query matching nothing at all, in
   * particular) would otherwise hide the editor the user just opened.
   */
  const isFiltering = !isCreatingFolder && trimmedQuery.length > 0;

  const visibleItems = useMemo(() => {
    const shown = isFiltering ? matchingItems : treeItems;
    // Multi-root items are already sorted inside each root; the roots keep the host's order.
    return isMultiRoot ? shown : sortFolderTree(shown);
  }, [isFiltering, matchingItems, treeItems, isMultiRoot]);

  const searchExpandedPaths = useMemo(
    () => new Set([...rootKeys, ...collectFolderKeys(visibleItems)]),
    [rootKeys, visibleItems],
  );
  const treeExpandedPaths = useMemo(
    () =>
      new Set([
        ...(collapsibleRoots && !isFiltering
          ? rootKeys.filter((key) => !collapsedRootKeys.has(key))
          : rootKeys),
        ...(isFiltering ? searchExpandedPaths : expandedPaths),
      ]),
    [
      collapsibleRoots,
      collapsedRootKeys,
      rootKeys,
      isFiltering,
      searchExpandedPaths,
      expandedPaths,
    ],
  );

  const childFiles = useMemo<DialFile[]>(
    () => toDialFileTree(visibleItems),
    [visibleItems],
  );

  /**
   * The bucket root is a real, always-expanded top-level tree node (matching
   * the file manager's own root-node pattern) so it is selectable exactly
   * like any folder — `path: ''` maps to `selectedPath: []` via
   * `fromFolderPathKey`/`toFolderPathKey`. In multi-root mode the roots
   * themselves are the top-level nodes. Omitted while a search matches
   * nothing so `emptyStateDescription` can render instead.
   */
  const dialFiles = useMemo<DialFile[]>(() => {
    if (isFiltering && childFiles.length === 0) {
      return [];
    }
    if (isMultiRoot) {
      return childFiles;
    }
    return [
      {
        path: SINGLE_ROOT_KEY,
        name: rootLabel,
        folderId: SINGLE_ROOT_KEY,
        nodeType: DialFileNodeType.FOLDER,
        items: childFiles,
      },
    ];
  }, [childFiles, rootLabel, isFiltering, isMultiRoot]);

  const createdFolderPath = creatingParentPath
    ? toFolderPathKey(creatingParentPath)
    : null;

  const folderNameErrors = {
    empty: emptyFolderNameError,
    invalid: invalidFolderNameError,
    duplicate: duplicateFolderNameError,
    sameAsParent: sameAsParentFolderNameError,
    hidden: hiddenFolderNameWarning,
  };

  /* The name a new folder under `parentPath` may not take; a root (single-root `[]` or a multi-root token) has none. */
  const getParentFolderName = (parentPath: string[]): string | undefined =>
    rootKeys.includes(toFolderPathKey(parentPath))
      ? undefined
      : parentPath.at(-1);

  /* The destination a tree node stands for: a root token node maps to the root itself. */
  const toDestination = (nodePath: string[]): FolderDestination | undefined => {
    if (!roots) return { rootKey: SINGLE_ROOT_KEY, path: nodePath };
    return fromRootedPath(nodePath);
  };

  const getRowDisabledReason = (file: DialFile): string | undefined => {
    if (!getDisabledReason) return undefined;
    const destination = toDestination(fromFolderPathKey(file.path));
    return destination
      ? getDisabledReason(destination) || undefined
      : undefined;
  };

  const isPathDisabled = (path: string[]): boolean => {
    const destination = toDestination(path);
    return destination != null && !!getDisabledReason?.(destination);
  };

  const canCreateUnder = (parentPath: string[]): boolean => {
    if (isPathDisabled(parentPath)) return false;
    if (!roots) return true;
    const target = fromRootedPath(parentPath);
    const root = roots.find((candidate) => candidate.key === target?.rootKey);
    return root != null && root.canCreateFolders !== false;
  };

  /* The parent the trailing "Create new folder" button creates under, or `undefined` when none accepts new folders. */
  const resolveTrailingCreateParent = (): string[] | undefined => {
    if (!roots) {
      const parent = selectedPath ?? [];
      return canCreateUnder(parent) ? parent : undefined;
    }
    if (selectedPath && canCreateUnder(selectedPath)) return selectedPath;
    const firstCreatable = roots.find(
      (root) => root.canCreateFolders !== false,
    );
    return firstCreatable
      ? toRootedPath({ rootKey: firstCreatable.key, path: [] })
      : undefined;
  };
  const trailingCreateParent = resolveTrailingCreateParent();

  /*
   * A query that matched no folder reads as "the folder I want doesn't exist
   * yet", so creating from that state pre-fills the editor with the query —
   * which also keeps the confirmed folder visible once the filter resumes.
   */
  const resolveNewFolderName = (parentPath: string[]): string => {
    const parentName = getParentFolderName(parentPath);
    const takenNames = [
      ...getSiblingFolderNames(treeItems, parentPath),
      ...(parentName ? [parentName] : []),
    ];
    const isQueryUsableAsName =
      hasNoSearchMatches &&
      getFolderNameError(trimmedQuery, {
        siblingNames: takenNames,
        messages: folderNameErrors,
        forbiddenChars: FORBIDDEN_FOLDER_NAME_CHARS_RE,
      }) == null;
    return isQueryUsableAsName
      ? trimmedQuery
      : getNextFolderNameFromNames(takenNames, newFolderDefaultName);
  };

  /*
   * "Add child" on a folder whose children are not listed yet expands it,
   * which makes the host fetch them. Opening the editor right away would let
   * a name be confirmed before that listing lands, when the parent still
   * looks empty — so a duplicate of an existing child passed the check. The
   * editor therefore opens once the parent is no longer loading (the parent
   * row shows the host's loading indicator meanwhile), with a default name
   * that is unique among the children that actually exist.
   */
  const [pendingCreateParentPath, setPendingCreateParentPath] = useState<
    string[] | null
  >(null);
  /*
   * A host may flag the parent as loading only a render after the expand
   * (from an effect), so a parent whose children are unknown also waits one
   * macrotask for that flag to show up before the editor opens.
   */
  const [settledCreateParentKey, setSettledCreateParentKey] = useState<
    string | null
  >(null);
  const pendingCreateParentKey =
    pendingCreateParentPath != null
      ? toFolderPathKey(pendingCreateParentPath)
      : null;
  const pendingCreateWaitsForListing =
    pendingCreateParentPath != null &&
    pendingCreateParentKey != null &&
    !rootKeys.includes(pendingCreateParentKey) &&
    findFolderNode(treeItems, pendingCreateParentPath)?.children === undefined;
  useEffect(() => {
    if (!pendingCreateParentKey || !pendingCreateWaitsForListing) return;
    const timer = setTimeout(
      () => setSettledCreateParentKey(pendingCreateParentKey),
      0,
    );
    return () => clearTimeout(timer);
  }, [pendingCreateParentKey, pendingCreateWaitsForListing]);
  if (
    pendingCreateParentPath != null &&
    pendingCreateParentKey != null &&
    !loadingPaths?.has(pendingCreateParentKey) &&
    (!pendingCreateWaitsForListing ||
      settledCreateParentKey === pendingCreateParentKey)
  ) {
    setPendingCreateParentPath(null);
    setCreatingParentPath(pendingCreateParentPath);
    setCreatingFolderName(resolveNewFolderName(pendingCreateParentPath));
  }

  const beginCreatingFolder = (parentPath: string[]) => {
    setCreatingParentPath(null);
    setPendingCreateParentPath(parentPath);
    setSettledCreateParentKey(null);
    isCancellingRef.current = false;
    const parentKey = toFolderPathKey(parentPath);
    /*
     * `expandedPaths` never holds root keys, so building the next set from it
     * alone would read as "every root collapsed" and hide the editor, which
     * renders under the parent. Keep the roots that are open, and open the
     * root the parent lives in even if the user had collapsed it.
     */
    const parentRootKey = isMultiRoot ? parentPath[0] : SINGLE_ROOT_KEY;
    const next = new Set([
      ...expandedPaths,
      ...rootKeys.filter(
        (key) => !collapsibleRoots || !collapsedRootKeys.has(key),
      ),
      parentRootKey,
    ]);
    if (parentKey) next.add(parentKey);
    if (collapsibleRoots) {
      /* A search skips the collapse bookkeeping below, so a root collapsed earlier would stay collapsed. */
      setCollapsedRootKeys((collapsed) => {
        if (!collapsed.has(parentRootKey)) return collapsed;
        const remaining = new Set(collapsed);
        remaining.delete(parentRootKey);
        return remaining;
      });
    }
    handleExpandedPathsChange(next);
  };

  const handleStartCreatingFolder = () => {
    if (trailingCreateParent) beginCreatingFolder(trailingCreateParent);
  };

  /**
   * Per-row context menu, mirroring the file manager's "Add sibling" /
   * "Add child" folder-creation actions (see
   * `useFolderCreation`/`startTreeSiblingFolderCreation`/
   * `startTreeChildFolderCreation` in `FileManager`). The state machines
   * differ — this tree creates folders in a `FolderNode` model, the grid in
   * `DialFile`s — but name validation (`getFolderNameError`) and default
   * naming (`getNextFolderNameFromNames`) are shared with the grid.
   * "Add sibling" is omitted for a root node, which has no parent to create a
   * sibling under, and a root that does not accept new folders offers neither
   * action.
   */
  const getFolderContextMenuItems = (file: DialFile): DropdownItem[] => {
    const childPath = fromFolderPathKey(file.path);
    if (!canCreateUnder(childPath)) {
      return [];
    }
    const items: DropdownItem[] = [
      {
        key: 'add-child',
        label: addChildFolderLabel,
        icon: (
          <IconFolderPlus
            size={DIAL_ICON_SIZE.SM}
            aria-hidden
            stroke={DIAL_KIT_ICON_STROKE}
          />
        ),
        onClick: () => beginCreatingFolder(childPath),
      },
    ];
    if (!rootKeys.includes(file.path)) {
      items.push({
        key: 'add-sibling',
        label: addSiblingFolderLabel,
        icon: (
          <IconPlus
            size={DIAL_ICON_SIZE.SM}
            aria-hidden
            stroke={DIAL_KIT_ICON_STROKE}
          />
        ),
        onClick: () => beginCreatingFolder(childPath.slice(0, -1)),
      });
    }
    return items;
  };

  const validateNewFolderName = (rawValue: string): string | null => {
    if (!creatingParentPath) {
      return null;
    }
    return getFolderNameError(rawValue, {
      siblingNames: getSiblingFolderNames(
        treeItemsRef.current,
        creatingParentPath,
      ),
      messages: folderNameErrors,
      parentName: getParentFolderName(creatingParentPath),
      forbiddenChars: FORBIDDEN_FOLDER_NAME_CHARS_RE,
      onValidate: (trimmedName) => {
        const parent = toDestination(creatingParentPath);
        return parent
          ? (onValidateFolderName?.(trimmedName, parent) ?? null)
          : null;
      },
    });
  };

  const handleConfirmCreatingFolder = (rawValue: string) => {
    if (!creatingParentPath || isCancellingRef.current) {
      return;
    }
    const trimmed = rawValue.trim();
    const error = validateNewFolderName(rawValue);
    /* A warning (hidden name) is informational; only an error blocks the creation. */
    if (!isBlockingValidationError(error)) {
      const parent = roots ? fromRootedPath(creatingParentPath) : undefined;
      const createdPath = [...creatingParentPath, trimmed];
      const selectionVersionAtStart = selectionVersionRef.current;
      /* A host that fails to create the folder must not leave a folder that does not exist selected. */
      const result = parent
        ? onCreateDestinationFolder?.(parent.rootKey, parent.path, trimmed)
        : onCreateFolder?.(creatingParentPath, trimmed);
      if (result && typeof result.then === 'function') {
        const creation = ++latestCreationRef.current;
        const selectCreated = () => {
          /* Skip when the tree unmounted or a newer creation started; the user has moved on. */
          if (
            isMountedRef.current &&
            creation === latestCreationRef.current &&
            selectionVersionRef.current === selectionVersionAtStart
          ) {
            selectPath(createdPath);
          }
        };
        /* Without `onCreateFolderError` a rejection stays unhandled, as it would be for the host's own promise. */
        if (onCreateFolderError) {
          result.then(selectCreated, onCreateFolderError);
        } else {
          result.then(selectCreated);
        }
      } else {
        selectPath(createdPath);
      }
    }
    setCreatingParentPath(null);
  };

  const handleCancelCreatingFolder = () => setCreatingParentPath(null);

  const handleItemClick = (file: DialFile) => {
    if (disabled || getRowDisabledReason(file)) return;
    selectionVersionRef.current += 1;
    const isSelected =
      selectedPath != null && toFolderPathKey(selectedPath) === file.path;
    selectPath(isSelected ? undefined : fromFolderPathKey(file.path));
  };

  return (
    <div
      style={stylesProp.cssVars}
      className={mergeClasses(
        disabled && 'pointer-events-none opacity-60',
        stylesProp.className,
      )}
      /* `pointer-events-none` alone leaves the keyboard working; `inert` removes the subtree from focus and the accessibility tree. */
      inert={disabled}
    >
      <div className="w-full max-w-full min-w-0">
        <DialFoldersTree
          items={dialFiles}
          showFiles={false}
          selectedPath={
            selectedPath != null ? toFolderPathKey(selectedPath) : undefined
          }
          expandedPaths={treeExpandedPaths}
          onExpandedPathsChange={handleExpandedPathsChange}
          loadingPaths={loadingPaths}
          onItemClick={handleItemClick}
          getDisabledTooltip={
            getDisabledReason ? getRowDisabledReason : undefined
          }
          getContextMenuItems={getFolderContextMenuItems}
          createdFolderPath={createdFolderPath}
          newFolderDefaultName={creatingFolderName}
          onCreateFolderSave={handleConfirmCreatingFolder}
          onCreateFolderCancel={handleCancelCreatingFolder}
          onRenameValidate={(value) => validateNewFolderName(value)}
          searchQuery={isFiltering ? trimmedQuery : undefined}
          emptyStateTitle={
            isFiltering
              ? noResultsLabel.replace('{query}', trimmedQuery)
              : undefined
          }
        />
      </div>

      <div className="my-2 border-t border-tertiary" aria-hidden />

      {/*
       * Plain `GhostButton` stands in for a tertiary button: the installed
       * kit declares `ButtonVariant.Tertiary` but ships no CSS for it yet on
       * the real Button/GhostButton, so it would silently render as
       * primary-solid. Switch to `variant={ButtonVariant.Tertiary}` once the
       * kit adds the style.
       * TODO(ui-kit): `ButtonVariant.Tertiary` has an empty style map in the
       * kit's `Button/constants.ts`; the style needs to ship there first.
       */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <GhostButton
          onClick={handleStartCreatingFolder}
          label={createFolderLabel}
          iconBefore={
            <IconPlus
              size={DIAL_ICON_SIZE.SM}
              aria-hidden
              stroke={DIAL_KIT_ICON_STROKE}
            />
          }
          disabled={disabled || isCreatingFolder || !trailingCreateParent}
        />
        {isCreatingFolder && (
          <GhostButton
            label={cancelCreatingFolderLabel}
            onClick={handleCancelCreatingFolder}
            disabled={disabled}
            {...{ [CANCEL_CREATING_FOLDER_ATTRIBUTE]: '' }}
          />
        )}
      </div>
    </div>
  );
};
