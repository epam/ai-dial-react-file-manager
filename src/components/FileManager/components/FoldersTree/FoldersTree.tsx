import {
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { IconCaretRightFilled, IconDotsVertical } from '@tabler/icons-react';
import { DialFileNodeType, type DialFile } from '@/models/file';
import {
  mergeClasses,
  Dropdown,
  GhostIconButton,
  DropdownTrigger,
  NoDataContent,
  DialItemType,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import {
  CARET_ICON_PROPS,
  FOLDER_LEVEL_PADDING,
  NEW_FOLDER_TEMP_NAME,
} from './constants';
import {
  getForbiddenSymbolsTooltip,
  isHiddenDotFile,
} from '@/components/FileManager/utils';
import { DialFileManagerItemName } from '@/components/FileManager/components/FileManagerItemName/FileManagerItemName';
import { BASE_FILE_MANAGER_ICON_SIZE } from '@/components/FileManager/constants';
import { useExpandedPaths } from './hooks/use-expanded-paths';

export interface DialFoldersTreeProps {
  items: DialFile[];
  expandedPaths?: Set<string>;
  loadingPaths?: Set<string>;
  loadedPaths?: Set<string>;
  sharedByMePaths?: Set<string>;
  selectedPath?: string;
  renamedPath?: string;
  createdFolderPath?: string | null;
  showFiles?: boolean;
  rootItemPath?: string;
  rootItemLabel?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateIcon?: ReactNode;
  onItemClick?: (item: DialFile) => void;
  onRenameSave?: (value: string) => void;
  onRenameCancel?: () => void;
  onRenameValidate?: (value: string, item: DialFile) => string | null;
  onCreateFolderSave?: (value: string) => void;
  onCreateFolderCancel?: () => void;
  getContextMenuItems?: (item: DialFile) => DropdownItem[];
  areHiddenFilesVisible?: boolean;
  onExpandedPathsChange?: (expandedPaths: Set<string>) => void;
  forbiddenSymbolsRegExp?: RegExp;
  forbiddenSymbolsTooltip?: ReactNode;
  newFolderDefaultName?: string;
  /** Accessible name of the `role="tree"` root. Defaults to `'Folders'`. */
  ariaLabel?: string;
  /** Moves focus to the selected row (or the first row) when the tree mounts. */
  autoFocus?: boolean;
  /** Called when Escape is pressed on a row, e.g. to close an overlay hosting the tree. */
  onEscape?: () => void;
}

interface VisibleRow {
  node: DialFile;
  parentPath?: string;
}

const collectVisibleRows = (
  nodes: DialFile[],
  expandedPaths: Set<string>,
  isNodeVisible: (node: DialFile) => boolean,
  parentPath?: string,
): VisibleRow[] =>
  nodes.flatMap((node) => {
    if (!isNodeVisible(node)) return [];
    const row: VisibleRow = { node, parentPath };
    if (
      node.nodeType !== DialFileNodeType.FOLDER ||
      !expandedPaths.has(node.path)
    ) {
      return [row];
    }
    return [
      row,
      ...collectVisibleRows(
        node.items ?? [],
        expandedPaths,
        isNodeVisible,
        node.path,
      ),
    ];
  });

/**
 * DialFoldersTree — A hierarchical folder tree component with nested expand/collapse support, selection highlighting,
 * and optional file display.
 *
 * Provides a fully interactive, recursive folder structure with:
 * - Expandable and collapsible items
 * - Optional file visibility
 * - Loading state indicators for specific paths
 * - Inline renaming support for folders or files
 * - Multi-item selection highlighting
 * - Context menu integration via `Dropdown`
 * - Recursive rendering with indentation and icons
 * - Customizable empty state (title, description, and icon)
 *
 * @example
 * ```tsx
 * // Basic usage with folders and files
 * const items: DialFile[] = [
 *   {
 *     path: '/documents',
 *     name: 'Documents',
 *     nodeType: DialFileNodeType.FOLDER,
 *     items: [
 *       {
 *         path: '/documents/file.txt',
 *         name: 'file.txt',
 *         nodeType: DialFileNodeType.FILE,
 *       },
 *     ],
 *   },
 * ];
 *
 * <DialFoldersTree items={items} showFiles />
 *
 * // With expanded and selected items
 * const expandedPaths = new Set(['/documents']);
 *
 * <DialFoldersTree
 *   items={items}
 *   expandedPaths={expandedPaths}
 *   selectedPath="/documents/file.txt"
 *   onItemClick={(item) => console.log('Clicked:', item.path)}
 * />
 *
 * // With inline renaming and validation
 * <DialFoldersTree
 *   items={items}
 *   renamedPath="/documents"
 *   onRenameValidate={(value) => (value.trim() ? null : 'Name cannot be empty')}
 *   onRenameSave={(newValue) => console.log('Saved new name:', newValue)}
 *   onRenameCancel={() => console.log('Edit cancelled')}
 * />
 *
 * // With custom empty state and context menu
 * const getContextMenuItems = (item: DialFile): DropdownItem[] => [
 *   { key: 'rename', label: 'Rename' },
 *   { key: 'delete', label: 'Delete', danger: true },
 * ];
 *
 * <DialFoldersTree
 *   items={[]}
 *   emptyStateTitle="No Content"
 *   emptyStateDescription="Upload files or create a new folder to get started."
 *   emptyStateIcon={<IconFolderPlus {...FILE_MANAGER_ICON_PROPS} />}
 *   getContextMenuItems={getContextMenuItems}
 * />
 * ```
 *
 * @param [items] - Array of folder and file nodes to display in the tree.
 * @param [expandedPaths] - Set of folder paths that should be expanded.
 * @param [loadingPaths] - Set of folder paths currently loading (shows spinner or placeholder).
 * @param [loadedPaths] - Set of folder paths that have loaded.
 * @param [sharedByMePaths] - Set of items paths that the user has shared with others. Enables UI indicators (icons/badges).
 * @param [selectedPath] - Path representing the currently selected folder or file.
 * @param [renamedPath] - Path of the folder or file currently being edited.
 * @param [showFiles=false] - Whether to show files in addition to folders.
 * @param [emptyStateTitle='No Folders'] - Title text displayed when there are no items.
 * @param [emptyStateDescription] - Optional description text for the empty state.
 * @param [emptyStateIcon] - Optional icon to display in the empty state.
 * @param [onItemClick] - Callback fired when a folder or file is clicked (receives the corresponding `DialFile` node).
 * @param [onRenameSave] - Callback fired when editing is confirmed with a valid name (receives the new name).
 * @param [onRenameCancel] - Callback fired when editing is cancelled.
 * @param [onRenameValidate] - Function to validate the new name during editing. Should return an error string or `null` if valid.
 * @param [getContextMenuItems] - Function returning context menu items for a given node.
 * @param [areHiddenFilesVisible=false] - Whether hidden files (dotfiles) should be visible in the tree.
 * @param [rootItemPath] - Path of the folder to treat as the custom root node (no context menu, special label).
 * @param [rootItemLabel] - Label to display for the root node instead of its actual name.
 * @param [forbiddenSymbolsRegExp] - Optional RegExp used to validate folder and file names for forbidden characters.
 * @param [forbiddenSymbolsTooltip] - Optional tooltip content displayed when a name contains forbidden characters.
 * @param [createdFolderPath] - Optional Path of the new created folder.
 * @param [onCreateFolderSave] - Optional Callback fired when create new folder is confirmed
 * @param [onCreateFolderCancel] - Optional Callback fired when create new folder is cancelled
 * @param [newFolderDefaultName] - Optional new folder default name.
 * @param [ariaLabel='Folders'] - Accessible name of the `role="tree"` root.
 * @param [autoFocus=false] - Moves focus to the selected row (or the first row) on mount.
 * @param [onEscape] - Callback fired when Escape is pressed on a row.
 * @remarks
 * - Folder and file data must follow the `DialFile` model.
 * - The `expandedPaths`, `loadingPaths`, `selectedPath`, and `renamedPath` props are externally controlled.
 * - Inline renaming is fully customizable using `onRenameSave`, `onRenameCancel`, and `onRenameValidate`.
 * - Context menus can be attached to both folders and files using `getContextMenuItems`.
 * - Use `showFiles={false}` to render only folders for a simplified tree.
 * - Rows are `role="treeitem"` with a roving tabIndex: Arrow Up/Down and
 *   Home/End move focus, Arrow Right/Left expand, collapse or move to the
 *   parent (mirrored under `dir="rtl"`), Enter/Space activate the row as a
 *   click does, and Escape calls `onEscape`.
 */
export const DialFoldersTree: FC<DialFoldersTreeProps> = ({
  items,
  showFiles = false,
  expandedPaths: externalExpandedPaths,
  loadingPaths = new Set(),
  loadedPaths = new Set(),
  sharedByMePaths = new Set(),
  selectedPath,
  emptyStateTitle = 'No Folders',
  emptyStateDescription,
  emptyStateIcon,
  areHiddenFilesVisible = false,
  renamedPath,
  createdFolderPath,
  rootItemLabel,
  rootItemPath,
  onItemClick,
  getContextMenuItems,
  onRenameSave,
  onRenameCancel,
  onRenameValidate,
  onExpandedPathsChange,
  onCreateFolderSave,
  onCreateFolderCancel,
  forbiddenSymbolsRegExp,
  forbiddenSymbolsTooltip,
  newFolderDefaultName,
  ariaLabel = 'Folders',
  autoFocus = false,
  onEscape,
}) => {
  const { expandedPaths, togglePath } = useExpandedPaths({
    expandedPaths: externalExpandedPaths ?? new Set(),
    onExpandedPathsChange,
  });

  const isNodeVisible = (node: DialFile) =>
    (areHiddenFilesVisible || !isHiddenDotFile(node)) &&
    (showFiles || node.nodeType === DialFileNodeType.FOLDER);

  const rows = useMemo(
    () => collectVisibleRows(items, expandedPaths, isNodeVisible),
    // isNodeVisible only reads the two flags listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, expandedPaths, areHiddenFilesVisible, showFiles],
  );
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [focusedPath, setFocusedPath] = useState<string>();

  const hasRow = (path: string | undefined) =>
    path != null && rows.some((row) => row.node.path === path);
  /* The one row reachable with Tab: the last focused, else the selected, else the first. */
  const tabbablePath = hasRow(focusedPath)
    ? focusedPath
    : hasRow(selectedPath)
      ? selectedPath
      : rows[0]?.node.path;

  useEffect(() => {
    if (autoFocus && tabbablePath != null) {
      rowRefs.current.get(tabbablePath)?.focus();
    }
    // Focus the initial row once, when the tree mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFolderClick = (node: DialFile) => {
    onItemClick?.(node);
    togglePath(node.path);
  };

  const moveFocusTo = (path: string | undefined) => {
    if (path == null) return;
    setFocusedPath(path);
    rowRefs.current.get(path)?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    /* Only row keystrokes navigate — a rename input or a row's menu button keeps its own keys. */
    const index = rows.findIndex(
      (row) => rowRefs.current.get(row.node.path) === event.target,
    );
    if (index === -1) return;
    const { node, parentPath } = rows[index];
    const isFolder = node.nodeType === DialFileNodeType.FOLDER;
    const isExpanded = expandedPaths.has(node.path);
    const isRtl = getComputedStyle(event.currentTarget).direction === 'rtl';
    const forwardKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backwardKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    switch (event.key) {
      case 'ArrowDown':
        moveFocusTo(rows[index + 1]?.node.path);
        break;
      case 'ArrowUp':
        moveFocusTo(rows[index - 1]?.node.path);
        break;
      case 'Home':
        moveFocusTo(rows[0]?.node.path);
        break;
      case 'End':
        moveFocusTo(rows[rows.length - 1]?.node.path);
        break;
      case forwardKey:
        if (isFolder && !isExpanded) {
          togglePath(node.path);
        } else if (isFolder && rows[index + 1]?.parentPath === node.path) {
          moveFocusTo(rows[index + 1].node.path);
        }
        break;
      case backwardKey:
        if (isFolder && isExpanded) {
          togglePath(node.path);
        } else {
          moveFocusTo(parentPath);
        }
        break;
      case 'Enter':
      case ' ':
        if (isFolder) {
          handleFolderClick(node);
        } else {
          onItemClick?.(node);
        }
        break;
      case 'Escape':
        if (!onEscape) return;
        onEscape();
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const renderTree = (
    nodes: DialFile[],
    level: number,
    parentNode?: DialFile,
  ) => {
    let newNodes = nodes;
    if (parentNode && parentNode.path === createdFolderPath) {
      newNodes = [
        {
          folderId: NEW_FOLDER_TEMP_NAME,
          id: NEW_FOLDER_TEMP_NAME,
          items: [],
          name: newFolderDefaultName || '',
          nodeType: DialFileNodeType.FOLDER,
          parentPath: createdFolderPath,
          path: `${createdFolderPath}/${NEW_FOLDER_TEMP_NAME}`,
        },
        ...nodes,
      ];
    }
    const visibleNodes = newNodes.filter(isNodeVisible);
    return visibleNodes.map((node, index) => {
      const { path, nodeType, name, items } = node;

      const isFolder = nodeType === DialFileNodeType.FOLDER;

      const hasValidItems =
        Array.isArray(items) &&
        items.length > 0 &&
        items.some((n) => n.nodeType === DialFileNodeType.FOLDER || showFiles);

      const isExpanded = expandedPaths.has(path);
      const isSelected = selectedPath === path;
      const isLoading = loadingPaths.has(path);
      const isRenaming =
        renamedPath === path ||
        path === `${createdFolderPath}/${NEW_FOLDER_TEMP_NAME}`;
      const isLoaded = loadedPaths.has(path);
      const isSharedByMe = sharedByMePaths.has(path);
      const isRootFolder =
        rootItemPath && rootItemLabel && path === rootItemPath && isFolder;

      const validateHandler =
        onRenameValidate && ((value: string) => onRenameValidate(value, node));

      const selectedClass = isSelected ? 'bg-control-accent-alpha' : '';

      const menuItems = isRootFolder ? [] : (getContextMenuItems?.(node) ?? []);
      const tooltipContent = forbiddenSymbolsRegExp
        ? getForbiddenSymbolsTooltip(
            { name: node.name, isFolder },
            forbiddenSymbolsRegExp,
            forbiddenSymbolsTooltip,
          )
        : undefined;

      return (
        <div key={`${path}-children`} className="cursor-pointer">
          <div className="flex flex-col w-full gap-1">
            <Dropdown
              trigger={
                menuItems.length > 0 ? [DropdownTrigger.ContextMenu] : []
              }
              className="w-full h-[32px]"
              anchorToMouse
              items={menuItems}
            >
              <div
                ref={(element) => {
                  if (element) rowRefs.current.set(path, element);
                  else rowRefs.current.delete(path);
                }}
                role="treeitem"
                aria-label={isRootFolder ? rootItemLabel : name}
                aria-level={level + 1}
                aria-posinset={index + 1}
                aria-setsize={visibleNodes.length}
                aria-expanded={isFolder ? isExpanded : undefined}
                aria-selected={isSelected}
                tabIndex={path === tabbablePath ? 0 : -1}
                onFocus={(event) => {
                  if (event.target === event.currentTarget)
                    setFocusedPath(path);
                }}
                style={{ paddingLeft: `${level * FOLDER_LEVEL_PADDING}px` }}
                className={mergeClasses(
                  'py-1 pr-3 gap-2 dial-small-paragraph-text flex justify-between hover:bg-control-accent-alpha-hover rounded-full group/item w-full relative',
                  'outline-none focus-visible:outline focus-visible:outline-focus focus-visible:-outline-offset-1',
                  selectedClass,
                )}
              >
                {!isRenaming && (
                  <div
                    className="absolute size-full left-0 top-0 z-0"
                    onClick={() => handleFolderClick(node)}
                  />
                )}
                <div
                  className="relative flex flex-row truncate items-center w-fit h-6 gap-x-1 pl-1"
                  onClick={() => !isRenaming && handleFolderClick(node)}
                >
                  <>
                    {isFolder && (
                      <IconCaretRightFilled
                        {...CARET_ICON_PROPS}
                        className={mergeClasses(
                          'flex-shrink-0 text-secondary',
                          isExpanded && 'rotate-90 transition-all',
                          isLoaded && !hasValidItems && 'text-transparent',
                        )}
                      />
                    )}
                    <DialFileManagerItemName
                      elementId={`${path}-tree-item`}
                      name={isRootFolder ? rootItemLabel : name}
                      type={isFolder ? DialItemType.Folder : DialItemType.File}
                      loading={isLoading}
                      shared={isSharedByMe}
                      sharedIndicatorClassName={mergeClasses(
                        'group-hover/item:bg-control-accent-alpha-hover',
                        isSelected && 'bg-control-accent-alpha',
                      )}
                      iconSize={BASE_FILE_MANAGER_ICON_SIZE}
                      forbiddenSymbolsRegExp={forbiddenSymbolsRegExp}
                      forbiddenSymbolsTooltip={tooltipContent}
                      {...(!isRootFolder && {
                        editing: isRenaming,
                        creating:
                          path ===
                          `${createdFolderPath}/${NEW_FOLDER_TEMP_NAME}`,
                        onSave: onRenameSave,
                        onCancel: onRenameCancel,
                        validate: validateHandler,
                        onCreateFolderSave: onCreateFolderSave,
                        onCreateFolderCancel: onCreateFolderCancel,
                      })}
                    />
                  </>
                </div>

                {menuItems.length > 0 && !isRenaming && !isRootFolder && (
                  <div className="flex-1 flex justify-end">
                    <Dropdown
                      placement="bottom-start"
                      allowedPlacements={['top-start', 'top-end']}
                      items={menuItems}
                      className="sticky right-0"
                    >
                      <GhostIconButton
                        size={ElementSize.Small}
                        className="invisible group-hover/item:visible"
                        icon={<IconDotsVertical {...FILE_MANAGER_ICON_PROPS} />}
                      />
                    </Dropdown>
                  </div>
                )}
              </div>
            </Dropdown>

            {isExpanded &&
              (items || node?.path === createdFolderPath) &&
              renderTree(items || [], level + 1, node)}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="flex-1 size-full overflow-y-auto pb-6">
      {items.length > 0 ? (
        // Focus lives on the roving-tabIndex rows; the root only routes their keys.
        <div role="tree" aria-label={ariaLabel} onKeyDown={handleKeyDown}>
          {renderTree(items, 0)}
        </div>
      ) : (
        <NoDataContent
          title={emptyStateTitle}
          description={emptyStateDescription}
          icon={emptyStateIcon}
        />
      )}
    </div>
  );
};
