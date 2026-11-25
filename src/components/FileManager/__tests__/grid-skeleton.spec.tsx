import { render, screen, waitFor } from '@testing-library/react';
import type { GridApi } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';
import { DialFileManager } from '../FileManager';
import { DialFileNodeType, type DialFile } from '@/models/file';
import { GridSelectionMode } from '@/models/selection-mode';
import {
  GRID_SKELETON_ROW_COUNT,
  isGridSkeletonRow,
} from '../components/FileManagerGridSkeleton/FileManagerGridSkeleton';
import type { FileManagerGridRow } from '../FileManagerContext';

/*
 * These tests run on real timers: the skeleton waits 400 ms before it shows
 * and then stays at least 500 ms, and AG Grid renders asynchronously.
 */
const WAIT = { timeout: 3000 };

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

const isSkeleton = (api: GridApi) => {
  const rows = displayedRows(api);
  return (
    rows.length === GRID_SKELETON_ROW_COUNT && rows.every(isGridSkeletonRow)
  );
};

type ManagerProps = Partial<Parameters<typeof DialFileManager>[0]>;

/**
 * Renders the file manager and keeps `getApi` pointing at the live grid API:
 * every re-render passes the same `onGridApiChange`, so a grid the file
 * manager re-creates is never read through a destroyed API.
 */
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
  await waitFor(() => expect(api).toBeTruthy());
  return {
    ...utils,
    getApi: () => api!,
    update: (nextProps: ManagerProps) => utils.rerender(element(nextProps)),
  };
};

describe('Dial UI Kit :: FileManager grid skeleton', () => {
  test('an empty grid shows neither rows nor its empty state during the delay, then placeholder rows', async () => {
    const { getApi } = await renderManager({
      items: rootWith([]),
      filesLoading: true,
    });

    /*
     * During the delay the body is blank. The grid API can arrive after the
     * delay on a slow machine, so the only thing it may show besides
     * nothing is the full set of placeholder rows, never its empty state.
     */
    const rows = displayedRows(getApi());
    expect(rows.length === 0 || isSkeleton(getApi())).toBe(true);
    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();

    await waitFor(() => expect(isSkeleton(getApi())).toBe(true), WAIT);
    expect(screen.queryByText('This folder is empty')).not.toBeInTheDocument();
  });

  test('rows on screen stay during the delay, then give way to placeholder rows', async () => {
    const { getApi, update } = await renderManager({ items: FILES });
    await waitFor(() => expect(displayedNames(getApi())).toEqual(['a.txt']));

    update({ items: FILES, filesLoading: true });

    // Still the real row right after loading starts…
    expect(displayedNames(getApi())).toEqual(['a.txt']);
    // …and placeholder rows once the skeleton delay has passed.
    await waitFor(() => expect(isSkeleton(getApi())).toBe(true), WAIT);
    expect(screen.getByText('Loading files')).toBeInTheDocument();

    update({ items: FILES });

    await waitFor(
      () => expect(displayedNames(getApi())).toEqual(['a.txt']),
      WAIT,
    );
  });

  test('keeps the selection through a skeleton cycle', async () => {
    const onSelectedPathsChange = vi.fn();
    const selected = {
      items: FILES,
      gridOptions: { selectionMode: GridSelectionMode.MULTIPLE },
      selectedPaths: new Set([FILE_PATH]),
      onSelectedPathsChange,
    };
    const { getApi, update } = await renderManager(selected);
    await waitFor(
      () =>
        expect(
          getApi()
            .getSelectedRows()
            .map((row: FileManagerGridRow) => row.path),
        ).toEqual([FILE_PATH]),
      WAIT,
    );

    update({ ...selected, filesLoading: true });
    await waitFor(() => expect(isSkeleton(getApi())).toBe(true), WAIT);

    update(selected);
    await waitFor(
      () => expect(displayedNames(getApi())).toEqual(['a.txt']),
      WAIT,
    );

    await waitFor(
      () =>
        expect(
          getApi()
            .getSelectedRows()
            .map((row: FileManagerGridRow) => row.path),
        ).toEqual([FILE_PATH]),
      WAIT,
    );
    // The placeholder rows never reported the selection as cleared.
    expect(onSelectedPathsChange).not.toHaveBeenCalledWith(new Set());
  });
});
