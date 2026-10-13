import { DialFileManagerSearchBar } from '@/components/FileManager/components/FileManagerSearchBar/FileManagerSearchBar';
import { DialFoldersTree } from '@/components/FileManager/components/FoldersTree/FoldersTree';
import { BASE_FILE_MANAGER_ICON_SIZE } from '@/components/FileManager/constants';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import { type DialFile, DialFileNodeType } from '@/models/file';
import {
  BottomSheet,
  FileName,
  FolderName,
  NeutralButton,
  Notification,
  PrimaryButton,
  Tooltip,
} from '@epam/ai-dial-ui-kit';
import { IconFiles } from '@tabler/icons-react';
import {
  getAncestorPaths,
  searchFoldersByName,
} from '@/components/FileManager/utils';
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useMemo,
  useState,
} from 'react';
import {
  destinationSheetBodyClassName,
  destinationSheetClassName,
  destinationSheetFooterClassName,
  destinationSheetHeadingClassName,
  destinationSheetScrollAreaClassName,
  destinationSheetSectionClassName,
  destinationSheetSourceClassName,
} from './constants';

export interface DestinationFolderSheetProps {
  open: boolean;
  title: string;
  items: DialFile[];
  sourceItems: DialFile[];
  sourceItemsLabel: string;
  destinationLabel: string;
  confirmLabel: string;
  confirmIcon: ReactNode;
  isConfirmDisabled: boolean;
  disabledConfirmTooltip: string;
  selectedPath?: string;
  rootItemPath?: string;
  rootItemLabel?: string;
  loadedPaths?: Set<string>;
  loadingPaths?: Set<string>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  searchPlaceholder: string;
  searchEmptyStateTitle: string;
  alertProps?: ComponentProps<typeof Notification>;
  onSelectFolder: (path: string) => void;
  onConfirm?: () => void;
  onClose: () => void;
}

type DestinationFolderSheetContentProps = Omit<
  DestinationFolderSheetProps,
  'open' | 'title'
>;

/*
 * Rendered inside the sheet, which unmounts it on close, so the search and the
 * expanded folders start over every time the sheet opens.
 */
