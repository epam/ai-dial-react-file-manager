import { type FC, useMemo } from 'react';

import {
  ButtonAppearance,
  ButtonDropdown,
  ButtonVariant,
  DIAL_ICON_SIZE,
  Dropdown,
  type DropdownItem,
  ElementSize,
  IconButton,
  DropdownItemType,
  MenuItemMark,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import { IconArrowsSort } from '@tabler/icons-react';

import {
  FILE_MANAGER_ICON_PROPS,
  FILE_MANAGER_ICON_STROKE,
} from '@/constants/icon';
import {
  type FileManagerSort,
  FileManagerSortDirection,
  FileManagerSortField,
} from '@/types/file-manager';

// The kit has no tinted icon-button variant, so the icon-only trigger takes the accent tint from tokens.
const ICON_ONLY_TRIGGER_CLASS_NAME =
  'border border-accent-alpha bg-control-accent-alpha hover:bg-control-accent-alpha-hover';

// The sort menu keeps the design's width rather than following the compact trigger.
const SORT_DROPDOWN_PROPS = {
  listClassName: 'min-w-[240px]',
  matchReferenceWidth: false,
};

export interface DialFileManagerSortDropdownProps {
  /** The sort currently applied to the grid. */
  sort: FileManagerSort;
  /** Fired with the next sort when a field or a direction is picked. */
  onSortChange?: (sort: FileManagerSort) => void;
  /** Label of the trigger button. */
  label?: string;
  /** Menu labels of the sort fields. */
  fieldLabels?: Partial<Record<FileManagerSortField, string>>;
  /** Menu labels of the sort directions. */
  directionLabels?: Partial<Record<FileManagerSortDirection, string>>;
  /** Whether the trigger is disabled. */
  disabled?: boolean;
  /** Additional classes for the trigger button. */
  className?: string;
  /** Renders a round icon-only trigger (the compact view's action row); `label` becomes its accessible name. */
  iconOnly?: boolean;
}

const DEFAULT_FIELD_LABELS: Record<FileManagerSortField, string> = {
  [FileManagerSortField.Name]: 'Name',
  [FileManagerSortField.UpdatedAt]: 'Modified date',
  [FileManagerSortField.Size]: 'Size',
};

const DEFAULT_DIRECTION_LABELS: Record<FileManagerSortDirection, string> = {
  [FileManagerSortDirection.Asc]: 'Ascending',
  [FileManagerSortDirection.Desc]: 'Descending',
};

const FIELDS = Object.values(FileManagerSortField);
const DIRECTIONS = Object.values(FileManagerSortDirection);

/**
 * DialFileManagerSortDropdown
 *
 * The "Sort" menu at the trailing edge of the search row. It lists the sort
 * fields, a divider, then the directions, and marks the chosen field and the
 * chosen direction with a trailing check. The component holds no sort state of
 * its own: it shows `sort` and reports picks through `onSortChange`.
 *
 * @example
 * ```tsx
 * <DialFileManagerSortDropdown
 *   sort={{ field: FileManagerSortField.Name, direction: FileManagerSortDirection.Asc }}
 *   onSortChange={setSort}
 * />
 * ```
 *
 * @param sort - The sort currently applied to the grid
 * @param [onSortChange] - Fired with the next sort when a field or a direction is picked
 * @param [label='Sort'] - Label of the trigger button
 * @param [fieldLabels] - Menu labels of the sort fields
 * @param [directionLabels] - Menu labels of the sort directions
 * @param [disabled] - Whether the trigger is disabled
 * @param [className] - Additional classes for the trigger button
 * @param [iconOnly=false] - Renders a round icon-only trigger; `label` becomes its accessible name
 */
export const DialFileManagerSortDropdown: FC<
  DialFileManagerSortDropdownProps
> = ({
  sort,
  onSortChange,
  label = 'Sort',
  fieldLabels,
  directionLabels,
  disabled,
  className,
  iconOnly = false,
}) => {
  const items = useMemo<DropdownItem[]>(
    () => [
      ...FIELDS.map((field) => ({
        key: `field-${field}`,
        label: fieldLabels?.[field] ?? DEFAULT_FIELD_LABELS[field],
        mark: MenuItemMark.Check,
        checked: sort.field === field,
        onClick: () => onSortChange?.({ ...sort, field }),
      })),
      { key: 'sort-divider', type: DropdownItemType.Divider },
      ...DIRECTIONS.map((direction) => ({
        key: `direction-${direction}`,
        label:
          directionLabels?.[direction] ?? DEFAULT_DIRECTION_LABELS[direction],
        mark: MenuItemMark.Check,
        checked: sort.direction === direction,
        onClick: () => onSortChange?.({ ...sort, direction }),
      })),
    ],
    [sort, onSortChange, fieldLabels, directionLabels],
  );

  if (iconOnly) {
    return (
      <Dropdown items={items} {...SORT_DROPDOWN_PROPS}>
        <IconButton
          variant={ButtonVariant.Primary}
          appearance={ButtonAppearance.Ghost}
          size={ElementSize.Standard}
          icon={
            <IconArrowsSort
              stroke={FILE_MANAGER_ICON_STROKE}
              size={DIAL_ICON_SIZE.LG}
            />
          }
          aria-label={label}
          disabled={disabled}
          className={mergeClasses(ICON_ONLY_TRIGGER_CLASS_NAME, className)}
        />
      </Dropdown>
    );
  }

  return (
    <ButtonDropdown
      label={label}
      variant={ButtonVariant.Primary}
      appearance={ButtonAppearance.Ghost}
      iconBefore={<IconArrowsSort {...FILE_MANAGER_ICON_PROPS} />}
      items={items}
      dropdownProps={SORT_DROPDOWN_PROPS}
      disabled={disabled}
      className={className}
    />
  );
};
