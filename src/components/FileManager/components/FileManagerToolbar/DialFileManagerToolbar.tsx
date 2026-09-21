import { useIsMobileScreen } from '@/hooks/use-is-mobile-screen';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import {
  ButtonDropdown,
  ButtonVariant,
  DIAL_ICON_SIZE,
  Dropdown,
  ElementSize,
  GhostIconButton,
  Switch,
  Tooltip,
} from '@epam/ai-dial-ui-kit';
import {
  FILE_MANAGER_ICON_PROPS,
  FILE_MANAGER_ICON_STROKE,
} from '@/constants/icon';
import { IconDotsVertical, IconEye, IconEyeOff } from '@tabler/icons-react';
import { type FC, useMemo } from 'react';

export interface DialFileManagerToolbarProps {
  areHiddenFilesVisible: boolean;
  showHiddenFilesLabel?: string;
  hideHiddenFilesLabel?: string;
  isNewButtonVisible?: boolean;
  isNewButtonDisabled?: boolean;
  newButtonVariant?: ButtonVariant;
  newButtonDropdownItems?: DropdownItem[];
  newButtonLabel?: string;
  showHiddenFilesToggle?: boolean;
  onToggleHiddenFiles?: (value: boolean) => void;
  disabledNewButtonTooltip?: string;
}

/**
 * DialFileManagerToolbar — A configurable, responsive toolbar component for file management views.
 *
 * Renders the action cluster that sits at the trailing edge of the File Manager
 * content header, next to the breadcrumb trail:
 * - A toggle for showing or hiding hidden files
 * - An optional "Add" button or dropdown for creating new files or folders
 *
 * Tab navigation is no longer part of this toolbar — it lives in the folders
 * panel, next to the tree it filters.
 *
 * @example
 * ```tsx
 * <DialFileManagerToolbar
 *   areHiddenFilesVisible={false}
 *   onToggleHiddenFiles={(visible) => console.log('Hidden files visible:', visible)}
 *   isNewButtonVisible
 *   newButtonDropdownItems={[
 *     { key: 'folder', label: 'New Folder' },
 *     { key: 'file', label: 'Upload File' },
 *   ]}
 * />
 * ```
 *
 * @param areHiddenFilesVisible - Whether hidden files are currently visible.
 * @param [showHiddenFilesLabel='Show hidden files'] - Label of the toggle while hidden files are not visible.
 * @param [hideHiddenFilesLabel='Hide hidden files'] - Label of the toggle while hidden files are visible.
 * @param [onToggleHiddenFiles] - Callback fired when the hidden files visibility is toggled. Receives the new visibility state.
 * @param [isNewButtonVisible] - Whether the "New" button or dropdown should be displayed.
 * @param [isNewButtonDisabled] - Whether the "New" button is disabled.
 * @param [newButtonVariant=ButtonVariant.Primary] - Visual style variant for the new button.
 * @param [newButtonDropdownItems=[]] - Dropdown items available under the new button. If empty, a single new button is shown instead.
 * @param [newButtonLabel='New'] - Label text for the new button.
 * @param [disabledNewButtonTooltip] - Tooltip text to show when the new button is disabled.
 *
 * @remarks
 * - The hidden files toggle uses `Switch`.
 * - The new actions use `GhostIconButton` or dropdown variants for consistency.
 * - The toolbar automatically adapts its layout for different screen sizes.
 * - When `newButtonDropdownItems` is provided, the new button becomes a dropdown menu.
 */
export const DialFileManagerToolbar: FC<DialFileManagerToolbarProps> = ({
  areHiddenFilesVisible,
  onToggleHiddenFiles,
  isNewButtonVisible,
  isNewButtonDisabled,
  newButtonVariant = ButtonVariant.Primary,
  newButtonDropdownItems = [],
  newButtonLabel = 'Add',
  showHiddenFilesLabel = 'Show hidden files',
  hideHiddenFilesLabel = 'Hide hidden files',
  showHiddenFilesToggle = true,
  disabledNewButtonTooltip,
}) => {
  const isMobile = useIsMobileScreen();

  const dropdownItems = useMemo(() => {
    const items: DropdownItem[] = [
      {
        key: 'hidden-files-switch',
        label: areHiddenFilesVisible
          ? hideHiddenFilesLabel
          : showHiddenFilesLabel,
        icon: areHiddenFilesVisible ? (
          <IconEyeOff {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
        ) : (
          <IconEye {...FILE_MANAGER_ICON_PROPS} className="text-secondary" />
        ),
        onClick: () => onToggleHiddenFiles?.(!areHiddenFilesVisible),
      },
    ];

    return items;
  }, [
    areHiddenFilesVisible,
    hideHiddenFilesLabel,
    showHiddenFilesLabel,
    onToggleHiddenFiles,
  ]);

  const renderDesktopActions = () => (
    <>
      {showHiddenFilesToggle && (
        <Switch
          id="hidden-files-switch"
          labelProps={{
            label: !areHiddenFilesVisible
              ? showHiddenFilesLabel
              : hideHiddenFilesLabel,
          }}
          isOn={areHiddenFilesVisible}
          onChange={onToggleHiddenFiles}
        />
      )}

      {isNewButtonVisible && (
        <Tooltip
          tooltip={
            isNewButtonDisabled && disabledNewButtonTooltip
              ? disabledNewButtonTooltip
              : undefined
          }
        >
          <ButtonDropdown
            label={newButtonLabel}
            variant={newButtonVariant}
            items={newButtonDropdownItems}
            disabled={isNewButtonDisabled}
          />
        </Tooltip>
      )}
    </>
  );

  const renderMobileActions = () => (
    <>
      <Dropdown
        items={dropdownItems}
        allowedPlacements={['bottom', 'bottom-start']}
      >
        <GhostIconButton
          size={ElementSize.Small}
          icon={
            <IconDotsVertical
              stroke={FILE_MANAGER_ICON_STROKE}
              size={DIAL_ICON_SIZE.SM}
            />
          }
        />
      </Dropdown>

      {isNewButtonVisible ? (
        <Tooltip
          tooltip={
            isNewButtonDisabled && disabledNewButtonTooltip
              ? disabledNewButtonTooltip
              : undefined
          }
        >
          <ButtonDropdown
            label={newButtonLabel}
            variant={newButtonVariant}
            items={newButtonDropdownItems}
            disabled={isNewButtonDisabled}
          />
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <div className="flex gap-4 shrink-0 items-center">
      {isMobile ? renderMobileActions() : renderDesktopActions()}
    </div>
  );
};
