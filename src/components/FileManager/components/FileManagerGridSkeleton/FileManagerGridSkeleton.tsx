import { Skeleton, SkeletonVariant } from '@epam/ai-dial-ui-kit';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import type { FC } from 'react';
import type { FileManagerGridRow } from '@/components/FileManager/FileManagerContext';
import { DialFileNodeType } from '@/models/file';
import { FileManagerColumnKey } from '@/types/file-manager';
import {
  SKELETON_BAR_HEIGHT as BAR_HEIGHT,
  SKELETON_CIRCLE_CLASS,
  SKELETON_DARK_BAR_CLASS as DARK_BAR_CLASS,
  SKELETON_ICON_SIZE as ICON_SIZE,
  SKELETON_LIGHT_BAR_CLASS as LIGHT_BAR_CLASS,
} from '@/constants/skeleton';

/*
 * TODO: move the grid skeleton to ui-kit. Once a ui-kit release ships
 * `Grid`'s `loadingAppearance={GridLoadingAppearance.Skeleton}` and
 * `loadingLabel`, pass `loading` to the kit `Grid` with them and delete this
 * module. That also removes the placeholder-row handling in `FileManager.tsx`:
 * the swapped `rowData` / `columnDefs`, `disabledRowIds`, context-menu and
 * click filters, `hideDisabledCheckboxes`, the suppressed no-rows overlays and
 * the grid `LiveRegion`. Raise the ui-kit dev and peer ranges to that release.
 */

/** Placeholder rows shown while the grid loads: enough to read as a list. */
export const GRID_SKELETON_ROW_COUNT = 6;

const GRID_SKELETON_ROW_ID_PREFIX = '__dial-file-manager-skeleton-';

/** Fixed name widths, varied so the rows read as a list (kit skeleton guide). */
const NAME_WIDTHS = ['42%', '68%', '55%', '74%', '48%', '62%'];

/** Bar width per column; columns not listed get `DEFAULT_BAR_WIDTH`. */
const COLUMN_BAR_WIDTHS: Partial<Record<string, string>> = {
  [FileManagerColumnKey.UpdatedAt]: '70%',
  [FileManagerColumnKey.Size]: '45%',
  [FileManagerColumnKey.Author]: '60%',
  [FileManagerColumnKey.Owner]: '60%',
  [FileManagerColumnKey.Path]: '80%',
};
const DEFAULT_BAR_WIDTH = '50%';

/** Columns that hold controls, not data: their placeholder cell stays empty. */
const EMPTY_COLUMNS: ReadonlySet<string> = new Set([
  FileManagerColumnKey.Actions,
]);

export const GRID_SKELETON_ROWS: FileManagerGridRow[] = Array.from(
  { length: GRID_SKELETON_ROW_COUNT },
  (_, index) => {
    const id = `${GRID_SKELETON_ROW_ID_PREFIX}${index}`;
    return { id, path: id, name: '', nodeType: DialFileNodeType.ITEM };
  },
);

export const GRID_SKELETON_ROW_IDS: Set<string> = new Set(
  GRID_SKELETON_ROWS.map((row) => row.path),
);

export const isGridSkeletonRow = (row?: FileManagerGridRow): boolean =>
  !!row && row.path.startsWith(GRID_SKELETON_ROW_ID_PREFIX);

export interface FileManagerGridSkeletonCellParams {
  /** Compact (mobile) layout: the name column has the name over a summary line. */
  compact?: boolean;
}

/**
 * Cell of a placeholder row: the kit skeleton shape of the column's data. The
 * row and column layout are the grid's own, so the placeholder has the real
 * column widths, row height and headers, and nothing moves when rows arrive.
 */
export const FileManagerGridSkeletonCell: FC<
  ICellRendererParams<FileManagerGridRow> & FileManagerGridSkeletonCellParams
> = ({ colDef, node, compact = false }) => {
  const colId = colDef?.colId ?? colDef?.field ?? '';
  if (EMPTY_COLUMNS.has(colId)) return null;

  const rowIndex = node.rowIndex ?? 0;

  if (colId === FileManagerColumnKey.Name) {
    const nameWidth = NAME_WIDTHS[rowIndex % NAME_WIDTHS.length];
    return (
      <div aria-hidden="true" className="flex size-full items-center gap-3">
        <Skeleton
          variant={SkeletonVariant.Circular}
          width={ICON_SIZE}
          height={ICON_SIZE}
          className={`shrink-0 ${SKELETON_CIRCLE_CLASS}`}
        />
        {compact ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton
              variant={SkeletonVariant.Text}
              width={nameWidth}
              height={BAR_HEIGHT}
              className={DARK_BAR_CLASS}
            />
            <Skeleton
              variant={SkeletonVariant.Text}
              width="40%"
              height={BAR_HEIGHT}
              className={LIGHT_BAR_CLASS}
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <Skeleton
              variant={SkeletonVariant.Text}
              width={nameWidth}
              height={BAR_HEIGHT}
              className={DARK_BAR_CLASS}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="flex size-full items-center">
      <Skeleton
        variant={SkeletonVariant.Text}
        width={COLUMN_BAR_WIDTHS[colId] ?? DEFAULT_BAR_WIDTH}
        height={BAR_HEIGHT}
        className={LIGHT_BAR_CLASS}
      />
    </div>
  );
};

/**
 * The grid's columns for placeholder rows: same ids, headers and sizes, each
 * cell drawn as a skeleton and nothing interactive (no sorting, editing,
 * tooltips, spanning, cell handlers or value formatting of the empty
 * placeholder data).
 */
export const toGridSkeletonColumnDefs = (
  columnDefs: ColDef<FileManagerGridRow>[],
  cellParams: FileManagerGridSkeletonCellParams,
): ColDef<FileManagerGridRow>[] =>
  columnDefs.map((col) => ({
    ...col,
    cellRenderer: FileManagerGridSkeletonCell,
    cellRendererSelector: undefined,
    cellRendererParams: cellParams,
    valueGetter: undefined,
    valueFormatter: undefined,
    tooltipField: undefined,
    tooltipValueGetter: undefined,
    editable: false,
    cellEditor: undefined,
    cellEditorSelector: undefined,
    sortable: false,
    // Spans and handlers read the row data, which placeholder rows do not have.
    colSpan: undefined,
    rowSpan: undefined,
    spanRows: undefined,
    onCellClicked: undefined,
    onCellDoubleClicked: undefined,
    onCellContextMenu: undefined,
    onCellValueChanged: undefined,
    // Rules and class / style callbacks read the row data too; static values stay.
    cellClassRules: undefined,
    cellClass: typeof col.cellClass === 'function' ? undefined : col.cellClass,
    cellStyle: typeof col.cellStyle === 'function' ? undefined : col.cellStyle,
  }));
