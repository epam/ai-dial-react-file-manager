import React, { createRef, type ReactElement } from 'react';
import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DialFileManager } from './FileManager';
import { itemsMock } from './__mocks__/files';
import type { DialFileManagerActionsRef } from '@/models/file-manager';
import {
  useFileManagerColumns,
  type FileManagerGridContext,
  type UseFileManagerColumnsArgs,
} from './hooks/use-file-manager-columns';
import type { FileManagerGridRow } from './FileManagerContext';
import {
  DialFileManagerTabs,
  FileManagerColumnKey,
} from '@/types/file-manager';
import { GridSelectionMode } from '@/models/selection-mode';
import {
  DialFileNodeType,
  DialFileResourceType,
  DialFilePermission,
  type DialFile,
} from '@/models/file';
import type { DropdownItem } from '@epam/ai-dial-ui-kit';

interface GridRowLike {
  name?: string;
  path?: string;
}

interface MockColumnDef {
  filter?: boolean;
  floatingFilter?: boolean;
}

interface MockCellClickedEvent<Row extends GridRowLike> {
  colDef: { colId: string };
  data: Row;
}

interface MockAdditionalGridOptions<Row extends GridRowLike> {
  onCellClicked?: (event: MockCellClickedEvent<Row>) => void;
}

interface MockGridProps<Row extends GridRowLike> {
  rowData?: Row[];
  getRowId?: (row: Row) => string;
  columnDefs?: MockColumnDef[];
  className?: string;
  additionalGridOptions?: MockAdditionalGridOptions<Row>;
  disabledRowIds?: Set<string>;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>, rows: Row[]) => void;
}

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  const Grid = <Row extends GridRowLike>(props: MockGridProps<Row>) => {
    const {
      rowData,
      getRowId,
      columnDefs,
      className,
      additionalGridOptions,
      disabledRowIds,
      selectedRowIds,
      onSelectionChange,
    } = props;

    const rowsArray: Row[] = rowData ?? [];
    const getId =
      getRowId ?? ((_: Row, index: number): string => String(index));

    const filtersDisabled =
      Array.isArray(columnDefs) &&
      columnDefs.length > 0 &&
      columnDefs.every(
        (col) => col.filter === false && col.floatingFilter === false,
      );

    const clickCell = (row: Row, colId: string): void => {
      const handler = additionalGridOptions?.onCellClicked;
      if (!handler) return;
      handler({ colDef: { colId }, data: row });
    };

    const handleRowClick = (row: Row): void => {
      clickCell(row, 'name');
    };

    const toggleSelection = (row: Row, key: string): void => {
      const next = new Set(selectedRowIds ?? []);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      onSelectionChange?.(next, Array.from(next).length ? [row] : []);
    };

    const rows = rowsArray.map((row, index) => {
      const key = getId(row, index);
      const label = row.name ?? row.path ?? String(index);
      const isDisabled = disabledRowIds?.has(key) ?? false;
      const isSelected = selectedRowIds?.has(key) ?? false;

      return (
        <tr
          key={key}
          className="ag-row"
          aria-selected={isSelected}
          data-disabled={isDisabled || undefined}
          ref={(el: HTMLTableRowElement | null) => {
            if (el) el.setAttribute('row-id', key);
          }}
          onClick={() => handleRowClick(row)}
        >
          <td>
            <input
              type="checkbox"
              aria-label={`Select ${label}`}
              checked={isSelected}
              readOnly
              onClick={(event) => {
                event.stopPropagation();
                toggleSelection(row, key);
                clickCell(row, actual.GRID_SELECTION_COLUMN_ID);
              }}
            />
          </td>
          <td>{label}</td>
        </tr>
      );
    });

    return (
      <div
        className={className}
        role={'grid'}
        aria-label="File Manager Grid View"
      >
        <table role="table">
          {!filtersDisabled && (
            <thead>
              <tr>
                <th>
                  <input aria-label="column filter" />
                </th>
              </tr>
            </thead>
          )}
          <tbody className="ag-center-cols-container">{rows}</tbody>
        </table>
      </div>
    );
  };

  const TooltipContainer = ({
    children,
  }: {
    children: React.ReactNode;
    open?: boolean;
    placement?: string;
  }) => <>{children}</>;

  const TooltipTrigger = ({
    children,
  }: {
    children: React.ReactNode;
    asChild?: boolean;
  }) => <>{children}</>;

  const TooltipContent = ({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) => (
    <div
      role="tooltip"
      data-testid="disabled-row-tooltip"
      className={className}
    >
      {children}
    </div>
  );

  const ButtonDropdown = ({
    label,
    items,
    disabled,
  }: {
    label?: string;
    items: DropdownItem[];
    disabled?: boolean;
  }) => (
    <div data-testid="mock-button-dropdown">
      <button disabled={disabled}>{label}</button>
      {items.map((item) => (
        <button
          key={item.key}
          data-testid={`action-${item.key}`}
          onClick={() =>
            item.onClick?.({
              key: item.key,
              domEvent: {} as React.MouseEvent,
            })
          }
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  return {
    ...actual,
    ButtonDropdown,
    Grid,
    TooltipContainer,
    TooltipContent,
    TooltipTrigger,
  };
});

const renderWithinSizedShell = (ui: ReactElement) =>
  render(<div style={{ height: 640, width: 1100 }}>{ui}</div>);

const getGridRegion = () =>
  screen.getByRole('region', { name: 'File Manager Grid View' });

const waitForGridTable = async (): Promise<HTMLElement> => {
  const grid = getGridRegion();
  await within(grid).findByRole('table', undefined, { timeout: 5000 });
  return grid;
};

const findInGridByRowText = async (text: string | RegExp): Promise<Element> => {
  const grid = await waitForGridTable();
  const matcher =
    typeof text === 'string'
      ? (value: string): boolean => value.includes(text)
      : (value: string): boolean => text.test(value);

  let found: Element | null = null;

  await waitFor(
    () => {
      const rows = grid.querySelectorAll('.ag-center-cols-container .ag-row');
      found =
        Array.from(rows).find((row) =>
          matcher((row.textContent ?? '').trim()),
        ) ?? null;
      if (found === null) {
        throw new Error('Row not rendered yet');
      }
    },
    { timeout: 5000 },
  );

  if (found === null) {
    throw new Error('Row not found');
  }

  return found;
};

const queryAllInGridByRowText = async (
  text: string | RegExp,
): Promise<Element[]> => {
  const grid = await waitForGridTable();
  const matcher =
    typeof text === 'string'
      ? (value: string): boolean => value.includes(text)
      : (value: string): boolean => text.test(value);
  const rows = grid.querySelectorAll('.ag-center-cols-container .ag-row');
  return Array.from(rows).filter((row) =>
    matcher((row.textContent ?? '').trim()),
  );
};

const disabledRowItems: DialFile[] = [
  {
    id: 'dr-root',
    name: 'Files',
    path: 'Files',
    parentPath: '',
    nodeType: DialFileNodeType.FOLDER,
    folderId: 'dr-root',
    updatedAt: '2025-01-01',
    items: [
      {
        id: 'dr-svg',
        name: 'icon.svg',
        path: 'Files/icon.svg',
        parentPath: 'Files',
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'svg',
        contentType: 'image/svg+xml',
        folderId: 'dr-root',
        updatedAt: '2025-01-01',
        contentLength: 1024,
        permissions: [DialFilePermission.READ],
      },
      {
        id: 'dr-pdf',
        name: 'report.pdf',
        path: 'Files/report.pdf',
        parentPath: 'Files',
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'pdf',
        contentType: 'application/pdf',
        folderId: 'dr-root',
        updatedAt: '2025-01-01',
        contentLength: 1024,
        permissions: [DialFilePermission.READ],
      },
      {
        id: 'dr-big',
        name: 'large.svg',
        path: 'Files/large.svg',
        parentPath: 'Files',
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'svg',
        contentType: 'image/svg+xml',
        folderId: 'dr-root',
        updatedAt: '2025-01-01',
        contentLength: 10 * 1024 * 1024, // 10 MB
        permissions: [DialFilePermission.READ],
      },
    ],
  },
];

const hoverRowByRowText = async (rowText: string) => {
  const row = await findInGridByRowText(rowText);
  const cell = row.querySelector('td')!;
  fireEvent.mouseMove(cell);
};

const expectNoDisabledTooltip = () => {
  expect(screen.queryByText(/Unsupported file type/)).not.toBeInTheDocument();
  expect(screen.queryByText(/File is too large/)).not.toBeInTheDocument();
};

describe('Dial UI Kit :: FileManager', () => {
  test('search scans descendants; "svg" lists SVG folder and *.svg files but NOT "24px" in the grid', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        path="/All files/Design/Icons"
        treeOptions={{
          expandedPaths: new Set([
            '/All files',
            '/All files/Design',
            '/All files/Design/Icons',
            '/All files/Design/Icons/SVG',
          ]),
          showFiles: true,
        }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const searchRegion = screen.getByRole('search', { name: 'Search' });
    const searchInput = within(searchRegion).getByRole('textbox');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'svg');

    expect(await findInGridByRowText('SVG')).toBeInTheDocument();
    expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();
    expect(await findInGridByRowText('settings.svg')).toBeInTheDocument();

    expect((await queryAllInGridByRowText('24px')).length).toBe(0);
  });

  test('breadcrumb navigation updates grid to show parent folder children', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="/All files/Design/Icons/SVG/24px"
        treeOptions={{
          expandedPaths: new Set([
            'All files',
            'All files/Design',
            'All files/Design/Icons',
            'All files/Design/Icons/SVG',
            'All files/Design/Icons/SVG/24px',
          ]),
          showFiles: true,
        }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const iconsCrumb = screen.getByRole('link', { name: 'SVG' });
    await userEvent.click(iconsCrumb);

    expect(await findInGridByRowText('24px')).toBeInTheDocument();
    expect((await queryAllInGridByRowText('alert.svg')).length).toBe(0);
  });

  test('clicking a node in the tree updates the grid contents', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files"
        treeOptions={{
          expandedPaths: new Set(['All files', 'All files/Media']),
          showFiles: true,
        }}
      />,
    );

    const videoNode = await screen.findByText('Video', {}, { timeout: 5000 });
    await userEvent.click(videoNode);

    expect(await findInGridByRowText('promo.mp4')).toBeInTheDocument();
  });

  test('clicking a folder row selection checkbox selects it without navigating into the folder', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files/Design/Icons"
        gridOptions={{
          selectionMode: GridSelectionMode.MULTIPLE,
          showFiles: true,
        }}
      />,
    );

    const folderRow = await findInGridByRowText('SVG');
    await userEvent.click(
      within(folderRow as HTMLElement).getByRole('checkbox', {
        name: 'Select SVG',
      }),
    );

    /* The listing must stay on the parent folder, so its siblings remain visible. */
    expect(await findInGridByRowText('PNG')).toBeInTheDocument();
    expect(await findInGridByRowText('SVG')).toBeInTheDocument();
    expect((await queryAllInGridByRowText('24px')).length).toBe(0);
  });

  test('clicking a folder name cell still navigates into the folder', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files/Design/Icons"
        gridOptions={{
          selectionMode: GridSelectionMode.MULTIPLE,
          showFiles: true,
        }}
      />,
    );

    const folderRow = await findInGridByRowText('SVG');
    await userEvent.click(within(folderRow as HTMLElement).getByText('SVG'));

    expect(await findInGridByRowText('24px')).toBeInTheDocument();
  });

  test('gridOptions.filterable=false disables floating filters in grid header', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        path="/All files/Design/Icons"
        treeOptions={{
          expandedPaths: new Set([
            '/All files',
            '/All files/Design',
            '/All files/Design/Icons',
          ]),
        }}
        gridOptions={{ filterable: false }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const grid = await waitForGridTable();
    const textboxesInsideGrid = within(grid).queryAllByRole('textbox');
    expect(textboxesInsideGrid.length).toBe(0);
  });

  describe('content layout', () => {
    const getFoldersPanel = (name = 'File storage') =>
      screen.getByRole('complementary', { name });

    const tabsMock = [
      { value: DialFileManagerTabs.MyFiles, label: 'My files' },
      { value: DialFileManagerTabs.Shared, label: 'Shared' },
    ];

    test('renders the filter row inside the folders panel, not the toolbar', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          treeOptions={{
            header: 'File storage',
            tabs: tabsMock,
            activeTab: DialFileManagerTabs.MyFiles,
            onTabChange: vi.fn(),
          }}
          toolbarOptions={{}}
        />,
      );

      await waitForGridTable();

      const panel = getFoldersPanel();
      // The chip row is named from the panel's own visible heading.
      const chipRow = within(panel).getByRole('group', {
        name: 'File storage',
      });

      expect(
        within(chipRow).getByRole('button', { name: 'My files' }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        within(chipRow).getByRole('button', { name: 'Shared' }),
      ).toHaveAttribute('aria-pressed', 'false');

      const toolbar = screen.getByRole('toolbar', {
        name: 'File Manager Toolbar',
      });
      expect(within(toolbar).queryByRole('group')).not.toBeInTheDocument();
    });

    test('names the folders panel from its heading', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          treeOptions={{ header: 'File storage' }}
        />,
      );

      await waitForGridTable();

      expect(getFoldersPanel()).toBeInTheDocument();
    });

    test('falls back to a landmark label when the panel has no heading', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          treeOptions={{ header: null }}
        />,
      );

      await waitForGridTable();

      expect(
        getFoldersPanel('File Manager Tree Navigation'),
      ).toBeInTheDocument();
    });

    test('names the filter row from tabsAriaLabel when the panel has no heading', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          treeOptions={{
            header: null,
            tabs: tabsMock,
            activeTab: DialFileManagerTabs.MyFiles,
            onTabChange: vi.fn(),
          }}
        />,
      );

      await waitForGridTable();

      expect(
        screen.getByRole('group', { name: 'File storage sections' }),
      ).toBeInTheDocument();
    });

    test('reports tab changes through treeOptions.onTabChange', async () => {
      const onTabChange = vi.fn();

      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          treeOptions={{
            tabs: tabsMock,
            activeTab: DialFileManagerTabs.MyFiles,
            onTabChange,
          }}
        />,
      );

      await waitForGridTable();

      await userEvent.click(screen.getByRole('button', { name: 'Shared' }));

      expect(onTabChange).toHaveBeenCalledWith(DialFileManagerTabs.Shared);
    });

    test('renders no filter row when treeOptions carries no tabs', async () => {
      renderWithinSizedShell(
        <DialFileManager items={itemsMock} path="/All files" />,
      );

      await waitForGridTable();

      expect(screen.queryByRole('group')).not.toBeInTheDocument();
    });

    test('renders the search field above the grid rather than inside it', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          navigationPanelOptions={{ searchable: true }}
        />,
      );

      const grid = await waitForGridTable();

      const search = screen.getByRole('search', { name: 'Search' });
      expect(search).toBeInTheDocument();
      expect(grid.contains(search)).toBe(false);
    });

    /*
     * The bulk bar used to take the header's place. It floats over the grid
     * now, so the breadcrumbs and the header actions survive a selection.
     */
    test('hides the bulk actions toolbar while a search has no results', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          selectedPaths={new Set(['/All files/Design'])}
          navigationPanelOptions={{ searchable: true }}
          bulkActionsToolbarOptions={{
            getSelectionLabel: () => 'selected',
            actionLabels: { download: 'Download', delete: 'Delete' },
          }}
        />,
      );

      await waitForGridTable();
      expect(
        screen.getByRole('toolbar', { name: 'File bulk actions' }),
      ).toBeInTheDocument();

      const searchRegion = screen.getByRole('search', { name: 'Search' });
      await userEvent.type(
        within(searchRegion).getByRole('textbox'),
        'no-such-file-xyz',
      );

      expect(await screen.findByText('No data')).toBeInTheDocument();
      expect(
        screen.queryByRole('toolbar', { name: 'File bulk actions' }),
      ).not.toBeInTheDocument();
    });

    test('keeps the content header while a selection is live', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          path="/All files"
          selectedPaths={new Set(['/All files/Design'])}
          toolbarOptions={{}}
          bulkActionsToolbarOptions={{
            getSelectionLabel: (count) =>
              `item${count === 1 ? '' : 's'} selected`,
            actionLabels: { download: 'Download', delete: 'Delete' },
          }}
        />,
      );

      await waitForGridTable();

      expect(
        screen.getByRole('toolbar', { name: 'File bulk actions' }),
      ).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('item selected')).toBeInTheDocument();

      expect(
        screen.getByRole('toolbar', { name: 'File Manager Toolbar' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('navigation', { name: 'Breadcrumb' }),
      ).toBeInTheDocument();
    });
  });

  test('actionsRef.createFolder adds a new row to the grid', async () => {
    const actionsRef = createRef<DialFileManagerActionsRef>();

    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        path="/All files"
        actionsRef={actionsRef}
        treeOptions={{
          expandedPaths: new Set(['/All files']),
          showFiles: true,
        }}
      />,
    );

    const rowsBefore = screen.getAllByRole('row').length;

    expect(actionsRef.current).not.toBeNull();
    expect(typeof actionsRef.current?.createFolder).toBe('function');
    actionsRef.current?.createFolder();

    await waitFor(() => {
      const rowsAfter = screen.getAllByRole('row').length;
      expect(rowsAfter).toBe(rowsBefore + 1);
    });
  });

  test('shows My Files empty state when My Files tab active', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={[]}
        toolbarOptions={{
          tabs: [
            { id: 'my_files', label: 'My Files' },
            { id: 'shared', label: 'Shared with Me' },
            { id: 'organization', label: 'Organization' },
          ],
          activeTab: 'my_files',
        }}
      />,
    );

    expect(screen.getByText('This folder is empty')).toBeInTheDocument();
  });

  test('custom title + description override default empty state for active tab', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={[]}
        emptyStateTitle="Custom title goes here"
        emptyStateDescription="Custom description text"
        toolbarOptions={{
          tabs: [
            { id: 'my_files', label: 'My Files' },
            { id: 'shared', label: 'Shared with Me' },
            { id: 'organization', label: 'Organization' },
          ],
          activeTab: 'my_files',
        }}
      />,
    );

    expect(screen.getByText('Custom title goes here')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();

    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();
  });

  describe('disabled-row tooltips', () => {
    test('file exceeding maxSelectableFileSize shows size tooltip', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          maxSelectableFileSize={5 * 1024 * 1024}
        />,
      );

      await hoverRowByRowText('large.svg');

      await waitFor(() => {
        expect(
          screen.getByText(/File is too large\. Maximum size: .+/),
        ).toBeInTheDocument();
      });
    });

    test('accepted file does NOT show disabled tooltip', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          allowedFileTypes={['image/svg+xml']}
          maxSelectableFileSize={5 * 1024 * 1024}
        />,
      );

      await hoverRowByRowText('icon.svg');

      await waitFor(() => {
        expectNoDisabledTooltip();
      });
    });

    test('custom getDisabledTooltip overrides default text', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          allowedFileTypes={['image/svg+xml']}
          getDisabledTooltip={(file) =>
            file.contentType === 'application/pdf'
              ? 'PDF files are not allowed'
              : undefined
          }
        />,
      );

      await hoverRowByRowText('report.pdf');

      await waitFor(() => {
        expect(
          screen.getByText('PDF files are not allowed'),
        ).toBeInTheDocument();
      });
    });

    test('custom unsupportedFileTypeTooltip overrides default', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          allowedFileTypes={['image/svg+xml']}
          unsupportedFileTypeTooltip="Wrong file type"
        />,
      );

      await hoverRowByRowText('report.pdf');

      await waitFor(() => {
        expect(screen.getByText('Wrong file type')).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/Unsupported file type\. Supported types/),
      ).not.toBeInTheDocument();
    });

    test('custom fileTooLargeTooltip overrides default', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          maxSelectableFileSize={5 * 1024 * 1024}
          fileTooLargeTooltip="File exceeds limit"
        />,
      );

      await hoverRowByRowText('large.svg');

      await waitFor(() => {
        expect(screen.getByText('File exceeds limit')).toBeInTheDocument();
      });

      expect(
        screen.queryByText(/File is too large\. Maximum size/),
      ).not.toBeInTheDocument();
    });

    test('tooltip disappears on scroll', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          allowedFileTypes={['image/*']}
        />,
      );

      await hoverRowByRowText('report.pdf');

      await waitFor(() => {
        expect(
          screen.getByText('Unsupported file type. Supported types: images.'),
        ).toBeInTheDocument();
      });

      fireEvent.scroll(window);

      await waitFor(() => {
        expect(
          screen.queryByText('Unsupported file type. Supported types: images.'),
        ).not.toBeInTheDocument();
      });
    });

    test('switching from one disabled row to another updates tooltip', async () => {
      renderWithinSizedShell(
        <DialFileManager
          items={disabledRowItems}
          path="Files"
          allowedFileTypes={['image/svg+xml']}
          maxSelectableFileSize={5 * 1024 * 1024}
          unsupportedFileTypeTooltip="Wrong type"
          fileTooLargeTooltip="Too large"
        />,
      );

      await hoverRowByRowText('report.pdf');

      await waitFor(() => {
        expect(screen.getByText('Wrong type')).toBeInTheDocument();
      });

      await hoverRowByRowText('large.svg');

      await waitFor(() => {
        expect(screen.getByText('Too large')).toBeInTheDocument();
        expect(screen.queryByText('Wrong type')).not.toBeInTheDocument();
      });
    });
  });

  test('search does NOT show files from hidden folders when hidden files toggle is off', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files"
        showHiddenFiles={false}
        treeOptions={{
          expandedPaths: new Set([
            'All files',
            'All files/Design',
            'All files/Design/Icons',
            'All files/Design/Icons/SVG',
            'All files/Design/Icons/SVG/24px',
          ]),
        }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const searchRegion = screen.getByRole('search', { name: 'Search' });
    const searchInput = within(searchRegion).getByRole('textbox');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'inside-hidden');

    expect(await screen.findByText('No data')).toBeInTheDocument();
    expect(within(getGridRegion()).queryByRole('table')).not.toBeInTheDocument();
  });

  test('search with no results hides the grid and shows only the empty-state title', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files"
        emptyStateDescription="Folder description"
        searchEmptyStateTitle="Nothing matches"
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const searchRegion = screen.getByRole('search', { name: 'Search' });
    const searchInput = within(searchRegion).getByRole('textbox');
    await userEvent.type(searchInput, 'no-such-file-xyz');

    expect(await screen.findByText('Nothing matches')).toBeInTheDocument();
    expect(screen.queryByText('Folder description')).not.toBeInTheDocument();
    expect(within(getGridRegion()).queryByRole('table')).not.toBeInTheDocument();
  });

  test('search DOES show files from hidden folders when hidden files toggle is on', async () => {
    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        defaultPath="All files"
        showHiddenFiles={true}
        treeOptions={{
          expandedPaths: new Set([
            'All files',
            'All files/Design',
            'All files/Design/Icons',
            'All files/Design/Icons/SVG',
            'All files/Design/Icons/SVG/24px',
          ]),
        }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const searchRegion = screen.getByRole('search', { name: 'Search' });
    const searchInput = within(searchRegion).getByRole('textbox');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'inside-hidden');

    expect(await findInGridByRowText('inside-hidden')).toBeInTheDocument();
  });

  test('actionsRef.createFolder clears search and adds a new row', async () => {
    const actionsRef = createRef<DialFileManagerActionsRef>();

    renderWithinSizedShell(
      <DialFileManager
        items={itemsMock}
        path="/All files/Design/Icons"
        actionsRef={actionsRef}
        treeOptions={{
          expandedPaths: new Set([
            '/All files',
            '/All files/Design',
            '/All files/Design/Icons',
          ]),
          showFiles: true,
        }}
        navigationPanelOptions={{ searchable: true }}
      />,
    );

    const baselineRowCount = screen.getAllByRole('row').length;

    const searchRegion = screen.getByRole('search', { name: 'Search' });
    const searchInput = within(searchRegion).getByRole('textbox');
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'svg');

    expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();

    actionsRef.current?.createFolder();

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      const rowsAfter = screen.getAllByRole('row').length;
      expect(rowsAfter).toBe(baselineRowCount + 1);
    });
  });

  describe('search persistence across file operations', () => {
    const SEARCH_QUERY = 'svg';
    const CURRENT_PATH = '/All files/Design/Icons/SVG/24px';
    const EXPANDED_PATHS = new Set([
      '/All files',
      '/All files/Design',
      '/All files/Design/Icons',
      '/All files/Design/Icons/SVG',
      '/All files/Design/Icons/SVG/24px',
    ]);

    const deepCloneItems = (): DialFile[] =>
      JSON.parse(JSON.stringify(itemsMock)) as DialFile[];

    const find24pxFolder = (items: DialFile[]): DialFile => {
      const design = items[0].items!.find((i) => i.name === 'Design')!;
      const icons = design.items!.find((i) => i.name === 'Icons')!;
      const svg = icons.items!.find((i) => i.name === 'SVG')!;
      return svg.items!.find((i) => i.name === '24px')!;
    };

    const renderSearchableManager = (items: DialFile[]) =>
      renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={CURRENT_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          navigationPanelOptions={{ searchable: true }}
        />,
      );

    const rerenderManager = (
      rerender: ReturnType<typeof render>['rerender'],
      items: DialFile[],
    ) =>
      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <DialFileManager
            items={items}
            path={CURRENT_PATH}
            treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
            navigationPanelOptions={{ searchable: true }}
          />
        </div>,
      );

    const typeSearchQuery = async (query: string): Promise<HTMLElement> => {
      const searchRegion = screen.getByRole('search', { name: 'Search' });
      const searchInput = within(searchRegion).getByRole('textbox');
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, query);
      return searchInput;
    };

    const expectRowAbsent = async (text: string): Promise<void> => {
      const grid = await waitForGridTable();
      await waitFor(() => {
        const rows = grid.querySelectorAll('.ag-center-cols-container .ag-row');
        const cellTexts = Array.from(rows).map((r) =>
          (r.textContent ?? '').trim(),
        );
        expect(cellTexts).not.toContain(text);
      });
    };

    test('rename: search query persists and renamed file appears in results', async () => {
      const items = deepCloneItems();
      const { rerender } = renderSearchableManager(items);
      const searchInput = await typeSearchQuery(SEARCH_QUERY);

      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();
      expect(await findInGridByRowText('logo.svg')).toBeInTheDocument();

      const mutatedItems = deepCloneItems();
      const folder = find24pxFolder(mutatedItems);
      const target = folder.items!.find((i) => i.name === 'alert.svg')!;
      target.name = 'renamed_alert.svg';
      target.path = `${CURRENT_PATH}/renamed_alert.svg`;
      target.id = 'renamed-alert-id';

      rerenderManager(rerender, mutatedItems);

      expect(searchInput).toHaveValue(SEARCH_QUERY);
      expect(
        await findInGridByRowText('renamed_alert.svg'),
      ).toBeInTheDocument();
      expect(await findInGridByRowText('logo.svg')).toBeInTheDocument();
      await expectRowAbsent('alert.svg');
    });

    test('delete: search query persists and deleted file disappears from results', async () => {
      const items = deepCloneItems();
      const { rerender } = renderSearchableManager(items);
      const searchInput = await typeSearchQuery(SEARCH_QUERY);

      expect(await findInGridByRowText('logo.svg')).toBeInTheDocument();

      const mutatedItems = deepCloneItems();
      const folder = find24pxFolder(mutatedItems);
      folder.items = folder.items!.filter((i) => i.name !== 'logo.svg');

      rerenderManager(rerender, mutatedItems);

      expect(searchInput).toHaveValue(SEARCH_QUERY);
      await expectRowAbsent('logo.svg');
      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();
    });

    test('duplicate: search query persists and duplicated file appears in results', async () => {
      const items = deepCloneItems();
      const { rerender } = renderSearchableManager(items);
      const searchInput = await typeSearchQuery(SEARCH_QUERY);

      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();

      const mutatedItems = deepCloneItems();
      const folder = find24pxFolder(mutatedItems);
      folder.items!.push({
        id: 'dup-alert',
        name: 'alert copy.svg',
        path: `${CURRENT_PATH}/alert copy.svg`,
        parentPath: CURRENT_PATH,
        folderId: 'icons-svg-24',
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'svg',
        contentLength: 1024,
      });

      rerenderManager(rerender, mutatedItems);

      expect(searchInput).toHaveValue(SEARCH_QUERY);
      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();
      expect(await findInGridByRowText('alert copy.svg')).toBeInTheDocument();
    });

    test('copy (new file added): search query persists and copied file appears in results', async () => {
      const items = deepCloneItems();
      const { rerender } = renderSearchableManager(items);
      const searchInput = await typeSearchQuery(SEARCH_QUERY);

      const mutatedItems = deepCloneItems();
      const folder = find24pxFolder(mutatedItems);
      folder.items!.push({
        id: 'copied-icon',
        name: 'copied-icon.svg',
        path: `${CURRENT_PATH}/copied-icon.svg`,
        parentPath: CURRENT_PATH,
        folderId: 'icons-svg-24',
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'svg',
        contentLength: 2048,
      });

      rerenderManager(rerender, mutatedItems);

      expect(searchInput).toHaveValue(SEARCH_QUERY);
      expect(await findInGridByRowText('copied-icon.svg')).toBeInTheDocument();
      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();
    });

    test('move (path change): search query persists and moved file reflects new name/path', async () => {
      const items = deepCloneItems();
      const { rerender } = renderSearchableManager(items);
      const searchInput = await typeSearchQuery(SEARCH_QUERY);

      expect(await findInGridByRowText('alert.svg')).toBeInTheDocument();

      const mutatedItems = deepCloneItems();
      const folder = find24pxFolder(mutatedItems);
      const target = folder.items!.find((i) => i.name === 'alert.svg')!;
      target.name = 'alert-moved.svg';
      target.path = `${CURRENT_PATH}/alert-moved.svg`;

      rerenderManager(rerender, mutatedItems);

      expect(searchInput).toHaveValue(SEARCH_QUERY);
      expect(await findInGridByRowText('alert-moved.svg')).toBeInTheDocument();
      await expectRowAbsent('alert.svg');
    });
  });

  describe('New actions clear search', () => {
    const renderWithNewActions = () =>
      renderWithinSizedShell(
        <DialFileManager
          items={itemsMock}
          defaultPath="All files"
          navigationPanelOptions={{ searchable: true }}
          toolbarOptions={{
            newActions: {
              newFolder: { label: 'New Folder' },
              uploadFiles: { label: 'Upload Files' },
              uploadArchive: { label: 'Upload Archive' },
            },
          }}
          treeOptions={{
            expandedPaths: new Set([
              'All files',
              'All files/Design',
              'All files/Design/Icons',
              'All files/Design/Icons/SVG',
            ]),
            showFiles: true,
          }}
        />,
      );

    const typeSearchAndVerify = async () => {
      const searchRegion = screen.getByRole('search', { name: 'Search' });
      const searchInput = within(searchRegion).getByRole('textbox');
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'svg');

      expect(await findInGridByRowText('SVG')).toBeInTheDocument();
      expect(searchInput).toHaveValue('svg');
      return searchInput;
    };

    test('New Folder clears the search text and results', async () => {
      renderWithNewActions();
      const searchInput = await typeSearchAndVerify();

      await userEvent.click(screen.getByTestId('action-new-folder'));

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
      expect((await queryAllInGridByRowText('SVG')).length).toBe(0);
    });

    test('Upload Files clears the search text and results', async () => {
      renderWithNewActions();
      const searchInput = await typeSearchAndVerify();

      await userEvent.click(screen.getByTestId('action-upload-file'));

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
      expect((await queryAllInGridByRowText('SVG')).length).toBe(0);
    });

    test('Upload Archive clears the search text and results', async () => {
      renderWithNewActions();
      const searchInput = await typeSearchAndVerify();

      await userEvent.click(screen.getByTestId('action-upload-archive'));

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
      expect((await queryAllInGridByRowText('SVG')).length).toBe(0);
    });

    test('drag and drop clears the search text and results', async () => {
      renderWithNewActions();
      const searchInput = await typeSearchAndVerify();

      fireEvent.drop(getGridRegion(), {
        dataTransfer: {
          files: [new File([''], 'test.txt', { type: 'text/plain' })],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(searchInput).toHaveValue('');
      });
      expect((await queryAllInGridByRowText('SVG')).length).toBe(0);
    });
  });

  describe('hideSearchPathItemName: path column cell renderer', () => {
    let pathCellRenderer: (params: {
      data: Pick<FileManagerGridRow, 'path'>;
      context: Partial<FileManagerGridContext>;
    }) => React.ReactElement;

    beforeEach(() => {
      let capturedRenderer: typeof pathCellRenderer;
      function HookHarness() {
        const { columnDefs } = useFileManagerColumns({
          effectiveVisibleColumns: [FileManagerColumnKey.Path],
        } as UseFileManagerColumnsArgs);
        const pathCol = columnDefs.find(
          (c) => c.colId === FileManagerColumnKey.Path,
        )!;
        capturedRenderer = pathCol.cellRenderer as typeof pathCellRenderer;
        return null;
      }
      render(<HookHarness />);
      pathCellRenderer = capturedRenderer!;
    });

    test('renders the trimmed path (without file name) when enabled', () => {
      const result = pathCellRenderer({
        data: { path: 'All files/Design/Icons/SVG/24px/logo.svg' },
        context: { hideSearchPathItemName: true },
      }) as React.ReactElement<{ text: string }>;
      expect(result.props.text).toBe('All files/Design/Icons/SVG/24px');
    });

    test('renders the full path (including file name) when disabled', () => {
      const result = pathCellRenderer({
        data: { path: 'All files/Design/Icons/SVG/24px/logo.svg' },
        context: { hideSearchPathItemName: false },
      }) as React.ReactElement<{ text: string }>;
      expect(result.props.text).toBe(
        'All files/Design/Icons/SVG/24px/logo.svg',
      );
    });

    test('strips trailing-slash folder name correctly when enabled', () => {
      const result = pathCellRenderer({
        data: { path: 'All files/Design/Icons/SVG/' },
        context: { hideSearchPathItemName: true },
      }) as React.ReactElement<{ text: string }>;
      expect(result.props.text).toBe('All files/Design/Icons');
    });
  });

  describe('selection of server-side search results', () => {
    const SEARCH_ROOT = 'All files';
    const SEARCH_RESULT_PATH = 'All files/Archive/2024/report.pdf';

    /* Lives in a folder the tree has never loaded, as a recursive search hit does. */
    const searchResultFile: DialFile = {
      id: 'archive-report',
      name: 'report.pdf',
      path: SEARCH_RESULT_PATH,
      parentPath: 'All files/Archive/2024',
      nodeType: DialFileNodeType.ITEM,
      resourceType: DialFileResourceType.FILE,
      extension: 'pdf',
      contentType: 'application/pdf',
      folderId: 'archive-2024',
      updatedAt: '2025-02-01',
      contentLength: 1024,
      permissions: [DialFilePermission.READ],
    };

    interface ControlledManagerProps {
      searchResults: DialFile[];
      onSelectionCommit: (paths: Set<string>) => void;
      onSearchFiles?: (folder: string, query: string) => void;
      initialSelectedPaths?: Set<string>;
    }

    const ControlledManager = ({
      searchResults,
      onSelectionCommit,
      onSearchFiles,
      initialSelectedPaths,
    }: ControlledManagerProps) => {
      const [selectedPaths, setSelectedPaths] = React.useState<Set<string>>(
        () => initialSelectedPaths ?? new Set<string>(),
      );

      return (
        <DialFileManager
          items={itemsMock}
          path={SEARCH_ROOT}
          navigationPanelOptions={{ searchable: true }}
          gridOptions={{
            selectionMode: GridSelectionMode.MULTIPLE,
            showFiles: true,
          }}
          onSearchFiles={onSearchFiles}
          searchResults={searchResults}
          selectedPaths={selectedPaths}
          onSelectedPathsChange={(paths) => {
            setSelectedPaths(new Set(paths));
            onSelectionCommit(new Set(paths));
          }}
        />
      );
    };

    test('a file selected in the search results stays selected', async () => {
      const onSearchFiles = vi.fn();
      const onSelectionCommit = vi.fn();

      const { rerender } = renderWithinSizedShell(
        <ControlledManager
          searchResults={[]}
          onSearchFiles={onSearchFiles}
          onSelectionCommit={onSelectionCommit}
        />,
      );

      const searchRegion = screen.getByRole('search', { name: 'Search' });
      const searchInput = within(searchRegion).getByRole('textbox');
      await userEvent.type(searchInput, 'report');

      await waitFor(() => {
        expect(onSearchFiles).toHaveBeenCalled();
      });

      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <ControlledManager
            searchResults={[searchResultFile]}
            onSearchFiles={onSearchFiles}
            onSelectionCommit={onSelectionCommit}
          />
        </div>,
      );

      const row = (await findInGridByRowText('report.pdf')) as HTMLElement;
      await userEvent.click(within(row).getByRole('checkbox'));

      await waitFor(() => {
        expect(row).toHaveAttribute('aria-selected', 'true');
      });
      expect(onSelectionCommit).toHaveBeenLastCalledWith(
        new Set([SEARCH_RESULT_PATH]),
      );
    });

    test('a selected path missing from both the tree and the search results is dropped', async () => {
      const onSelectionCommit = vi.fn();

      renderWithinSizedShell(
        <ControlledManager
          searchResults={[]}
          onSelectionCommit={onSelectionCommit}
          initialSelectedPaths={new Set(['All files/Ghost/missing.txt'])}
        />,
      );

      await waitFor(() => {
        expect(onSelectionCommit).toHaveBeenLastCalledWith(new Set());
      });
    });
  });

  describe('auto-select uploaded files', () => {
    const UPLOAD_PATH = 'All files/Design/Icons/SVG/24px';
    const EXPANDED_PATHS = new Set([
      'All files',
      'All files/Design',
      'All files/Design/Icons',
      'All files/Design/Icons/SVG',
      'All files/Design/Icons/SVG/24px',
    ]);

    const deepCloneItems = (): DialFile[] =>
      JSON.parse(JSON.stringify(itemsMock)) as DialFile[];

    const find24pxFolder = (items: DialFile[]): DialFile => {
      const design = items[0].items!.find((i) => i.name === 'Design')!;
      const icons = design.items!.find((i) => i.name === 'Icons')!;
      const svg = icons.items!.find((i) => i.name === 'SVG')!;
      return svg.items!.find((i) => i.name === '24px')!;
    };

    test('uploaded files via drag-and-drop are auto-selected after items update', async () => {
      const items = deepCloneItems();
      const onUploadFiles = vi.fn();
      const onSelectedPathsChange = vi.fn();

      const { rerender } = renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={UPLOAD_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          onUploadFiles={onUploadFiles}
          onSelectedPathsChange={onSelectedPathsChange}
          uploadEnabled
          autoSelectUploadedItems
        />,
      );

      fireEvent.drop(getGridRegion(), {
        dataTransfer: {
          files: [
            new File(['content1'], 'uploaded1.txt', { type: 'text/plain' }),
            new File(['content2'], 'uploaded2.txt', { type: 'text/plain' }),
          ],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(onUploadFiles).toHaveBeenCalledTimes(1);
      });

      const uploadedFileNames = onUploadFiles.mock.calls[0][0].map(
        (f: { name: string }) => f.name,
      );
      expect(uploadedFileNames).toEqual(
        expect.arrayContaining(['uploaded1.txt', 'uploaded2.txt']),
      );

      const updatedItems = deepCloneItems();
      const folder = find24pxFolder(updatedItems);
      folder.items!.push(
        {
          id: 'uploaded-1',
          name: 'uploaded1.txt',
          path: `${UPLOAD_PATH}/uploaded1.txt`,
          parentPath: UPLOAD_PATH,
          nodeType: DialFileNodeType.ITEM,
          resourceType: DialFileResourceType.FILE,
          extension: 'txt',
          contentType: 'text/plain',
          folderId: 'icons-svg-24',
          updatedAt: '2025-02-01',
          contentLength: 8,
          permissions: [DialFilePermission.READ],
        },
        {
          id: 'uploaded-2',
          name: 'uploaded2.txt',
          path: `${UPLOAD_PATH}/uploaded2.txt`,
          parentPath: UPLOAD_PATH,
          nodeType: DialFileNodeType.ITEM,
          resourceType: DialFileResourceType.FILE,
          extension: 'txt',
          contentType: 'text/plain',
          folderId: 'icons-svg-24',
          updatedAt: '2025-02-01',
          contentLength: 8,
          permissions: [DialFilePermission.READ],
        },
      );

      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <DialFileManager
            items={updatedItems}
            path={UPLOAD_PATH}
            treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
            onUploadFiles={onUploadFiles}
            onSelectedPathsChange={onSelectedPathsChange}
            uploadEnabled
            autoSelectUploadedItems
          />
        </div>,
      );

      await waitFor(() => {
        expect(onSelectedPathsChange).toHaveBeenCalled();
        const lastCall = onSelectedPathsChange.mock.calls[
          onSelectedPathsChange.mock.calls.length - 1
        ][0] as Set<string>;
        expect(lastCall.has(`${UPLOAD_PATH}/uploaded1.txt`)).toBe(true);
        expect(lastCall.has(`${UPLOAD_PATH}/uploaded2.txt`)).toBe(true);
      });
    });

    test('auto-selection does not fire when user navigates away before items update', async () => {
      const items = deepCloneItems();
      const onUploadFiles = vi.fn();
      const onSelectedPathsChange = vi.fn();

      const { rerender } = renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={UPLOAD_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          onUploadFiles={onUploadFiles}
          onSelectedPathsChange={onSelectedPathsChange}
          uploadEnabled
          autoSelectUploadedItems
        />,
      );

      fireEvent.drop(getGridRegion(), {
        dataTransfer: {
          files: [
            new File(['content'], 'navigated-away.txt', {
              type: 'text/plain',
            }),
          ],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(onUploadFiles).toHaveBeenCalledTimes(1);
      });

      onSelectedPathsChange.mockClear();

      const updatedItems = deepCloneItems();
      const folder = find24pxFolder(updatedItems);
      folder.items!.push({
        id: 'nav-away-file',
        name: 'navigated-away.txt',
        path: `${UPLOAD_PATH}/navigated-away.txt`,
        parentPath: UPLOAD_PATH,
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'txt',
        contentType: 'text/plain',
        folderId: 'icons-svg-24',
        updatedAt: '2025-02-01',
        contentLength: 7,
        permissions: [DialFilePermission.READ],
      });

      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <DialFileManager
            items={updatedItems}
            path="All files"
            treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
            onUploadFiles={onUploadFiles}
            onSelectedPathsChange={onSelectedPathsChange}
            uploadEnabled
          />
        </div>,
      );

      await waitFor(() => {
        const selectionCalls = onSelectedPathsChange.mock.calls;
        const hasUploadedFile = selectionCalls.some((call) => {
          const paths = call[0] as Set<string>;
          return paths.has(`${UPLOAD_PATH}/navigated-away.txt`);
        });
        expect(hasUploadedFile).toBe(false);
      });
    });

    test('auto-selects uploaded archive', async () => {
      const items = deepCloneItems();
      const onUploadArchive = vi.fn();
      const onSelectedPathsChange = vi.fn();

      const { rerender } = renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={UPLOAD_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          onUploadArchive={onUploadArchive}
          onSelectedPathsChange={onSelectedPathsChange}
          uploadEnabled
          autoSelectUploadedItems
          toolbarOptions={{
            newActions: {
              uploadArchive: { label: 'Upload Archive' },
            },
          }}
        />,
      );

      await userEvent.click(screen.getByTestId('action-upload-archive'));

      const input = document.body.querySelector(
        'input[accept=".zip,application/zip"]',
      ) as HTMLInputElement;

      expect(input).not.toBeNull();

      const file = new File(['mock content'], 'archive.zip', {
        type: 'application/zip',
      });
      Object.defineProperty(input, 'files', { value: [file] });
      act(() => {
        input.dispatchEvent(new Event('change'));
      });

      await waitFor(() => {
        expect(onUploadArchive).toHaveBeenCalledTimes(1);
      });

      const updatedItems = deepCloneItems();
      const folder = find24pxFolder(updatedItems);
      folder.items!.push({
        id: 'archive-0',
        name: 'archive',
        path: `${UPLOAD_PATH}/archive`,
        parentPath: UPLOAD_PATH,
        nodeType: DialFileNodeType.FOLDER,
        folderId: 'icons-svg-24',
        updatedAt: '2025-02-01',
        items: [],
      });

      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <DialFileManager
            items={updatedItems}
            path={UPLOAD_PATH}
            treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
            onUploadArchive={onUploadArchive}
            onSelectedPathsChange={onSelectedPathsChange}
            uploadEnabled
            autoSelectUploadedItems
          />
        </div>,
      );

      await waitFor(() => {
        expect(onSelectedPathsChange).toHaveBeenCalled();
        const lastCall = onSelectedPathsChange.mock.calls[
          onSelectedPathsChange.mock.calls.length - 1
        ][0] as Set<string>;
        expect(lastCall.has(`${UPLOAD_PATH}/archive`)).toBe(true);
      });
    });

    test('does not auto-select uploaded file that exceeds maxSelectableFileSize', async () => {
      const items = deepCloneItems();
      const onUploadFiles = vi.fn();
      const onSelectedPathsChange = vi.fn();
      const MAX_SIZE = 100 * 1024; // 100 KB

      const { rerender } = renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={UPLOAD_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          onUploadFiles={onUploadFiles}
          onSelectedPathsChange={onSelectedPathsChange}
          uploadEnabled
          autoSelectUploadedItems
          maxSelectableFileSize={MAX_SIZE}
        />,
      );

      fireEvent.drop(getGridRegion(), {
        dataTransfer: {
          files: [
            new File(['content'], 'too-large.png', { type: 'image/png' }),
          ],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(onUploadFiles).toHaveBeenCalledTimes(1);
      });

      onSelectedPathsChange.mockClear();

      const updatedItems = deepCloneItems();
      const folder = find24pxFolder(updatedItems);
      folder.items!.push({
        id: 'too-large-1',
        name: 'too-large.png',
        path: `${UPLOAD_PATH}/too-large.png`,
        parentPath: UPLOAD_PATH,
        nodeType: DialFileNodeType.ITEM,
        resourceType: DialFileResourceType.FILE,
        extension: 'png',
        contentType: 'image/png',
        folderId: 'icons-svg-24',
        updatedAt: '2025-02-01',
        contentLength: MAX_SIZE + 1,
        permissions: [DialFilePermission.READ],
      });

      vi.useFakeTimers();
      try {
        rerender(
          <div style={{ height: 640, width: 1100 }}>
            <DialFileManager
              items={updatedItems}
              path={UPLOAD_PATH}
              treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
              onUploadFiles={onUploadFiles}
              onSelectedPathsChange={onSelectedPathsChange}
              uploadEnabled
              autoSelectUploadedItems
              maxSelectableFileSize={MAX_SIZE}
            />
          </div>,
        );

        await act(async () => {
          await vi.runAllTimersAsync();
        });

        const hasOversizedFile = onSelectedPathsChange.mock.calls.some(
          (call) => {
            const paths = call[0] as Set<string>;
            return paths.has(`${UPLOAD_PATH}/too-large.png`);
          },
        );
        expect(hasOversizedFile).toBe(false);
      } finally {
        vi.useRealTimers();
      }
    });

    test('auto-selects only files that pass constraints when batch has mixed results', async () => {
      const items = deepCloneItems();
      const onUploadFiles = vi.fn();
      const onSelectedPathsChange = vi.fn();
      const MAX_SIZE = 100 * 1024;

      const { rerender } = renderWithinSizedShell(
        <DialFileManager
          items={items}
          path={UPLOAD_PATH}
          treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
          onUploadFiles={onUploadFiles}
          onSelectedPathsChange={onSelectedPathsChange}
          uploadEnabled
          autoSelectUploadedItems
          maxSelectableFileSize={MAX_SIZE}
        />,
      );

      fireEvent.drop(getGridRegion(), {
        dataTransfer: {
          files: [
            new File(['ok'], 'small.txt', { type: 'text/plain' }),
            new File(['big'], 'large.txt', { type: 'text/plain' }),
          ],
          types: ['Files'],
        },
      });

      await waitFor(() => {
        expect(onUploadFiles).toHaveBeenCalledTimes(1);
      });

      const updatedItems = deepCloneItems();
      const folder = find24pxFolder(updatedItems);
      folder.items!.push(
        {
          id: 'small-1',
          name: 'small.txt',
          path: `${UPLOAD_PATH}/small.txt`,
          parentPath: UPLOAD_PATH,
          nodeType: DialFileNodeType.ITEM,
          resourceType: DialFileResourceType.FILE,
          extension: 'txt',
          contentType: 'text/plain',
          folderId: 'icons-svg-24',
          updatedAt: '2025-02-01',
          contentLength: 3,
          permissions: [DialFilePermission.READ],
        },
        {
          id: 'large-1',
          name: 'large.txt',
          path: `${UPLOAD_PATH}/large.txt`,
          parentPath: UPLOAD_PATH,
          nodeType: DialFileNodeType.ITEM,
          resourceType: DialFileResourceType.FILE,
          extension: 'txt',
          contentType: 'text/plain',
          folderId: 'icons-svg-24',
          updatedAt: '2025-02-01',
          contentLength: MAX_SIZE + 1,
          permissions: [DialFilePermission.READ],
        },
      );

      rerender(
        <div style={{ height: 640, width: 1100 }}>
          <DialFileManager
            items={updatedItems}
            path={UPLOAD_PATH}
            treeOptions={{ expandedPaths: EXPANDED_PATHS, showFiles: true }}
            onUploadFiles={onUploadFiles}
            onSelectedPathsChange={onSelectedPathsChange}
            uploadEnabled
            autoSelectUploadedItems
            maxSelectableFileSize={MAX_SIZE}
          />
        </div>,
      );

      await waitFor(() => {
        expect(onSelectedPathsChange).toHaveBeenCalled();
        const lastCall = onSelectedPathsChange.mock.calls[
          onSelectedPathsChange.mock.calls.length - 1
        ][0] as Set<string>;
        expect(lastCall.has(`${UPLOAD_PATH}/small.txt`)).toBe(true);
        expect(lastCall.has(`${UPLOAD_PATH}/large.txt`)).toBe(false);
      });
    });
  });

  describe('maxNewFolderDepth / onNewFolderDepthExceeded', () => {
    const ROOT_PATH = '/L1';
    const L2 = `${ROOT_PATH}/L2`;
    const L3 = `${L2}/L3`;
    const L4 = `${L3}/L4`;
    const L5 = `${L4}/L5`;

    const deepItems: DialFile[] = [
      {
        id: 'l1',
        name: 'L1',
        path: ROOT_PATH,
        parentPath: '',
        nodeType: DialFileNodeType.FOLDER,
        folderId: 'l1',
        items: [
          {
            id: 'l2',
            name: 'L2',
            path: L2,
            parentPath: ROOT_PATH,
            nodeType: DialFileNodeType.FOLDER,
            folderId: 'l2',
            items: [
              {
                id: 'l3',
                name: 'L3',
                path: L3,
                parentPath: L2,
                nodeType: DialFileNodeType.FOLDER,
                folderId: 'l3',
                items: [
                  {
                    id: 'l4',
                    name: 'L4',
                    path: L4,
                    parentPath: L3,
                    nodeType: DialFileNodeType.FOLDER,
                    folderId: 'l4',
                    items: [],
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    test('calls onNewFolderDepthExceeded when creating folder at max depth via toolbar', async () => {
      const onNewFolderDepthExceeded = vi.fn();
      const onCreateFolder = vi.fn();

      renderWithinSizedShell(
        <DialFileManager
          items={deepItems}
          path={L4}
          maxNewFolderDepth={4}
          onNewFolderDepthExceeded={onNewFolderDepthExceeded}
          onCreateFolder={onCreateFolder}
          toolbarOptions={{
            newActions: { newFolder: { label: 'New Folder' } },
          }}
        />,
      );

      const newFolderBtn = await screen.findByTestId('action-new-folder');
      await userEvent.click(newFolderBtn);

      expect(onNewFolderDepthExceeded).toHaveBeenCalledTimes(1);
      expect(onCreateFolder).not.toHaveBeenCalled();
    });

    test('does not call onNewFolderDepthExceeded when below max depth', async () => {
      const onNewFolderDepthExceeded = vi.fn();

      renderWithinSizedShell(
        <DialFileManager
          items={deepItems}
          path={L3}
          maxNewFolderDepth={4}
          onNewFolderDepthExceeded={onNewFolderDepthExceeded}
          onCreateFolder={vi.fn()}
          toolbarOptions={{
            newActions: { newFolder: { label: 'New Folder' } },
          }}
        />,
      );

      const newFolderBtn = await screen.findByTestId('action-new-folder');
      await userEvent.click(newFolderBtn);

      expect(onNewFolderDepthExceeded).not.toHaveBeenCalled();
    });

    test('does not restrict creation when maxNewFolderDepth is not set', async () => {
      const onNewFolderDepthExceeded = vi.fn();

      renderWithinSizedShell(
        <DialFileManager
          items={deepItems}
          path={L4}
          onNewFolderDepthExceeded={onNewFolderDepthExceeded}
          onCreateFolder={vi.fn()}
          toolbarOptions={{
            newActions: { newFolder: { label: 'New Folder' } },
          }}
        />,
      );

      const newFolderBtn = await screen.findByTestId('action-new-folder');
      await userEvent.click(newFolderBtn);

      expect(onNewFolderDepthExceeded).not.toHaveBeenCalled();
    });
  });
});