const DestinationFolderSheetContent: FC<DestinationFolderSheetContentProps> = ({
  items,
  sourceItems,
  sourceItemsLabel,
  destinationLabel,
  confirmLabel,
  confirmIcon,
  isConfirmDisabled,
  disabledConfirmTooltip,
  selectedPath,
  rootItemPath,
  rootItemLabel,
  loadedPaths,
  loadingPaths,
  emptyStateTitle,
  emptyStateDescription,
  searchPlaceholder,
  searchEmptyStateTitle,
  alertProps,
  onSelectFolder,
  onConfirm,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [browseExpandedPaths, setBrowseExpandedPaths] = useState(
    () =>
      new Set([
        ...items.map(({ path }) => path),
        ...(selectedPath ? getAncestorPaths(selectedPath) : []),
      ]),
  );
  const [searchExpandedPaths, setSearchExpandedPaths] = useState<Set<string>>();

  const searchResult = useMemo(
    () => (query.trim() ? searchFoldersByName(items, query) : undefined),
    [items, query],
  );

  const handleSearchChange = (value: string) => {
    setQuery(value);
    setSearchExpandedPaths(undefined);
  };

  const renderSource = () => {
    if (sourceItems.length !== 1) {
      return (
        <span className="flex min-w-0 items-center gap-2 text-primary">
          <IconFiles
            {...FILE_MANAGER_ICON_PROPS}
            className="shrink-0 text-secondary"
            aria-hidden="true"
          />
          <span className="truncate">{sourceItemsLabel}</span>
        </span>
      );
    }

    const [item] = sourceItems;

    return item.nodeType === DialFileNodeType.FOLDER ? (
      <FolderName name={item.name} iconSize={BASE_FILE_MANAGER_ICON_SIZE} />
    ) : (
      <FileName name={item.name} iconSize={BASE_FILE_MANAGER_ICON_SIZE} />
    );
  };

  const confirmButton = (
    <PrimaryButton
      className="w-full"
      label={confirmLabel}
      iconBefore={confirmIcon}
      disabled={isConfirmDisabled}
      aria-disabled={isConfirmDisabled}
      onClick={onConfirm}
    />
  );

  return (
    <>
      <div className={destinationSheetBodyClassName}>
        {alertProps && <Notification {...alertProps} />}

        {sourceItems.length > 0 && (
          <div className={destinationSheetSourceClassName}>
            {renderSource()}
          </div>
        )}

        <section className={destinationSheetSectionClassName}>
          <h3 className={destinationSheetHeadingClassName}>
            {destinationLabel}
          </h3>

          <DialFileManagerSearchBar
            elementId="file-manager-destination-folder-search"
            value={query}
            placeholder={searchPlaceholder}
            onSearchChange={handleSearchChange}
          />

          <DialFoldersTree
            items={searchResult?.items ?? items}
            expandedPaths={
              searchResult
                ? (searchExpandedPaths ?? searchResult.expandedPaths)
                : browseExpandedPaths
            }
            onExpandedPathsChange={
              searchResult ? setSearchExpandedPaths : setBrowseExpandedPaths
            }
            selectedPath={selectedPath}
            rootItemPath={rootItemPath}
            rootItemLabel={rootItemLabel}
            loadedPaths={loadedPaths}
            loadingPaths={loadingPaths}
            emptyStateTitle={
              searchResult ? searchEmptyStateTitle : emptyStateTitle
            }
            emptyStateDescription={
              searchResult ? undefined : emptyStateDescription
            }
            ariaLabel={destinationLabel}
            showContextMenuButton={false}
            onItemClick={(item) => onSelectFolder(item.path)}
          />
        </section>
      </div>

      <div className={destinationSheetFooterClassName}>
        <div className="flex-1">
          {isConfirmDisabled ? (
            <Tooltip tooltip={disabledConfirmTooltip}>{confirmButton}</Tooltip>
          ) : (
            confirmButton
          )}
        </div>
        <NeutralButton className="flex-1" label="Cancel" onClick={onClose} />
      </div>
    </>
  );
};

/**
 * The phone layout of the Copy/Move destination picker: a bottom sheet with
 * the items being copied or moved, a folders-only tree and full-width
 * a folder search and full-width confirm and cancel buttons.
 * @param open - Whether the sheet is shown
 * @param title - Title of the sheet header
 * @param items - Tree items to pick the destination from; the top-level folders open expanded
 * @param sourceItems - Items being copied or moved
 * @param sourceItemsLabel - Text naming several source items, e.g. "3 items"
 * @param destinationLabel - Heading above the tree
 * @param confirmLabel - Label of the confirm button
 * @param confirmIcon - Icon of the confirm button
 * @param isConfirmDisabled - Whether the picked folder can't be the destination
 * @param disabledConfirmTooltip - Tooltip of the disabled confirm button
 * @param [selectedPath] - Folder currently picked as the destination; the folders above it open expanded
 * @param [rootItemPath] - Path of the root folder shown with `rootItemLabel`
 * @param [rootItemLabel] - Label shown for the root folder instead of its name
 * @param [loadedPaths] - Folders whose children have loaded
 * @param [loadingPaths] - Folders whose children are loading
 * @param [emptyStateTitle] - Title shown when there are no folders
 * @param [emptyStateDescription] - Description shown when there are no folders
 * @param searchPlaceholder - Placeholder of the folder search
 * @param searchEmptyStateTitle - Title shown when no folder matches the search
 * @param [alertProps] - Notification shown above the source items
 * @param onSelectFolder - Called with the path of the picked folder
 * @param [onConfirm] - Called when the confirm button is pressed
 * @param onClose - Called when the sheet asks to close
 */
export const DestinationFolderSheet: FC<DestinationFolderSheetProps> = ({
  open,
  title,
  onClose,
  ...contentProps
}) => (
  <BottomSheet
    open={open}
    title={title}
    onClose={onClose}
    className={destinationSheetClassName}
    bodyClassName={destinationSheetScrollAreaClassName}
  >
    <DestinationFolderSheetContent {...contentProps} onClose={onClose} />
  </BottomSheet>
);
