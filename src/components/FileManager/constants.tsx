import { FileManagerColumnKey } from '@/types/file-manager.ts';

export const containerBaseClassName =
  'w-full h-full grid grid-rows-[minmax(0,1fr)] overflow-hidden min-w-0';

export const toolbarBaseClassName = 'text-secondary flex items-center gap-2';

export const mainGridClassName =
  'flex min-h-0 min-w-0 h-full gap-4 overflow-hidden';

export const contentGridClassName =
  'flex flex-col flex-1 min-h-0 min-w-0 h-full px-5 gap-5';

export const contentHeaderClassName =
  'flex w-full shrink-0 items-center justify-between gap-4 h-[64px]';

export const sidebarPanelClassName =
  'min-h-0 min-w-[360px] h-full bg-layer-raised shadow-sm';

export const sidebarContentClassName = 'flex h-full min-h-0 flex-col gap-3';

export const sidebarHeadingClassName = 'dial-h1-text text-primary';

export const sidebarHeadingRowClassName =
  'px-4 h-[64px] flex items-center justify-between gap-2';

export const sidebarTreeContainerClassName = 'min-h-0 flex-1 px-3';

/*
 * Only reached when the panel carries no heading for the filter row to be
 * named from.
 */
export const sidebarTabsAriaLabelDefault = 'File storage sections';

export const gridPanelClassName =
  'flex flex-1 flex-col w-full min-h-0 min-w-0 gap-5';

export const gridBaseClassName =
  'flex-1 w-full text-secondary overflow-auto min-h-0 min-w-0';

/*
 * The bulk actions bar floats over the bottom of the card, centered, so it
 * never covers the header and never pushes a row out of view.
 */
export const bulkActionsToolbarWrapperClassName =
  'absolute bottom-4 left-4 right-4 z-10';

export const actionsColumnButtonClassName =
  'opacity-0 pointer-events-none group-hover/grid-row:opacity-100 group-hover/grid-row:pointer-events-auto';

export const sidebarTitleDefault = 'Files';

export const BASE_FILE_MANAGER_ICON_SIZE = 20;

export const FILES_DATA_TRANSFER_TYPE = 'Files';

export const FOLDER_PLACEHOLDER_FILE_NAME = '.dial_folder';

export const DEFAULT_FOLDER_BASE_NAME = 'New folder';

/*
 * AG Grid's built-in selection column id. The kit's Grid renders its own
 * selection column (GRID_SELECTION_COLUMN_ID), but a consumer that passes a raw
 * `rowSelection` config without `selectionMode` still gets this one.
 */
export const AG_GRID_SELECTION_COLUMN_ID = 'ag-Grid-SelectionColumn';

export const COMPACT_VIEW_HEADER_HEIGHT = 44;

export const COMPACT_VIEW_FILE_ROW_HEIGHT = 56;

export const DEFAULT_COMPACT_VIEW_WIDTH_BREAKPOINT = 800;

export const DEFAULT_VISIBLE_COLUMN = [
  FileManagerColumnKey.Name,
  FileManagerColumnKey.UpdatedAt,
  FileManagerColumnKey.Size,
  FileManagerColumnKey.Author,
  FileManagerColumnKey.Actions,
];

/*
 * The search field and the sort menu share one row at the top of the grid
 * card; the menu keeps its width and the field takes the rest.
 */
export const searchRowClassName = 'flex w-full shrink-0 items-center gap-3';
