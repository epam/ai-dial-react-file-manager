import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ICellRendererParams } from 'ag-grid-community';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';
import { DialFileNodeType } from '@/models/file';
import type { FileManagerGridRow } from '@/components/FileManager/FileManagerContext';
import { useGridActionsColumn } from '../use-grid-actions-column';

const row: FileManagerGridRow = {
  id: 'file',
  name: 'file.txt',
  nodeType: DialFileNodeType.ITEM,
  path: '/file.txt',
};

type CellRenderer = (
  params: ICellRendererParams<FileManagerGridRow, unknown>,
) => ReactNode;

describe('useGridActionsColumn', () => {
  it('hides actions for missing, disabled, and actionless rows', () => {
    const getContextMenuItems = vi.fn((): DropdownItem[] => []);
    const isRowDisabled = vi.fn(
      (currentRow: FileManagerGridRow) => currentRow.id === 'disabled',
    );
    const { result } = renderHook(() =>
      useGridActionsColumn({ getContextMenuItems, isRowDisabled }),
    );
    const renderCell = result.current.actionsColumnDef
      .cellRenderer as CellRenderer;

    expect(renderCell({ data: undefined } as never)).toBeNull();
    expect(
      renderCell({ data: { ...row, id: 'disabled' } } as never),
    ).toBeNull();
    expect(renderCell({ data: row } as never)).toBeNull();
    expect(getContextMenuItems).toHaveBeenCalledWith(row);
  });

  it('returns a configured dropdown when actions are available', () => {
    const items: DropdownItem[] = [{ key: 'download', label: 'Download' }];
    const getContextMenuItems = vi.fn(() => items);
    const isRowDisabled = vi.fn(() => false);
    const { result } = renderHook(() =>
      useGridActionsColumn({
        allowedFileTypes: ['text/plain'],
        buttonClassName: 'custom-actions',
        getContextMenuItems,
        isRowDisabled,
        maxSelectableFileSize: 100,
      }),
    );
    const renderCell = result.current.actionsColumnDef
      .cellRenderer as CellRenderer;
    const element = renderCell({ data: row } as never);

    expect(isValidElement(element)).toBe(true);
    const dropdown = element as ReactElement<{
      className: string;
      items: DropdownItem[];
    }>;
    expect(dropdown.props.items).toBe(items);
    expect(dropdown.props.className).toContain('custom-actions');
    expect(isRowDisabled).toHaveBeenCalledWith(row, ['text/plain'], 100);
  });
});
