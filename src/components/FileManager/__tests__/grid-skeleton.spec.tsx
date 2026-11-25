import { act, cleanup, render, screen } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import { SKELETON_BAR_HEIGHT, SKELETON_BAR_WIDTHS } from '@epam/ai-dial-ui-kit';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { DialFileManager } from '../FileManager';
import { DialFileNodeType, type DialFile } from '@/models/file';
import { GridSelectionMode } from '@/models/selection-mode';
import type { FileManagerGridRow } from '../FileManagerContext';

beforeEach(() =>
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] }),
);
afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
});

const advance = async (milliseconds: number) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds);
  });
};

const ROOT_PATH = 'All files';
const FILE_PATH = `${ROOT_PATH}/a.txt`;

const rootWith = (children: DialFile[]): DialFile[] => [
  {
    id: 'root',
    name: ROOT_PATH,
    path: ROOT_PATH,
    folderId: '',
    nodeType: DialFileNodeType.FOLDER,
    items: children,
  } as unknown as DialFile,
];

const FILES = rootWith([
  {
    id: 'a.txt',
    name: 'a.txt',
    path: FILE_PATH,
    folderId: ROOT_PATH,
    nodeType: DialFileNodeType.ITEM,
  } as unknown as DialFile,
]);

const displayedRows = (api: GridApi): FileManagerGridRow[] => {
  const rows: FileManagerGridRow[] = [];
  api.forEachNode((node) => rows.push(node.data as FileManagerGridRow));
  return rows;
};

const displayedNames = (api: GridApi) =>
  displayedRows(api).map((row) => row.name);

const gridRegion = () => screen.getByRole('region', { name: 'Data grid' });

const waitForSkeleton = async (label = 'Loading files') => {
  await advance(400);
  // AG Grid schedules overlay mounting after React commits the loading change.
  await advance(100);
  expect(screen.getByText(label)).toBeInTheDocument();
  expect(gridRegion()).toHaveAttribute('aria-busy', 'true');
  expect(
    gridRegion().querySelector('.ag-overlay-loading-wrapper [inert]'),
  ).toBeInTheDocument();
};

const waitForLoaded = async (label = 'Loading files') => {
  await advance(500);
  expect(gridRegion()).toHaveAttribute('aria-busy', 'false');
  expect(screen.queryByText(label)).not.toBeInTheDocument();
};

type ManagerProps = Partial<Parameters<typeof DialFileManager>[0]>;

/** Keeps `getApi` pointing at the live grid API through re-renders. */
const renderManager = async (props: ManagerProps) => {
  let api: GridApi | undefined;
  const handleGridApiChange = (gridApi: GridApi) => {
    api = gridApi;
  };
  const element = (nextProps: ManagerProps) => (
    <DialFileManager
      defaultPath={ROOT_PATH}
      emptyStateTitle="This folder is empty"
      onGridApiChange={handleGridApiChange}
      {...nextProps}
    />
  );
  const utils = render(element(props));
  await advance(100);
  expect(api).toBeTruthy();
  return {
    ...utils,
    getApi: () => api!,
    update: (nextProps: ManagerProps) => utils.rerender(element(nextProps)),
  };
};

