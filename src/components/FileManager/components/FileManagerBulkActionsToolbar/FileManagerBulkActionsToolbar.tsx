import { useFlexibleActions } from '@/hooks/use-flexible-actions';
import { useIsMobileScreen } from '@/hooks/use-is-mobile-screen';
import {
  ButtonAppearance,
  DangerButton,
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
  CONTAINER_PADDING,
  bulkActionsContainerClassName,
  bulkActionsGroupClassName,
  bulkActionsLabelClassName,
  bulkActionsStripClassName,
} from './constants';

export interface DialActionDropdownItem extends DropdownItem {
  title: string;
  tooltip?: string;
}

export interface DialFileManagerBulkActionsToolbarProps {
  getSelectionLabel: (selectedCount: number) => ReactNode;
  onClearSelection: () => void;
  actions: DialActionDropdownItem[];
  selectedCount: number;
  /** Accessible name of the control that drops the selection. */
  clearSelectionLabel?: string;
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
 *   // A node, so the count can carry a badge of its own
 *   getSelectionLabel={(count) => <><Badge>{count}</Badge> files selected</>}
 *   onClearSelection={() => console.log('Cleared')}
 *   actions={[
 *     { key: 'download', title: 'Download', icon: <IconDownload {...FILE_MANAGER_ICON_PROPS} />, onClick: () => {} },
 *     { key: 'delete', title: 'Delete', icon: <IconTrash {...FILE_MANAGER_ICON_PROPS} />, onClick: () => {} },
 *   ]}
 * />
 * ```
 *
 * @param {object} props
 * @param {(count: number) => ReactNode} props.getSelectionLabel - Function to get the label showing current selection status (e.g., "3 files selected"). May return a node, so the count can carry its own styling.
 * @param {() => void} props.onClearSelection - Callback invoked when the clear selection button is clicked.
 * @param {DialActionDropdownItem[]} props.actions - List of available toolbar actions.
 *   Each action defines a title, icon, key, and optional click handler.
 * @param {number} [props.selectedCount] - Count of currently selected items.
 * @param {string} [props.clearSelectionLabel='Clear selection'] - Accessible name of the control that drops the selection.
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
}) => {
  const isMobile = useIsMobileScreen();

  const {
    refs: { containerRef, leftSectionRef, measureRef },
    visibleActions,
    hiddenActions,
  } = useFlexibleActions({
    actions,
    direction: FlexibleActionsDirection.Reverse,
    dependencies: [isMobile],
    actionsGap: ACTIONS_GAP,
    containerPadding: CONTAINER_PADDING,
  });

  const selectionLabel = getSelectionLabel(selectedCount);

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
            <span className="whitespace-nowrap">{selectionLabel}</span>
            <GhostIconButton
              size={ElementSize.Small}
              aria-label={clearSelectionLabel}
              tooltipProps={{ tooltip: clearSelectionLabel }}
              icon={<IconX {...FILE_MANAGER_ICON_PROPS} />}
              onClick={onClearSelection}
            />
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
