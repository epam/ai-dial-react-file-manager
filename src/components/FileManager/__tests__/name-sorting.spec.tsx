import { render, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { GridApi } from 'ag-grid-community';
import { DialFileManager } from '../FileManager';
import { DialFileNodeType, type DialFile } from '@/models/file';

/**
 * `DialGrid` supplies a case-insensitive comparator via its own `defaultColDef`,
 * but ag-Grid replaces `defaultColDef` instead of merging it — so the one the
 * FileManager passes used to drop that comparator, and sorting fell back to
 * ag-Grid's case-sensitive default (all uppercase names first).
 *
 * These tests drive a real ag-Grid, so they fail if the comparator stops
 * reaching the grid, which a comparator unit test alone would not catch.
 */

// Names taken from the reported issue screenshot.
const NAMES = [
  'New folder 1',
  'New folder 2',
  'New folder 10',
  'Uno-Rules-PDF-Official-Rules-unorules.org_ (1).pdf',
  'appdata',
  'code app 07.08',
  'Zebra',
  'banana',
];

const ROOT_PATH = 'All files';

const buildItems = (names: string[]): DialFile[] => [
  {
    id: 'root',
    name: ROOT_PATH,
    path: ROOT_PATH,
    folderId: '',
    nodeType: DialFileNodeType.FOLDER,
    items: names.map(
      (name, index) =>
        ({
          id: `id-${index}`,
          name,
          path: `${ROOT_PATH}/${name}`,
          folderId: ROOT_PATH,
          nodeType: name.endsWith('.pdf')
            ? DialFileNodeType.ITEM
            : DialFileNodeType.FOLDER,
          items: [],
        }) as unknown as DialFile,
    ),
  } as unknown as DialFile,
];

const renderGrid = async (names: string[]): Promise<GridApi> => {
  let api: GridApi | undefined;

  render(
    <DialFileManager
      items={buildItems(names)}
      defaultPath={ROOT_PATH}
      onGridApiChange={(gridApi) => (api = gridApi)}
    />,
  );

  await waitFor(() => expect(api).toBeTruthy());
  await waitFor(() => expect(api!.getDisplayedRowCount()).toBe(names.length));

  return api!;
};

const sortedNames = (api: GridApi, sort: 'asc' | 'desc'): string[] => {
  api.applyColumnState({ state: [{ colId: 'name', sort }] });

  const names: string[] = [];
  api.forEachNodeAfterFilterAndSort((node) => {
    const name = (node.data as { name?: string } | undefined)?.name;
    if (name) names.push(name);
  });

  return names;
};

describe('Dial UI Kit :: FileManager name sorting', () => {
  test('sorts names alphabetically without regard to letter case', async () => {
    const api = await renderGrid(NAMES);

    expect(sortedNames(api, 'asc')).toEqual([
      'appdata',
      'banana',
      'code app 07.08',
      'New folder 1',
      'New folder 2',
      'New folder 10',
      'Uno-Rules-PDF-Official-Rules-unorules.org_ (1).pdf',
      'Zebra',
    ]);
  });

  test('does not place all uppercase names before lowercase ones', async () => {
    const api = await renderGrid(['Zebra', 'appdata', 'Banana', 'cherry']);

    // The reported bug produced ['Banana', 'Zebra', 'appdata', 'cherry'].
    expect(sortedNames(api, 'asc')).toEqual([
      'appdata',
      'Banana',
      'cherry',
      'Zebra',
    ]);
  });

  test('orders numbered folders numerically rather than lexicographically', async () => {
    const api = await renderGrid([
      'New folder 10',
      'New folder 2',
      'New folder 1',
    ]);

    expect(sortedNames(api, 'asc')).toEqual([
      'New folder 1',
      'New folder 2',
      'New folder 10',
    ]);
  });

  test('reverses the same case-insensitive order on descending sort', async () => {
    const api = await renderGrid(['Zebra', 'appdata', 'Banana', 'cherry']);

    expect(sortedNames(api, 'desc')).toEqual([
      'Zebra',
      'cherry',
      'Banana',
      'appdata',
    ]);
  });
});
