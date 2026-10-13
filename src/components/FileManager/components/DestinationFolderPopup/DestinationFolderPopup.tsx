import {
  DialFileManager,
  type DialFileManagerProps,
} from '@/components/FileManager/FileManager';
import { useIsMobileScreen } from '@/hooks/use-is-mobile-screen';
import type { DialFileManagerActionsRef } from '@/models/file-manager';
import { DestinationFolderMode } from '@/types/file-manager';
import {
  ButtonAppearance,
  Dropdown,
  type DropdownItem,
  ElementSize,
  GhostIconButton,
  mergeClasses,
  NeutralButton,
  Notification,
  Popup,
  PopupSize,
  PrimaryButton,
  Switch,
  Tooltip,
} from '@epam/ai-dial-ui-kit';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import { IconDotsVertical, IconEye, IconFolderPlus } from '@tabler/icons-react';
import {
  type ComponentProps,
  type FC,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import { excludePathsFromTree } from '@/components/FileManager/utils';
import type { DialFile } from '@/models/file';
import CopyToIcon from '@/assets/icons/copy-to.svg?react';
import MoveToIcon from '@/assets/icons/move-to.svg?react';
import { DestinationFolderSheet } from './DestinationFolderSheet';

export interface DestinationFolderPopupProps extends DialFileManagerProps {
  onClose: () => void;
  onConfirm?: () => void;
  open: boolean;
  setDestinationFolderPath?: (path?: string) => void;
  destinationFolderPath?: string;
  copyLabel?: string;
  moveLabel?: string;
  addFolderLabel?: string;
  showHiddenFileSwitcher?: boolean;
  showCreateFolderButton?: boolean;
  hiddenFilesSwitcherLabel?: string;
  mode?: 'copy' | 'move';
  header?: ReactNode;
  sourceFolder?: string;
  disabledPathTooltip?: string;
  collapsedFileTree?: boolean;
  alertProps?: ComponentProps<typeof Notification>;
  onFolderPopupPathChange?: (newPath?: string) => void;
  processDestinationFolderPath?: (path: string) => string;
  excludedPaths?: string[];
  sourceItems?: DialFile[];
  getSourceItemsLabel?: (count: number) => string;
  destinationLabel?: string;
  searchFoldersPlaceholder?: string;
}

/**
 * DestinationFolderPopup
 * aliases: FolderSelector|PathChooser
 *
 * A popup dialog for selecting a destination folder when copying or moving files.
 * Displays a File Manager interface with a footer containing action buttons and
 * a toggle for showing hidden files.
 *
 * @example
 * ```tsx
 * <DestinationFolderPopup
 *   open={isOpen}
 *   onClose={handleClose}
 *   onConfirm={handleConfirm}
 *   mode="copy"
 *   title="Copy 3 files"
 *   items={files}
 *   rootItem={rootFolder}
 *   path={currentPath}
 *   onPathChange={setCurrentPath}
 * />
 * ```
 *
 * @param open - Whether the popup is visible
 * @param onClose - Callback fired when the popup is closed
 * @param [onConfirm] - Callback fired when the confirm button is clicked
 * @param [mode=DestinationFolderMode.Copy] - Operation mode: 'copy' or 'move'
 * @param [copyLabel="Copy"] - Label for the copy button
 * @param [moveLabel="Move"] - Label for the move button
 * @param [addFolderLabel="Add folder"] - Label for the add folder button
 * @param [hiddenFilesSwitcherLabel="Show hidden files"] - Label for the hidden files toggle
 * @param [title] - Custom title for the popup header
 * @param items - Array of files to display in the File Manager
 * @param rootItem - Root folder item
 * @param path - Current path in the File Manager
 * @param onPathChange - Callback fired when the path changes
 * @param [sourceFolder] - The source folder path for move operations
 * @param [disabledPathTooltip="Unavailable for the original path. Please select another folder"] - Tooltip text when destination is disabled
 * @param [collapsedFileTree=false] - Whether the file tree should be initially collapsed
 * @param [processDestinationFolderPath] - Optional function to process the destination folder path before setting it
 * @param [excludedPaths] - Paths to hide from this popup's tree and grid (e.g. a root folder that shouldn't be a valid destination). Matching items and their subtree are excluded.
 * @param [sourceItems=[]] - Items being copied or moved; the phone sheet shows them above the tree
 * @param [getSourceItemsLabel] - Text naming several source items in the phone sheet; defaults to "N items"
 * @param [destinationLabel] - Heading above the tree in the phone sheet; defaults to "Copy to folder" or "Move to folder"
 * @param [searchFoldersPlaceholder="Search folders"] - Placeholder of the phone sheet's folder search, which filters the loaded folders by name
 *
 * @remarks
 * Below 640px the picker is a bottom sheet with a folders-only tree and no
 * Add folder or hidden-files controls, so `showCreateFolderButton` and
 * `showHiddenFileSwitcher` only apply to the popup.
 *
 * @returns A React component for the destination folder selection popup
 */
export const DialDestinationFolderPopup: FC<DestinationFolderPopupProps> = ({
  onClose,
  onConfirm,
  onFolderPopupPathChange,
  setDestinationFolderPath,
  open,
  copyLabel = 'Copy',
  moveLabel = 'Move',
  addFolderLabel = 'Add folder',
  mode = DestinationFolderMode.Copy,
  hiddenFilesSwitcherLabel = 'Show hidden files',
  showHiddenFileSwitcher = true,
  showCreateFolderButton = true,
  onUploadFiles,
  onValidateUpload,
  maxFileSize,
  header,
  sourceFolder,
  disabledPathTooltip = 'Unavailable for the original path. Please select another folder',
  path,
  collapsedFileTree = false,
  alertProps,
  processDestinationFolderPath,
  excludedPaths,
  items,
  sourceItems = [],
  getSourceItemsLabel = (count) => `${count} items`,
  destinationLabel,
  searchFoldersPlaceholder = 'Search folders',
  ...restProps
}: DestinationFolderPopupProps) => {
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileManagerActionRef = useRef<DialFileManagerActionsRef>(null);
  const isMobile = useIsMobileScreen();

  const visibleItems = useMemo(
    () => excludePathsFromTree(items, excludedPaths),
    [items, excludedPaths],
  );

  const handleShowHiddenFilesChange = useCallback((value: boolean) => {
    setShowHiddenFiles(value);
  }, []);

  const mobileFooterDropdownItems = useMemo<DropdownItem[]>(() => {
    const footerDropdownItems = [];

    if (showCreateFolderButton) {
      footerDropdownItems.push({
        key: 'add-folder',
        label: addFolderLabel,
        icon: (
          <IconFolderPlus
            {...FILE_MANAGER_ICON_PROPS}
            className="text-secondary"
          />
        ),
        onClick: () => {
          fileManagerActionRef.current?.createFolder();
          setMobileMenuOpen(false);
        },
      });
    }

    if (showHiddenFileSwitcher) {
      footerDropdownItems.push({
        key: 'show-hidden-files',
        label: hiddenFilesSwitcherLabel,
        icon: (
          <IconEye {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
        ),
        onClick: () => {
          setShowHiddenFiles((prev) => !prev);
          setMobileMenuOpen(false);
        },
      });
    }

    return footerDropdownItems;
  }, [
    addFolderLabel,
    hiddenFilesSwitcherLabel,
    showHiddenFileSwitcher,
    showCreateFolderButton,
  ]);

  const handleOnPathChange = useCallback(
    (nextPath?: string) => {
      if (nextPath) {
        let path = processDestinationFolderPath
          ? processDestinationFolderPath(nextPath)
          : nextPath;
        onFolderPopupPathChange?.(path);
        setDestinationFolderPath?.(path);
      }
    },
    [
      onFolderPopupPathChange,
      setDestinationFolderPath,
      processDestinationFolderPath,
    ],
  );

  const defaultTitle =
    mode === DestinationFolderMode.Copy ? 'Copy to' : 'Move to';

  const isDestinationDisabled = useMemo(() => {
    if (!path || !sourceFolder) {
      return false;
    }

    return sourceFolder === path;
  }, [path, sourceFolder]);

  const confirmLabel = mode === 'copy' ? copyLabel : moveLabel;

  if (isMobile) {
    const ConfirmIcon =
      mode === DestinationFolderMode.Copy ? CopyToIcon : MoveToIcon;

    return (
      <DestinationFolderSheet
        open={open}
        title={typeof header === 'string' ? header : defaultTitle}
        items={visibleItems}
        sourceItems={sourceItems}
        sourceItemsLabel={getSourceItemsLabel(sourceItems.length)}
        destinationLabel={
          destinationLabel ??
          (mode === DestinationFolderMode.Copy
            ? 'Copy to folder'
            : 'Move to folder')
        }
        confirmLabel={confirmLabel}
        confirmIcon={
          <ConfirmIcon
            width={FILE_MANAGER_ICON_PROPS.size}
            height={FILE_MANAGER_ICON_PROPS.size}
          />
        }
        isConfirmDisabled={isDestinationDisabled}
        disabledConfirmTooltip={disabledPathTooltip}
        selectedPath={path}
        loadedPaths={restProps.treeOptions?.loadedPaths}
        loadingPaths={restProps.treeOptions?.loadingPaths}
        emptyStateTitle={restProps.emptyStateTitle}
        emptyStateDescription={restProps.emptyStateDescription}
        searchPlaceholder={searchFoldersPlaceholder}
        searchEmptyStateTitle={restProps.searchEmptyStateTitle ?? 'No data'}
        alertProps={alertProps}
        onSelectFolder={handleOnPathChange}
        onConfirm={onConfirm}
        onClose={onClose}
      />
    );
  }

  return (
    <Popup
      open={open}
      onClose={() => {
        onClose();
      }}
      size={PopupSize.Lg}
      className="md:!h-[800px] !bg-layer-sunken"
      footer={
        <div className="flex justify-between items-center gap-2 p-4 md:px-6">
          <div className="flex items-center gap-4 min-w-0">
            {isMobile ? (
              <Dropdown
                items={mobileFooterDropdownItems}
                open={mobileMenuOpen}
                onOpenChange={setMobileMenuOpen}
              >
                <GhostIconButton
                  size={ElementSize.Large}
                  aria-label="More options"
                  icon={<IconDotsVertical {...FILE_MANAGER_ICON_PROPS} />}
                />
              </Dropdown>
            ) : (
              <>
                {showCreateFolderButton && (
                  <PrimaryButton
                    label={addFolderLabel}
                    appearance={ButtonAppearance.Ghost}
                    iconBefore={<IconFolderPlus {...FILE_MANAGER_ICON_PROPS} />}
                    onClick={() => {
                      fileManagerActionRef.current?.createFolder();
                    }}
                  />
                )}
                {showCreateFolderButton && showHiddenFileSwitcher && (
                  <div className="w-px h-[26px] bg-control-disable-primary my-2" />
                )}
                {showHiddenFileSwitcher && (
                  <>
                    <div className="inline-flex items-center cursor-pointer">
                      <Switch
                        labelProps={{ label: hiddenFilesSwitcherLabel }}
                        isOn={showHiddenFiles}
                        onChange={handleShowHiddenFilesChange}
                        id="hidden-files-switch-modal"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex space-x-4 items-center">
            <NeutralButton onClick={onClose} label="Cancel" />
            {isDestinationDisabled ? (
              <Tooltip tooltip={disabledPathTooltip}>
                <PrimaryButton
                  onClick={onConfirm}
                  label={confirmLabel}
                  disabled={isDestinationDisabled}
                  aria-disabled={isDestinationDisabled}
                />
              </Tooltip>
            ) : (
              <PrimaryButton onClick={onConfirm} label={confirmLabel} />
            )}
          </div>
        </div>
      }
      header={header ?? defaultTitle}
      ariaLabel={defaultTitle}
    >
      <div className="bg-layer-sunken h-full flex flex-col">
        {alertProps && (
          <div className="px-6 mb-4 pt-4">
            <Notification {...alertProps} />
          </div>
        )}
        <div className="flex-1 min-h-0">
          <DialFileManager
            {...restProps}
            items={visibleItems}
            gridClassName="size-full gap-6 px-6 py-4"
            contentClassName="px-0 pb-0"
            className={mergeClasses(
              restProps.className,
              'bg-layer-sunken h-full flex pt-0',
            )}
            actionsRef={fileManagerActionRef}
            path={path}
            showHiddenFiles={showHiddenFiles}
            onShowHiddenFilesChange={handleShowHiddenFilesChange}
            treeOptions={{
              ...restProps.treeOptions,
              collapsed: collapsedFileTree,
              expandedPaths: new Set<string>([restProps.rootItem?.path || '/']),
              header: null,
              containerClassName:
                restProps.treeOptions?.containerClassName ??
                'min-h-0 w-[360px] shrink-0 h-full rounded-xl bg-layer-raised shadow-sm pt-4',
            }}
            gridOptions={{ ...restProps.gridOptions, selectionMode: undefined }}
            navigationPanelOptions={{
              elementId: 'file-manager-destination-search',
              ...restProps.navigationPanelOptions,
            }}
            onUploadFiles={onUploadFiles}
            onValidateUpload={onValidateUpload}
            onPathChange={handleOnPathChange}
            maxFileSize={maxFileSize}
          />
        </div>
      </div>
    </Popup>
  );
};