describe('Dial UI Kit :: FileManager grid skeleton', () => {
  test('an empty loading grid suppresses the empty state without adding placeholder data', async () => {
    const { getApi } = await renderManager({
      items: rootWith([]),
      filesLoading: true,
    });

    expect(displayedRows(getApi())).toEqual([]);
    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();

    await waitForSkeleton();
    expect(displayedRows(getApi())).toEqual([]);
    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();

    // Decorative cells use GridLoadingSkeleton's defaults, not file-specific shapes.
    const overlay = gridRegion().querySelector(
      '.ag-overlay-loading-wrapper [inert]',
    );
    expect(overlay?.querySelector('.rounded-xl')).toHaveStyle({
      width: SKELETON_BAR_WIDTHS[0],
      height: `${SKELETON_BAR_HEIGHT}px`,
    });
    expect(overlay?.querySelector('.rounded-full')).not.toBeInTheDocument();
    expect(overlay?.querySelector('.bg-layer-sunken')).toBeInTheDocument();
    expect(overlay?.querySelector('.bg-layer-base')).toBeInTheDocument();
  });

  test('grid loading leaves a loaded empty tree alone unless the host sets tree loading', async () => {
    const props = {
      items: rootWith([]),
      filesLoading: true,
      treeOptions: { expandedPaths: new Set([ROOT_PATH]) },
    };
    const { update } = await renderManager(props);
    await waitForSkeleton();
    expect(
      screen.getByRole('tree').querySelector('[aria-busy="true"]'),
    ).not.toBeInTheDocument();

    update({ ...props, treeOptions: { ...props.treeOptions, loading: true } });
    await advance(400);
    expect(
      screen.getByRole('tree').querySelector('[aria-busy="true"]'),
    ).toBeInTheDocument();
    expect(screen.getByText('Loading folders')).toBeInTheDocument();
  });

  test('covers existing rows with the kit overlay without replacing the data or row nodes', async () => {
    const { getApi, update } = await renderManager({ items: FILES });
    expect(displayedNames(getApi())).toEqual(['a.txt']);
    const node = getApi().getRowNode(FILE_PATH);

    update({ items: FILES, filesLoading: true });
    expect(displayedNames(getApi())).toEqual(['a.txt']);

    await waitForSkeleton();
    expect(displayedNames(getApi())).toEqual(['a.txt']);
    expect(getApi().getRowNode(FILE_PATH)).toBe(node);
    expect(gridRegion().querySelector('.ag-body-viewport')).toHaveAttribute(
      'inert',
    );

    update({ items: FILES });
    await waitForLoaded();
    expect(getApi().getRowNode(FILE_PATH)).toBe(node);
    expect(gridRegion().querySelector('.ag-body-viewport')).not.toHaveAttribute(
      'inert',
    );
  });

  test('keeps the selection even while the skeleton overlay is visible', async () => {
    const onSelectedPathsChange = vi.fn();
    const selected = {
      items: FILES,
      gridOptions: { selectionMode: GridSelectionMode.MULTIPLE },
      selectedPaths: new Set([FILE_PATH]),
      onSelectedPathsChange,
    };
    const { getApi, update } = await renderManager(selected);
    const selectedPaths = () =>
      getApi()
        .getSelectedRows()
        .map((row: FileManagerGridRow) => row.path);

    expect(selectedPaths()).toEqual([FILE_PATH]);
    update({ ...selected, filesLoading: true });
    await waitForSkeleton();
    expect(selectedPaths()).toEqual([FILE_PATH]);

    update(selected);
    await waitForLoaded();
    expect(selectedPaths()).toEqual([FILE_PATH]);
    expect(onSelectedPathsChange).not.toHaveBeenCalledWith(new Set());
  });

  test('blocks select-all while loading and restores it without changing the retained selection', async () => {
    const onSelectedPathsChange = vi.fn();
    const props = {
      items: FILES,
      gridOptions: { selectionMode: GridSelectionMode.MULTIPLE },
      onSelectedPathsChange,
    };
    const { getApi, update } = await renderManager(props);
    expect(displayedNames(getApi())).toEqual(['a.txt']);
    const selectAll = screen.getByRole('checkbox', { name: 'Select all rows' });
    expect(selectAll).toBeEnabled();

    update({ ...props, filesLoading: true });
    expect(selectAll).toBeDisabled();
    await waitForSkeleton();
    act(() => selectAll.click());
    expect(getApi().getSelectedRows()).toEqual([]);
    expect(onSelectedPathsChange).not.toHaveBeenCalled();

    update(props);
    await waitForLoaded();
    expect(selectAll).toBeEnabled();
    act(() => selectAll.click());
    await advance(200);
    expect(onSelectedPathsChange).toHaveBeenCalledWith(new Set([FILE_PATH]));
  });

  test('uses the same overlay for an in-progress search and announces the custom label', async () => {
    const { getApi, update } = await renderManager({ items: FILES });
    expect(displayedNames(getApi())).toEqual(['a.txt']);

    update({
      items: FILES,
      searchInProgress: true,
      filesLoadingLabel: 'Searching files',
    });
    await waitForSkeleton('Searching files');
    expect(displayedNames(getApi())).toEqual(['a.txt']);
    expect(screen.queryByText('Loading files')).not.toBeInTheDocument();

    update({ items: FILES });
    await waitForLoaded('Searching files');
  });

  test('does not show or announce a skeleton for a fast load', async () => {
    const { getApi, update } = await renderManager({ items: FILES });
    expect(displayedNames(getApi())).toEqual(['a.txt']);

    update({ items: FILES, filesLoading: true });
    expect(screen.queryByText('Loading files')).not.toBeInTheDocument();
    update({ items: FILES });

    await waitForLoaded();
    expect(displayedNames(getApi())).toEqual(['a.txt']);
  });

  test('keeps a visible skeleton for its minimum duration before showing an empty result', async () => {
    const { update } = await renderManager({
      items: rootWith([]),
      filesLoading: true,
    });
    await waitForSkeleton();

    update({ items: rootWith([]) });
    expect(screen.getByText('Loading files')).toBeInTheDocument();
    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();

    await advance(500);
    expect(screen.getByText('This folder is empty')).toBeInTheDocument();
    expect(screen.queryByText('Loading files')).not.toBeInTheDocument();
  });

  test('forwards host loading-cell renderers to the kit overlay', async () => {
    const renderLoadingCell = vi.fn(() => <span>Custom placeholder</span>);
    const { getApi } = await renderManager({
      items: FILES,
      filesLoading: true,
      gridOptions: { renderLoadingCell },
    });

    await waitForSkeleton();
    expect(renderLoadingCell).toHaveBeenCalledWith(
      expect.objectContaining({ columnId: 'name', rowIndex: 0 }),
    );
    expect(screen.getAllByText('Custom placeholder').length).toBeGreaterThan(0);
    expect(displayedNames(getApi())).toEqual(['a.txt']);
  });
});
