import { render } from '@testing-library/react';
import type { ColDef, ICellRendererParams, IRowNode } from 'ag-grid-community';
import { describe, expect, it, vi } from 'vitest';
import type { FileManagerGridRow } from '@/components/FileManager/FileManagerContext';
import { DialFileNodeType } from '@/models/file';
import { FileManagerColumnKey } from '@/types/file-manager';
import {
  FileManagerGridSkeletonCell,
  GRID_SKELETON_ROW_COUNT,
  GRID_SKELETON_ROW_IDS,
  GRID_SKELETON_ROWS,
  isGridSkeletonRow,
  toGridSkeletonColumnDefs,
} from './FileManagerGridSkeleton';

const renderCell = (colId: string, extra: Record<string, unknown> = {}) =>
  render(
    <FileManagerGridSkeletonCell
      {...({
        colDef: { colId },
        node: { rowIndex: 0 } as IRowNode<FileManagerGridRow>,
        ...extra,
      } as unknown as ICellRendererParams<FileManagerGridRow>)}
    />,
  );

describe('Dial UI Kit :: FileManagerGridSkeleton', () => {
  it('provides a fixed set of placeholder rows that are recognised as such', () => {
    expect(GRID_SKELETON_ROWS).toHaveLength(GRID_SKELETON_ROW_COUNT);
    expect(GRID_SKELETON_ROW_IDS.size).toBe(GRID_SKELETON_ROW_COUNT);
    expect(GRID_SKELETON_ROWS.every(isGridSkeletonRow)).toBe(true);
    expect(
      isGridSkeletonRow({
        id: 'a',
        path: 'All files/a.txt',
        name: 'a.txt',
        nodeType: DialFileNodeType.ITEM,
      }),
    ).toBe(false);
  });

  it('draws an icon circle and a name bar in the name column', () => {
    const { container } = renderCell(FileManagerColumnKey.Name);

    expect(container.querySelector('.rounded-full')).toBeInTheDocument();
    expect(container.querySelectorAll('.rounded-xl')).toHaveLength(1);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('adds a summary line to the name column in the compact view', () => {
    const { container } = renderCell(FileManagerColumnKey.Name, {
      compact: true,
    });

    expect(container.querySelectorAll('.rounded-xl')).toHaveLength(2);
  });

  it('draws one bar in a data column and nothing in the actions column', () => {
    expect(
      renderCell(FileManagerColumnKey.Size).container.querySelectorAll(
        '.rounded-xl',
      ),
    ).toHaveLength(1);
    expect(
      renderCell(FileManagerColumnKey.Actions).container,
    ).toBeEmptyDOMElement();
  });

  it('keeps the column layout and drops the data-driven behaviour', () => {
    const valueGetter = () => 'x';
    const columns: ColDef<FileManagerGridRow>[] = [
      {
        colId: FileManagerColumnKey.Size,
        headerName: 'Size',
        width: 120,
        sortable: true,
        valueGetter,
        cellClass: 'text-end',
        cellClassRules: { muted: () => true },
      },
    ];

    const [col] = toGridSkeletonColumnDefs(columns, { compact: true });

    expect(col).toMatchObject({
      colId: FileManagerColumnKey.Size,
      headerName: 'Size',
      width: 120,
      cellClass: 'text-end',
      sortable: false,
      cellRenderer: FileManagerGridSkeletonCell,
      cellRendererParams: { compact: true },
    });
    expect(col.valueGetter).toBeUndefined();
    expect(col.cellClassRules).toBeUndefined();
  });

  it('drops host spans, cell handlers, editors and data-driven class / style callbacks', () => {
    const columns: ColDef<FileManagerGridRow>[] = [
      {
        colId: FileManagerColumnKey.Name,
        colSpan: () => 2,
        rowSpan: () => 2,
        cellEditor: 'agTextCellEditor',
        onCellClicked: vi.fn(),
        onCellDoubleClicked: vi.fn(),
        onCellContextMenu: vi.fn(),
        onCellValueChanged: vi.fn(),
        cellClass: () => 'from-data',
        cellStyle: () => ({ color: 'red' }),
      },
      {
        colId: FileManagerColumnKey.Size,
        cellStyle: { textAlign: 'right' },
      },
    ];

    const [name, size] = toGridSkeletonColumnDefs(columns, {});

    expect(name.colSpan).toBeUndefined();
    expect(name.rowSpan).toBeUndefined();
    expect(name.cellEditor).toBeUndefined();
    expect(name.onCellClicked).toBeUndefined();
    expect(name.onCellDoubleClicked).toBeUndefined();
    expect(name.onCellContextMenu).toBeUndefined();
    expect(name.onCellValueChanged).toBeUndefined();
    expect(name.cellClass).toBeUndefined();
    expect(name.cellStyle).toBeUndefined();
    // A static style is layout, not data, so it stays.
    expect(size.cellStyle).toEqual({ textAlign: 'right' });
  });
});
