import {
  Dropdown,
  GhostIconButton,
  BASE_ICON_PROPS,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import { IconDotsVertical } from '@tabler/icons-react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { useRef, useEffect, useCallback, useMemo } from 'react';
import type { FileManagerGridRow } from '@/components/FileManager/FileManagerContext';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import type { DialFileAcceptType } from '@/models/file-manager';

interface UseGridActionsColumnProps {
  getContextMenuItems: (row: FileManagerGridRow) => DropdownItem[];
  isRowDisabled: (
    row: FileManagerGridRow,
    allowedFileTypes?: DialFileAcceptType[],
    maxSelectableFileSize?: number,
  ) => boolean;
  allowedFileTypes?: DialFileAcceptType[];
  maxSelectableFileSize?: number;
  buttonClassName?: string;
}

export const useGridActionsColumn = ({
  getContextMenuItems,
  isRowDisabled,
  allowedFileTypes,
  maxSelectableFileSize,
  buttonClassName,
}: UseGridActionsColumnProps) => {
  const getContextMenuItemsRef = useRef(getContextMenuItems);

  useEffect(() => {
    getContextMenuItemsRef.current = getContextMenuItems;
  }, [getContextMenuItems]);

  const renderActionsCell = useCallback(
    (p: ICellRendererParams<FileManagerGridRow, unknown>) => {
      if (!p.data) return null;

      const disabled = isRowDisabled(
        p.data,
        allowedFileTypes,
        maxSelectableFileSize,
      );

      if (disabled) return null;

      const items = p.data
        ? (getContextMenuItemsRef.current?.(p.data) ?? [])
        : [];

      if (!items.length) return null;

      return (
        <Dropdown
          placement="bottom-start"
          allowedPlacements={['top-start', 'top-end', 'bottom-start']}
          items={items}
          className={mergeClasses('sticky right-0', buttonClassName)}
        >
          <GhostIconButton icon={<IconDotsVertical {...BASE_ICON_PROPS} />} />
        </Dropdown>
      );
    },
    [allowedFileTypes, maxSelectableFileSize, buttonClassName, isRowDisabled],
  );

  const actionsColumnDef: ColDef<FileManagerGridRow> = useMemo(
    () => ({
      colId: '__actions',
      headerName: '',
      width: 44,
      minWidth: 44,
      maxWidth: 44,
      suppressSizeToFit: true,
      sortable: false,
      resizable: false,
      filter: false,
      floatingFilter: false,
      cellRenderer: renderActionsCell,
    }),
    [renderActionsCell],
  );

  return { actionsColumnDef };
};
