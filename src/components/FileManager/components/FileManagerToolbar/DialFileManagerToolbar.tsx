import { useIsMobileScreen } from '@/hooks/use-is-mobile-screen';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import {
  ButtonDropdown,
  ButtonVariant,
  DIAL_ICON_SIZE,
  Dropdown,
  ElementSize,
  GhostIconButton,
  IconButton,
  mergeClasses,
  Switch,
  Tooltip,
} from '@epam/ai-dial-ui-kit';
import {
  FILE_MANAGER_ICON_PROPS,
  FILE_MANAGER_ICON_STROKE,
} from '@/constants/icon';
import { IconDots, IconEye, IconEyeOff, IconPlus } from '@tabler/icons-react';
import { type FC, type ReactNode, useMemo } from 'react';

// The Add menu keeps the design's own width rather than shrinking to a short button label.
const NEW_BUTTON_DROPDOWN_PROPS = {
  listClassName: 'min-w-[108px]',
  matchReferenceWidth: false,
};

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
  isCompactView?: boolean;
  additionalButtons?: ReactNode;
  moreActionsLabel?: string;
  onMenuItemClick?: () => void;
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
 * @param [isCompactView] - Whether to render the compact layout; overrides the viewport check when set.
 * @param [additionalButtons] - Controls rendered before the new button.
 * @param [moreActionsLabel='More actions'] - Accessible name of the compact "more" menu trigger.
 * @param [onMenuItemClick] - Callback fired when an item is picked from a menu of the compact layout.
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
  isCompactView,
  additionalButtons,
  moreActionsLabel = 'More actions',
  onMenuItemClick,
}) => {
  const isMobileScreen = useIsMobileScreen();
  const isMobile = isCompactView ?? isMobileScreen;

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

      {additionalButtons}

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
            dropdownProps={NEW_BUTTON_DROPDOWN_PROPS}
            disabled={isNewButtonDisabled}
          />
        </Tooltip>
      )}
    </>
  );

  const renderMobileActions = () => (
    <>
      {showHiddenFilesToggle && (
        <Dropdown
          items={dropdownItems}
          onItemClick={onMenuItemClick}
          className="group/more-actions"
        >
          <GhostIconButton
            size={ElementSize.Standard}
            aria-label={moreActionsLabel}
            className="group-aria-expanded/more-actions:bg-control-neutral-active"
            icon={
              <IconDots
                stroke={FILE_MANAGER_ICON_STROKE}
                size={DIAL_ICON_SIZE.LG}
              />
            }
          />
        </Dropdown>
      )}

      {additionalButtons}

      {isNewButtonVisible ? (
        <Tooltip
          tooltip={
            isNewButtonDisabled && disabledNewButtonTooltip
              ? disabledNewButtonTooltip
              : undefined
          }
        >
          <Dropdown
            items={newButtonDropdownItems}
            {...NEW_BUTTON_DROPDOWN_PROPS}
            onItemClick={onMenuItemClick}
          >
            <IconButton
              variant={newButtonVariant}
              size={ElementSize.Standard}
              aria-label={newButtonLabel}
              disabled={isNewButtonDisabled}
              icon={
                <IconPlus
                  stroke={FILE_MANAGER_ICON_STROKE}
                  size={DIAL_ICON_SIZE.LG}
                />
              }
            />
          </Dropdown>
        </Tooltip>
      ) : null}
    </>
  );

  return (
    <div
      className={mergeClasses('flex gap-4 shrink-0 items-center', {
        'gap-3': isMobile,
      })}
    >
      {isMobile ? renderMobileActions() : renderDesktopActions()}
    </div>
  );
};
