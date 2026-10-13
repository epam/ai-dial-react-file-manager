import { useFlexibleActions } from '@/hooks/use-flexible-actions';
import { useIsMobileScreen } from '@/hooks/use-is-mobile-screen';
import {
  ButtonAppearance,
  DangerButton,
  DIAL_ICON_SIZE,
  Dropdown,
  ElementSize,
  FlexibleActionsDirection,
  GhostIconButton,
  PrimaryButton,
  type DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import { IconDotsVertical, IconX } from '@tabler/icons-react';
import type { FC, ReactNode } from 'react';
import {
  ACTIONS_GAP,
  COMPACT_ACTIONS_GAP,
  COMPACT_CONTAINER_PADDING,
  CONTAINER_PADDING,
  bulkActionsContainerClassName,
  bulkActionsCountClassName,
  bulkActionsGroupClassName,
  bulkActionsLabelClassName,
  bulkActionsStripClassName,
  compactBulkActionsContainerClassName,
  compactBulkActionsCountClassName,
  compactBulkActionsDividerClassName,
  compactBulkActionsGroupClassName,
} from './constants';

export interface DialActionDropdownItem extends DropdownItem {
  title: string;
  tooltip?: string;
}

export interface DialFileManagerBulkActionsToolbarProps {
  /**
   * The wording beside the count, e.g. `"items selected"`. The bar draws the
   * count itself as a badge, so this returns the sentence around it rather than
   * the whole label; the count is passed in for pluralisation.
   */
  getSelectionLabel: (selectedCount: number) => ReactNode;
  onClearSelection: () => void;
  actions: DialActionDropdownItem[];
  selectedCount: number;
  /** Accessible name of the control that drops the selection. */
  clearSelectionLabel?: string;
  /** Docks the bar to the bottom edge with icon-only actions; overrides the viewport check when set. */
  isCompactView?: boolean;
  /** Accessible name of the compact overflow menu trigger. */
  moreActionsLabel?: string;
}

/**
 * A responsive toolbar displayed when files or items are selected in the file
 * manager. It shows a label with the number or name of selected items, a
 * control that drops the selection, and the contextual action buttons.
 *
 * The bar floats over the bottom of the grid instead of replacing the content
 * header, so the breadcrumbs and the header actions stay reachable while a
 * selection is live. It is sized by its contents; the caller positions it.
 *
 * On smaller screens or when there’s not enough horizontal space,
 * some action buttons are automatically moved into a dropdown menu.
 *
 * **Key Features:**
 * - Dynamically measures available container width to determine how many actions
 *   can fit inline.
 * - Uses a hidden measurement container to precisely calculate button widths.
 * - Automatically moves overflow actions into a "More" dropdown (`IconDotsVertical`).
 * - Responsive design with support for mobile layout via `useIsMobileScreen`.
 *
 * **Layout logic:**
 * - `measureRef`: hidden element used to measure the width of each button.
 * - `containerRef`: visible container where the toolbar is rendered.
 * - `leftSectionRef`: left section containing the selection label and its clear control.
 * - `visibleCount`: dynamically updated number of visible actions.
 * - Uses `ResizeObserver` + `requestAnimationFrame` to update layout on resize.
 *
 * @example
 * ```tsx
 * <DialFileManagerSelectionToolbar
 *   getSelectionLabel={(count) => `file${count === 1 ? '' : 's'} selected`}
 *   onClearSelection={() => console.log('Cleared')}
 *   actions={[
 *     { key: 'download', title: 'Download', icon: <IconDownload {...FILE_MANAGER_ICON_PROPS} />, onClick: () => {} },
 *     { key: 'delete', title: 'Delete', icon: <IconTrash {...FILE_MANAGER_ICON_PROPS} />, onClick: () => {} },
 *   ]}
 * />
 * ```
 *
 * @param {object} props
 * @param {(count: number) => ReactNode} props.getSelectionLabel - The wording beside the count (e.g., "files selected"). The bar draws the count itself as a badge; the count is passed in so the caller can pluralise.
 * @param {() => void} props.onClearSelection - Callback invoked when the clear selection button is clicked.
 * @param {DialActionDropdownItem[]} props.actions - List of available toolbar actions.
 *   Each action defines a title, icon, key, and optional click handler.
 * @param {number} [props.selectedCount] - Count of currently selected items.
 * @param {string} [props.clearSelectionLabel='Clear selection'] - Accessible name of the control that drops the selection.
 * @param {boolean} [props.isCompactView] - Docks the bar full width with the count, the clear control and icon-only actions. The selection label is kept for screen readers only. Overrides the viewport check when set.
 * @param {string} [props.moreActionsLabel='More actions'] - Accessible name of the compact overflow menu trigger.
 *
 * @returns {JSX.Element} A responsive toolbar that adjusts visible actions based on available width.
 */
export const DialFileManagerBulkActionsToolbar: FC<
  DialFileManagerBulkActionsToolbarProps
> = ({
  getSelectionLabel,
  onClearSelection,
  actions,
  selectedCount,
  clearSelectionLabel = 'Clear selection',
  isCompactView,
  moreActionsLabel = 'More actions',
}) => {
  const isMobile = useIsMobileScreen();
  const isCompactLayout = isCompactView ?? isMobile;

  const {
    refs: { containerRef, leftSectionRef, measureRef },
    visibleActions,
    hiddenActions,
  } = useFlexibleActions({
    actions,
    direction: isCompactLayout
      ? FlexibleActionsDirection.Normal
      : FlexibleActionsDirection.Reverse,
    dependencies: [isCompactLayout],
    actionsGap: isCompactLayout ? COMPACT_ACTIONS_GAP : ACTIONS_GAP,
    containerPadding: isCompactLayout
      ? COMPACT_CONTAINER_PADDING
      : CONTAINER_PADDING,
  });

  const selectionLabel = getSelectionLabel(selectedCount);

  const clearSelectionButton = (
    <GhostIconButton
      size={isCompactLayout ? ElementSize.Standard : ElementSize.Small}
      aria-label={clearSelectionLabel}
      tooltipProps={{ tooltip: clearSelectionLabel }}
      icon={
        <IconX
          {...FILE_MANAGER_ICON_PROPS}
          size={
            isCompactLayout ? DIAL_ICON_SIZE.SM : FILE_MANAGER_ICON_PROPS.size
          }
        />
      }
      onClick={onClearSelection}
    />
  );

  if (isCompactLayout) {
    return (
      <>
        <div
          ref={measureRef}
          className="absolute top-0 left-0 invisible pointer-events-none overflow-hidden flex"
        >
          {actions.map(({ key, icon }) => (
            <GhostIconButton
              key={key}
              size={ElementSize.Standard}
              icon={icon}
            />
          ))}
        </div>

        <div
          ref={containerRef}
          className={compactBulkActionsContainerClassName}
          role="toolbar"
          aria-label="File bulk actions"
        >
          <div
            ref={leftSectionRef}
            className="flex shrink-0 items-center gap-2"
          >
            <span className={compactBulkActionsCountClassName}>
              {selectedCount}
              <span className="sr-only"> {selectionLabel}</span>
            </span>
            {clearSelectionButton}
            <div className={compactBulkActionsDividerClassName} />
          </div>

          <div className={compactBulkActionsGroupClassName}>
            {visibleActions.map(
              ({ key, icon, tooltip, title, onClick, disabled }) => (
                <GhostIconButton
                  key={key}
                  size={ElementSize.Standard}
                  aria-label={title}
                  tooltipProps={{ tooltip: tooltip ?? title }}
                  icon={icon}
                  disabled={disabled}
                  onClick={(domEvent) => onClick?.({ key, domEvent })}
                />
              ),
            )}

            {hiddenActions.length > 0 && (
              <Dropdown
                items={hiddenActions}
                allowedPlacements={['top', 'top-end']}
              >
                <GhostIconButton
                  size={ElementSize.Standard}
                  aria-label={moreActionsLabel}
                  icon={<IconDotsVertical {...FILE_MANAGER_ICON_PROPS} />}
                />
              </Dropdown>
            )}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        ref={measureRef}
        className="absolute top-0 left-0 invisible pointer-events-none overflow-hidden whitespace-nowrap flex gap-3"
      >
        {actions.map(({ key, icon, title, danger }) => {
          const MeasuredButton = danger ? DangerButton : PrimaryButton;

          return (
            <MeasuredButton
              key={key}
              appearance={ButtonAppearance.Ghost}
              iconBefore={icon}
              label={title}
            />
          );
        })}
      </div>

      <div ref={containerRef} className={bulkActionsStripClassName}>
        <div
          className={bulkActionsContainerClassName}
          role="toolbar"
          aria-label="File bulk actions"
        >
          <div ref={leftSectionRef} className={bulkActionsLabelClassName}>
            <span className={bulkActionsCountClassName}>{selectedCount}</span>
            <span className="whitespace-nowrap">{selectionLabel}</span>
            {clearSelectionButton}
          </div>

          <div className={bulkActionsGroupClassName}>
            {hiddenActions.length > 0 && (
              <Dropdown
                items={hiddenActions}
                allowedPlacements={['bottom', 'bottom-start']}
              >
                <GhostIconButton
                  className="h-[38px]"
                  icon={<IconDotsVertical {...FILE_MANAGER_ICON_PROPS} />}
                />
              </Dropdown>
            )}

            {visibleActions.map(
              ({ key, icon, tooltip, title, onClick, disabled, danger }) => {
                /*
                 * The row reads as a set of links rather than filled buttons:
                 * no fill, accent labels, and the one destructive action in the
                 * danger colour.
                 */
                const ActionButton = danger ? DangerButton : PrimaryButton;

                return (
                  <ActionButton
                    key={key}
                    appearance={ButtonAppearance.Ghost}
                    iconBefore={icon}
                    label={title}
                    disabled={disabled}
                    tooltipProps={{ tooltip }}
                    onClick={(domEvent) => onClick?.({ key, domEvent })}
                  />
                );
              },
            )}
          </div>
        </div>
      </div>
    </>
  );
};
