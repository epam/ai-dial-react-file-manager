import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import type { GridApi } from 'ag-grid-community';
import { DialFileManager } from '../FileManager';
import { DialFileNodeType, type DialFile } from '@/models/file';
import {
  FileManagerSortDirection,
  FileManagerSortField,
} from '@/types/file-manager';

const ROOT_PATH = 'All files';

const child = (
  name: string,
  nodeType: DialFileNodeType,
  contentLength?: number,
): DialFile =>
  ({
    id: name,
    name,
    path: `${ROOT_PATH}/${name}`,
    folderId: ROOT_PATH,
    nodeType,
    contentLength,
    items: [],
  }) as unknown as DialFile;

const ITEMS: DialFile[] = [
  {
    id: 'root',
    name: ROOT_PATH,
    path: ROOT_PATH,
    folderId: '',
    nodeType: DialFileNodeType.FOLDER,
    items: [
      child('b.txt', DialFileNodeType.ITEM, 300),
      child('Zeta', DialFileNodeType.FOLDER),
      child('a.txt', DialFileNodeType.ITEM, 100),
      child('alpha', DialFileNodeType.FOLDER),
    ],
  } as unknown as DialFile,
];

const displayedNames = (api: GridApi): string[] => {
  const names: string[] = [];
  api.forEachNodeAfterFilterAndSort((node) => {
    const name = (node.data as { name?: string } | undefined)?.name;
    if (name) names.push(name);
  });
  return names;
};

const renderManager = async (
  props: Partial<Parameters<typeof DialFileManager>[0]> = {},
): Promise<() => GridApi> => {
  let api: GridApi | undefined;

  render(
    <DialFileManager
      items={ITEMS}
      defaultPath={ROOT_PATH}
      onGridApiChange={(gridApi) => (api = gridApi)}
      {...props}
    />,
  );

  await waitFor(() => expect(api).toBeTruthy());
  await waitFor(() => expect(api!.getDisplayedRowCount()).toBe(4));

  return () => api!;
};

describe('Dial UI Kit :: FileManager sort menu', () => {
  test('lists folders first, by name ascending, by default', async () => {
    const getApi = await renderManager();

    expect(displayedNames(getApi())).toEqual([
      'alpha',
      'Zeta',
      'a.txt',
      'b.txt',
    ]);
  });

  test('reorders the grid when a field and a direction are picked', async () => {
    const onSortChange = vi.fn();
    const getApi = await renderManager({ sortOptions: { onSortChange } });

    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Size' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Sort' }));
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Descending' }),
    );

    expect(onSortChange).toHaveBeenLastCalledWith({
      field: FileManagerSortField.Size,
      direction: FileManagerSortDirection.Desc,
    });
    await waitFor(() =>
      expect(displayedNames(getApi())).toEqual([
        'Zeta',
        'alpha',
        'b.txt',
        'a.txt',
      ]),
    );
  });

  test('follows a controlled sort', async () => {
    const getApi = await renderManager({
      sortOptions: {
        sort: {
          field: FileManagerSortField.Name,
          direction: FileManagerSortDirection.Desc,
        },
      },
    });

    expect(displayedNames(getApi())).toEqual([
      'Zeta',
      'alpha',
      'b.txt',
      'a.txt',
    ]);
  });

  test('hides the menu and keeps the source order when not sortable', async () => {
    const getApi = await renderManager({ sortOptions: { sortable: false } });

    expect(
      screen.queryByRole('button', { name: 'Sort' }),
    ).not.toBeInTheDocument();
    expect(displayedNames(getApi())).toEqual([
      'b.txt',
      'Zeta',
      'a.txt',
      'alpha',
    ]);
  });
});
