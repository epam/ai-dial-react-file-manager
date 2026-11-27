import { DropdownItem } from '@epam/ai-dial-ui-kit';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps, useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DialFile, DialFileNodeType } from '../../../models/file';
import type { FolderDestinationRoot } from '../../../models/folder-destination';
import { FolderNode } from '../../../models/folder-tree';
import { FolderDestinationTree } from '../FolderDestinationTree';

const capturedProps: {
  current: ComponentProps<
    typeof import('../../FileManager/components/FoldersTree/FoldersTree').DialFoldersTree
  > | null;
} = { current: null };

const renderFileRow = (
  file: DialFile,
  onItemClick?: (file: DialFile) => void,
) => (
  <div key={file.path}>
    <button onClick={() => onItemClick?.(file)}>{file.name}</button>
    {file.items?.map((child) => renderFileRow(child, onItemClick))}
  </div>
);

vi.mock(
  '../../FileManager/components/FoldersTree/FoldersTree',
  async (importOriginal) => {
    const actual =
      await importOriginal<
        typeof import('../../FileManager/components/FoldersTree/FoldersTree')
      >();
    return {
      ...actual,
      DialFoldersTree: (
        props: ComponentProps<typeof actual.DialFoldersTree>,
      ) => {
        capturedProps.current = props;
        return (
          <div role="tree">
            {props.items.map((file) => renderFileRow(file, props.onItemClick))}
            {props.emptyStateDescription && (
              <p>{props.emptyStateDescription}</p>
            )}
          </div>
        );
      },
    };
  },
);

const items: FolderNode[] = [
  {
    path: ['Shared'],
    name: 'Shared',
    children: [{ path: ['Shared', 'Data Science'], name: 'Data Science' }],
  },
  { path: ['My workspace'], name: 'My workspace' },
];

const renderTree = (
  props?: Partial<ComponentProps<typeof FolderDestinationTree>>,
) =>
  render(
    <FolderDestinationTree
      items={items}
      searchQuery=""
      onSelectedPathChange={vi.fn()}
      onCreateFolder={vi.fn()}
      {...props}
    />,
  );

describe('FolderDestinationTree', () => {
  it('converts FolderNode[] to DialFile[] with showFiles disabled, wrapped under the root node', () => {
    renderTree();
    expect(capturedProps.current?.showFiles).toBe(false);
    expect(capturedProps.current?.items.map((f) => f.path)).toEqual(['']);
    expect(capturedProps.current?.items[0]?.items?.map((f) => f.path)).toEqual([
      'My workspace',
      'Shared',
    ]);
  });

  it('orders folders by name at every level, regardless of the order given', () => {
    renderTree({
      items: [
        { path: ['zeta'], name: 'zeta' },
        {
          path: ['Alpha'],
          name: 'Alpha',
          children: [
            { path: ['Alpha', 'Report 10'], name: 'Report 10' },
            { path: ['Alpha', 'Report 2'], name: 'Report 2' },
          ],
        },
        { path: ['beta'], name: 'beta' },
      ],
    });
    const rootChildren = capturedProps.current?.items[0]?.items;
    expect(rootChildren?.map((file) => file.name)).toEqual([
      'Alpha',
      'beta',
      'zeta',
    ]);
    expect(rootChildren?.[0]?.items?.map((file) => file.name)).toEqual([
      'Report 2',
      'Report 10',
    ]);
  });

  it('passes the selected path joined as a string', () => {
    renderTree({ selectedPath: ['Shared', 'Data Science'] });
    expect(capturedProps.current?.selectedPath).toBe('Shared/Data Science');
  });

  it('selects a folder when clicked', async () => {
    const onSelectedPathChange = vi.fn();
    renderTree({ onSelectedPathChange });
    await userEvent.click(screen.getByText('Shared'));
    expect(onSelectedPathChange).toHaveBeenCalledWith(['Shared']);
  });

  it('deselects (undefined) when clicking the already-selected folder', async () => {
    const onSelectedPathChange = vi.fn();
    renderTree({ selectedPath: ['Shared'], onSelectedPathChange });
    await userEvent.click(screen.getByText('Shared'));
    expect(onSelectedPathChange).toHaveBeenCalledWith(undefined);
  });

  it('filters the tree to matching folders when searchQuery is set', () => {
    renderTree({ searchQuery: 'data science' });
    expect(capturedProps.current?.items.map((f) => f.path)).toEqual(['']);
    expect(capturedProps.current?.items[0]?.items?.map((f) => f.path)).toEqual([
      'Shared',
    ]);
    expect(
      capturedProps.current?.items[0]?.items?.[0]?.items?.map((f) => f.path),
    ).toEqual(['Shared/Data Science']);
  });

  it('passes the trimmed query to the tree for highlighting while filtering', () => {
    renderTree({ searchQuery: '  data  ' });
    expect(capturedProps.current?.searchQuery).toBe('data');
  });

  it('passes no highlight query without a search', () => {
    renderTree({ searchQuery: '   ' });
    expect(capturedProps.current?.searchQuery).toBeUndefined();
  });

  it('passes a no-results empty state title when search matches nothing, and omits the root node', () => {
    renderTree({ searchQuery: 'zzz_nonexistent_zzz' });
    expect(capturedProps.current?.emptyStateTitle).toBe(
      'No folders match "zzz_nonexistent_zzz".',
    );
    expect(capturedProps.current?.items).toEqual([]);
  });

  describe('creating a folder from a search that matched nothing', () => {
    const startCreatingFromSearch = async (searchQuery: string) => {
      renderTree({ searchQuery });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
    };

    it('renders the tree with the inline create row instead of the empty state', async () => {
      await startCreatingFromSearch('Model releases');
      expect(capturedProps.current?.createdFolderPath).toBe('');
      expect(capturedProps.current?.items.map((file) => file.path)).toEqual([
        '',
      ]);
      expect(capturedProps.current?.emptyStateTitle).toBeUndefined();
    });

    it('pre-fills the new folder name with the unmatched query', async () => {
      await startCreatingFromSearch('  Model releases  ');
      expect(capturedProps.current?.newFolderDefaultName).toBe(
        'Model releases',
      );
    });

    it('falls back to the default name when the query is not a valid folder name', async () => {
      await startCreatingFromSearch('nested/name');
      expect(capturedProps.current?.newFolderDefaultName).toBe('New folder 1');
    });

    it('keeps the default name when the query did match a folder', async () => {
      await startCreatingFromSearch('Shared');
      expect(capturedProps.current?.newFolderDefaultName).toBe('New folder 1');
    });

    it('creates the folder under the selected parent and selects it', async () => {
      const onCreateFolder = vi.fn();
      const onSelectedPathChange = vi.fn();
      renderTree({
        searchQuery: 'Model releases',
        selectedPath: ['Shared'],
        onCreateFolder,
        onSelectedPathChange,
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
      expect(onCreateFolder).toHaveBeenCalledWith(['Shared'], 'Model releases');
      expect(onSelectedPathChange).toHaveBeenCalledWith([
        'Shared',
        'Model releases',
      ]);
    });

    it('restores the filtered empty state when creation is cancelled', async () => {
      await startCreatingFromSearch('Model releases');
      act(() => capturedProps.current?.onCreateFolderCancel?.());
      expect(capturedProps.current?.items).toEqual([]);
      expect(capturedProps.current?.emptyStateTitle).toBe(
        'No folders match "Model releases".',
      );
    });
  });

  describe('per-row context menu (add sibling / add child)', () => {
    const clickMenuItem = (menuItems: DropdownItem[], key: string) =>
      act(() =>
        menuItems
          .find((item) => item.key === key)
          ?.onClick?.({ key, domEvent: {} as never }),
      );

    it('omits "Add sibling" for the root node, since it has no parent', () => {
      renderTree();
      const rootFile: DialFile = {
        path: '',
        name: 'Root',
        folderId: '',
        nodeType: DialFileNodeType.FOLDER,
      };
      const menuItems = capturedProps.current?.getContextMenuItems?.(rootFile);
      expect(menuItems?.map((item) => item.key)).toEqual(['add-child']);
    });

    it('includes both actions for a non-root folder', () => {
      renderTree();
      const sharedFile: DialFile = {
        path: 'Shared',
        name: 'Shared',
        folderId: 'Shared',
        nodeType: DialFileNodeType.FOLDER,
      };
      const menuItems =
        capturedProps.current?.getContextMenuItems?.(sharedFile);
      expect(menuItems?.map((item) => item.key)).toEqual([
        'add-child',
        'add-sibling',
      ]);
    });

    it('"Add child" creates the new folder inside the clicked folder', () => {
      renderTree();
      const sharedFile: DialFile = {
        path: 'Shared',
        name: 'Shared',
        folderId: 'Shared',
        nodeType: DialFileNodeType.FOLDER,
      };
      const menuItems =
        capturedProps.current?.getContextMenuItems?.(sharedFile);
      clickMenuItem(menuItems ?? [], 'add-child');
      expect(capturedProps.current?.createdFolderPath).toBe('Shared');
    });

    it('"Add sibling" creates the new folder alongside the clicked folder', () => {
      renderTree();
      const nestedFile: DialFile = {
        path: 'Shared/Data Science',
        name: 'Data Science',
        folderId: 'Shared/Data Science',
        nodeType: DialFileNodeType.FOLDER,
      };
      const menuItems =
        capturedProps.current?.getContextMenuItems?.(nestedFile);
      clickMenuItem(menuItems ?? [], 'add-sibling');
      expect(capturedProps.current?.createdFolderPath).toBe('Shared');
    });

    it('"Add child" rejects a name equal to the parent folder name (#9792)', () => {
      const onCreateFolder = vi.fn();
      renderTree({ onCreateFolder });
      const sharedFile: DialFile = {
        path: 'Shared',
        name: 'Shared',
        folderId: 'Shared',
        nodeType: DialFileNodeType.FOLDER,
      };
      clickMenuItem(
        capturedProps.current?.getContextMenuItems?.(sharedFile) ?? [],
        'add-child',
      );
      expect(
        capturedProps.current?.onRenameValidate?.('shared', {} as never),
      ).toBe('A folder cannot have the same name as its parent folder.');
      act(() => capturedProps.current?.onCreateFolderSave?.('Shared'));
      expect(onCreateFolder).not.toHaveBeenCalled();
    });

    it('"Add child" never pre-fills the parent folder name', () => {
      renderTree({ newFolderDefaultName: 'Shared' });
      const sharedFile: DialFile = {
        path: 'Shared',
        name: 'Shared',
        folderId: 'Shared',
        nodeType: DialFileNodeType.FOLDER,
      };
      clickMenuItem(
        capturedProps.current?.getContextMenuItems?.(sharedFile) ?? [],
        'add-child',
      );
      expect(capturedProps.current?.newFolderDefaultName).toBe('Shared 1');
    });

    it('lets a top-level folder take the root label as its name', () => {
      renderTree();
      clickMenuItem(
        capturedProps.current?.getContextMenuItems?.({
          path: '',
          name: 'Root',
          folderId: '',
          nodeType: DialFileNodeType.FOLDER,
        }) ?? [],
        'add-child',
      );
      expect(
        capturedProps.current?.onRenameValidate?.('Root', {} as never),
      ).toBeNull();
    });
  });

  describe('canCreateFolderIn', () => {
    /* Only `Shared` and what lies inside it accept new folders. */
    const canCreateFolderIn = ({ path }: { path: string[] }) =>
      path[0] === 'Shared';
    const folder = (path: string): DialFile => ({
      path,
      name: path.split('/').at(-1) ?? path,
      folderId: path,
      nodeType: DialFileNodeType.FOLDER,
    });
    const menuKeys = (path: string) =>
      capturedProps.current
        ?.getContextMenuItems?.(folder(path))
        ?.map((item) => item.key);

    it('offers no "Add child" on a refused folder and no "Add sibling" under a refused parent', () => {
      renderTree({ canCreateFolderIn });

      expect(menuKeys('')).toEqual([]);
      expect(menuKeys('My workspace')).toEqual([]);
      expect(menuKeys('Shared')).toEqual(['add-child']);
      expect(menuKeys('Shared/Data Science')).toEqual([
        'add-child',
        'add-sibling',
      ]);
    });

    it('calls the predicate with a single-root destination', () => {
      const predicate = vi.fn(() => true);
      renderTree({ canCreateFolderIn: predicate });

      menuKeys('Shared/Data Science');

      expect(predicate).toHaveBeenCalledWith({
        rootKey: '',
        path: ['Shared', 'Data Science'],
      });
      expect(predicate).toHaveBeenCalledWith({
        rootKey: '',
        path: ['Shared'],
      });
    });

    it('disables "Create new folder" for a refused parent and enables it for an allowed one', () => {
      const { rerender } = renderTree({ canCreateFolderIn });
      expect(
        screen.getByRole('button', { name: 'Create new folder' }),
      ).toHaveProperty('disabled', true);

      rerender(
        <FolderDestinationTree
          items={items}
          searchQuery=""
          selectedPath={['Shared']}
          onSelectedPathChange={vi.fn()}
          onCreateFolder={vi.fn()}
          canCreateFolderIn={canCreateFolderIn}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Create new folder' }),
      ).toHaveProperty('disabled', false);
    });

    it('renders no "Create new folder" button when every folder is refused', () => {
      renderTree({ canCreateFolderIn: () => false });

      expect(
        screen.queryByRole('button', { name: 'Create new folder' }),
      ).toBeNull();
    });

    it('keeps the button while a nested folder accepts one, whatever is selected', () => {
      renderTree({
        canCreateFolderIn: ({ path }) =>
          path.join('/') === 'Shared/Data Science',
        selectedPath: ['My workspace'],
      });

      expect(
        screen.getByRole('button', { name: 'Create new folder' }),
      ).toHaveProperty('disabled', true);
    });

    it('keeps the button in multi-root mode for the root that accepts one', () => {
      const roots: FolderDestinationRoot[] = [
        { key: 'personal', label: 'Personal', items },
        { key: 'org', label: 'Organization', items },
      ];
      render(
        <FolderDestinationTree
          roots={roots}
          searchQuery=""
          destination={{ rootKey: 'org', path: ['Shared'] }}
          onDestinationChange={vi.fn()}
          onCreateDestinationFolder={vi.fn()}
          canCreateFolderIn={({ rootKey }) => rootKey === 'personal'}
        />,
      );

      expect(
        screen.getByRole('button', { name: 'Create new folder' }),
      ).toHaveProperty('disabled', false);
    });

    it('keeps a refused folder selectable', async () => {
      const onSelectedPathChange = vi.fn();
      renderTree({ canCreateFolderIn, onSelectedPathChange });

      await userEvent.click(
        screen.getByRole('button', { name: 'My workspace' }),
      );

      expect(onSelectedPathChange).toHaveBeenCalledWith(['My workspace']);
    });
  });

  it('lets DialFoldersTree render its inline row directly under the selected folder', async () => {
    renderTree({ selectedPath: ['Shared'] });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(capturedProps.current?.createdFolderPath).toBe('Shared');
    expect(
      capturedProps.current?.items[0]?.items
        ?.find((file) => file.name === 'Shared')
        ?.items?.map((file) => file.name),
    ).toEqual(['Data Science']);
  });

  it('resolves a unique default name when a sibling already uses the default "New folder" name', async () => {
    const itemsWithDefaultNameTaken: FolderNode[] = [
      ...items,
      { path: ['New folder'], name: 'New folder' },
    ];
    renderTree({ items: itemsWithDefaultNameTaken });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(capturedProps.current?.createdFolderPath).toBe('');
    expect(capturedProps.current?.newFolderDefaultName).toBe('New folder 1');
    expect(
      capturedProps.current?.items[0]?.items?.map((file) => file.name),
    ).toEqual(['My workspace', 'New folder', 'Shared']);
  });

  it('confirms a new folder and selects it', async () => {
    const onCreateFolder = vi.fn();
    const onSelectedPathChange = vi.fn();
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onSelectedPathChange,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
    expect(onCreateFolder).toHaveBeenCalledWith(['Shared'], 'Model releases');
    expect(onSelectedPathChange).toHaveBeenCalledWith([
      'Shared',
      'Model releases',
    ]);
  });

  it('rejects a new folder name that collides with a sibling', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Shared'));
    expect(onCreateFolder).not.toHaveBeenCalled();
  });

  it('rejects a new folder name containing a path traversal segment', async () => {
    const onCreateFolder = vi.fn();
    const onSelectedPathChange = vi.fn();
    renderTree({ onCreateFolder, onSelectedPathChange });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('../EscapeFolder'));
    expect(onCreateFolder).not.toHaveBeenCalled();
    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it("runs the host's onValidateFolderName with the trimmed name and the parent destination", async () => {
    const onCreateFolder = vi.fn();
    const onValidateFolderName = vi.fn(() => 'Not allowed here.');
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onValidateFolderName,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(
      capturedProps.current?.onRenameValidate?.(' Reports ', {} as never),
    ).toBe('Not allowed here.');
    expect(onValidateFolderName).toHaveBeenCalledWith('Reports', {
      rootKey: '',
      path: ['Shared'],
    });
    act(() => capturedProps.current?.onCreateFolderSave?.('Reports'));
    expect(onCreateFolder).not.toHaveBeenCalled();
  });

  it('warns about a hidden dot name without blocking its creation', async () => {
    const onCreateFolder = vi.fn();
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      hiddenFolderNameWarning: 'warning__Hidden',
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(
      capturedProps.current?.onRenameValidate?.('.cache', {} as never),
    ).toBe('warning__Hidden');
    act(() => capturedProps.current?.onCreateFolderSave?.('.cache'));
    expect(onCreateFolder).toHaveBeenCalledWith(['Shared'], '.cache');
  });

  it('does not match hidden dot-folders in a search, like the file manager search', () => {
    renderTree({
      items: [
        ...items,
        { path: ['.secrets'], name: '.secrets' },
        {
          path: ['Archive'],
          name: 'Archive',
          children: [
            { path: ['Archive', '.secrets-old'], name: '.secrets-old' },
          ],
        },
      ],
      searchQuery: 'secrets',
    });
    expect(capturedProps.current?.items).toEqual([]);
  });

  it('flags a path-traversal name as invalid via onRenameValidate, which also gates the create-folder row', async () => {
    renderTree();
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(
      capturedProps.current?.onRenameValidate?.('../EscapeFolder', {} as never),
    ).toBe('Folder name contains invalid characters.');
    expect(
      capturedProps.current?.onRenameValidate?.('Model releases', {} as never),
    ).toBeNull();
  });

  it('cancels inline folder creation through the public cancel action', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(capturedProps.current?.createdFolderPath).toBeNull();
    expect(onCreateFolder).not.toHaveBeenCalled();
  });

  it('drops the commits the editor raises on a Cancel press and on its own removal', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.pointerDown(cancel);
    act(() => capturedProps.current?.onCreateFolderSave?.('New folder'));
    await userEvent.click(cancel);
    act(() => capturedProps.current?.onCreateFolderSave?.('New folder'));
    expect(onCreateFolder).not.toHaveBeenCalled();
    expect(capturedProps.current?.createdFolderPath).toBeNull();
  });

  it('drops the blur commit raised when keyboard focus moves from the editor to Cancel', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.focusOut(
      screen.getByRole('button', { name: 'Create new folder' }),
      {
        relatedTarget: cancel,
      },
    );
    fireEvent.focusIn(cancel);
    act(() => capturedProps.current?.onCreateFolderSave?.('New folder'));
    expect(onCreateFolder).not.toHaveBeenCalled();

    cancel.focus();
    await userEvent.keyboard('{Enter}');
    expect(onCreateFolder).not.toHaveBeenCalled();
    expect(capturedProps.current?.createdFolderPath).toBeNull();
  });

  it('commits again once focus returns from Cancel to the editor', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder, selectedPath: ['Shared'] });
    const create = screen.getByRole('button', { name: 'Create new folder' });
    await userEvent.click(create);
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.focusOut(create, { relatedTarget: cancel });
    fireEvent.focusIn(cancel);
    fireEvent.focusOut(cancel);
    fireEvent.focusIn(create);
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
    expect(onCreateFolder).toHaveBeenCalledWith(['Shared'], 'Model releases');
  });

  it('creates a folder again after a cancelled creation', async () => {
    const onCreateFolder = vi.fn();
    renderTree({ onCreateFolder, selectedPath: ['Shared'] });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
    expect(onCreateFolder).toHaveBeenCalledWith(['Shared'], 'Model releases');
  });

  it('supports a custom folder-creation cancel label', async () => {
    renderTree({ cancelCreatingFolderLabel: 'Discard folder' });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );

    expect(screen.getByRole('button', { name: 'Discard folder' })).toBeTruthy();
  });

  it('disables the create-folder trigger when disabled', () => {
    renderTree({ disabled: true });
    expect(
      screen
        .getByRole('button', { name: 'Create new folder' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  describe('root selection', () => {
    it('renders the bucket root as a tree node with the default label', () => {
      renderTree();
      expect(screen.getByText('Root')).toBeTruthy();
    });

    it('renders the bucket root as a tree node with a custom label', () => {
      renderTree({ rootLabel: 'Public bucket' });
      expect(screen.getByText('Public bucket')).toBeTruthy();
    });

    it('selects the root (empty array) when the root node is clicked', async () => {
      const onSelectedPathChange = vi.fn();
      renderTree({ onSelectedPathChange });
      await userEvent.click(screen.getByText('Root'));
      expect(onSelectedPathChange).toHaveBeenCalledWith([]);
    });

    it('deselects (undefined) when clicking the already-selected root node', async () => {
      const onSelectedPathChange = vi.fn();
      renderTree({ selectedPath: [], onSelectedPathChange });
      await userEvent.click(screen.getByText('Root'));
      expect(onSelectedPathChange).toHaveBeenCalledWith(undefined);
    });

    it('passes an empty-string selectedPath to DialFoldersTree when the root is selected', () => {
      renderTree({ selectedPath: [] });
      expect(capturedProps.current?.selectedPath).toBe('');
    });

    it('passes no selectedPath to DialFoldersTree when nothing is selected', () => {
      renderTree();
      expect(capturedProps.current?.selectedPath).toBeUndefined();
    });

    it('always keeps the root node expanded so its children stay visible', () => {
      renderTree({ expandedPaths: new Set() });
      expect(capturedProps.current?.expandedPaths?.has('')).toBe(true);
    });

    it('never forwards the root path key to the host onExpandedPathsChange', () => {
      const onExpandedPathsChange = vi.fn();
      renderTree({ expandedPaths: new Set(), onExpandedPathsChange });
      act(() =>
        capturedProps.current?.onExpandedPathsChange?.(new Set(['', 'Shared'])),
      );
      expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['Shared']));
    });
  });

  describe('externally-controlled expand state', () => {
    it('forwards a host-supplied expandedPaths set to DialFoldersTree, plus the always-expanded root', () => {
      renderTree({ expandedPaths: new Set(['Shared']) });
      expect(capturedProps.current?.expandedPaths).toEqual(
        new Set(['', 'Shared']),
      );
    });

    it('calls the host onExpandedPathsChange instead of managing state internally', () => {
      const onExpandedPathsChange = vi.fn();
      renderTree({
        expandedPaths: new Set(),
        onExpandedPathsChange,
      });

      act(() =>
        capturedProps.current?.onExpandedPathsChange?.(new Set(['Shared'])),
      );

      expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['Shared']));
    });

    it('forwards loadingPaths to DialFoldersTree', () => {
      renderTree({ loadingPaths: new Set(['Shared']) });
      expect(capturedProps.current?.loadingPaths).toEqual(new Set(['Shared']));
    });

    it('falls back to internal expand state when uncontrolled', async () => {
      renderTree({ selectedPath: ['Shared'] });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      expect(capturedProps.current?.createdFolderPath).toBe('Shared');
      expect(capturedProps.current?.expandedPaths).toEqual(
        new Set(['', 'Shared']),
      );
    });
  });

  describe('multi-root mode', () => {
    const roots: FolderDestinationRoot[] = [
      {
        key: 'personal',
        label: 'Personal',
        items: [
          { path: ['zeta'], name: 'zeta' },
          {
            path: ['Design'],
            name: 'Design',
            children: [{ path: ['Design', 'Audit'], name: 'Audit' }],
          },
        ],
      },
      {
        key: 'organization',
        label: 'Organization',
        items: [{ path: ['EPAM'], name: 'EPAM' }],
      },
    ];

    const renderMultiRoot = (
      props?: Partial<ComponentProps<typeof FolderDestinationTree>>,
    ) =>
      render(
        <FolderDestinationTree
          roots={roots}
          searchQuery=""
          onDestinationChange={vi.fn()}
          onCreateDestinationFolder={vi.fn()}
          {...props}
        />,
      );

    describe('collapsible roots', () => {
      it('keeps every root expanded when roots are not collapsible', () => {
        renderMultiRoot();
        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization']),
          ),
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('starts with every root expanded', () => {
        renderMultiRoot({ collapsibleRoots: true });

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('collapses a root when the user collapses it', () => {
        renderMultiRoot({ collapsibleRoots: true });

        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization']),
          ),
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':organization']),
        );
      });

      it('expands a collapsed root again', () => {
        renderMultiRoot({ collapsibleRoots: true });
        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization']),
          ),
        );

        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization', ':personal']),
          ),
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('does not remember a root toggled while a search is active', () => {
        const { rerender } = renderMultiRoot({
          collapsibleRoots: true,
          searchQuery: 'Design',
        });
        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization']),
          ),
        );

        rerender(
          <FolderDestinationTree
            roots={roots}
            searchQuery=""
            collapsibleRoots
            onDestinationChange={vi.fn()}
            onCreateDestinationFolder={vi.fn()}
          />,
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('never forwards a root key to the root onExpandedPathsChange', () => {
        const onExpandedPathsChange = vi.fn();
        renderMultiRoot({
          collapsibleRoots: true,
          roots: roots.map((root) => ({ ...root, onExpandedPathsChange })),
        });

        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':personal', ':personal/Design']),
          ),
        );

        expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['Design']));
      });
    });

    const rootFile = (key: string, name: string): DialFile => ({
      path: `:${key}`,
      name,
      folderId: `:${key}`,
      nodeType: DialFileNodeType.FOLDER,
    });

    describe('starting a folder creation with collapsible roots', () => {
      const clickMenuItem = (menuItems: DropdownItem[], key: string) =>
        act(() =>
          menuItems
            .find((item) => item.key === key)
            ?.onClick?.({ key, domEvent: {} as never }),
        );
      const folderFile = (path: string): DialFile => ({
        path,
        name: path.split('/').at(-1) ?? path,
        folderId: path,
        nodeType: DialFileNodeType.FOLDER,
      });

      it('keeps every root open and shows the editor when adding a child to a folder', () => {
        renderMultiRoot({ collapsibleRoots: true });

        clickMenuItem(
          capturedProps.current?.getContextMenuItems?.(
            folderFile(':personal/Design'),
          ) ?? [],
          'add-child',
        );

        expect(capturedProps.current?.createdFolderPath).toBe(
          ':personal/Design',
        );
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization', ':personal/Design']),
        );
      });

      it('keeps every root open when adding a sibling', () => {
        renderMultiRoot({ collapsibleRoots: true });

        clickMenuItem(
          capturedProps.current?.getContextMenuItems?.(
            folderFile(':personal/Design'),
          ) ?? [],
          'add-sibling',
        );

        expect(capturedProps.current?.createdFolderPath).toBe(':personal');
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('leaves the other roots open when the parent is a root', () => {
        renderMultiRoot({ collapsibleRoots: true });

        clickMenuItem(
          capturedProps.current?.getContextMenuItems?.(
            rootFile('personal', 'Personal'),
          ) ?? [],
          'add-child',
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization']),
        );
      });

      it('keeps a root the user collapsed collapsed, while opening the one holding the parent', () => {
        renderMultiRoot({ collapsibleRoots: true });
        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':personal']),
          ),
        );
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal']),
        );

        clickMenuItem(
          capturedProps.current?.getContextMenuItems?.(
            folderFile(':personal/Design'),
          ) ?? [],
          'add-child',
        );

        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':personal/Design']),
        );
      });

      it('re-opens the root holding the parent when the user had collapsed it', async () => {
        renderMultiRoot({
          collapsibleRoots: true,
          destination: { rootKey: 'personal', path: ['Design'] },
        });
        act(() =>
          capturedProps.current?.onExpandedPathsChange?.(
            new Set([':organization']),
          ),
        );
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':organization']),
        );

        await userEvent.click(
          screen.getByRole('button', { name: 'Create new folder' }),
        );

        expect(capturedProps.current?.createdFolderPath).toBe(
          ':personal/Design',
        );
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set([':personal', ':organization', ':personal/Design']),
        );
      });

      it('keeps the single root open when creating from the trailing button', async () => {
        renderTree({ collapsibleRoots: true, selectedPath: ['Shared'] });

        await userEvent.click(
          screen.getByRole('button', { name: 'Create new folder' }),
        );

        expect(capturedProps.current?.createdFolderPath).toBe('Shared');
        expect(capturedProps.current?.expandedPaths).toEqual(
          new Set(['', 'Shared']),
        );
      });
    });

    it('renders one top-level node per root in the given order, with folders sorted inside each', () => {
      renderMultiRoot();
      expect(capturedProps.current?.items.map((file) => file.name)).toEqual([
        'Personal',
        'Organization',
      ]);
      expect(
        capturedProps.current?.items[0]?.items?.map((file) => file.name),
      ).toEqual(['Design', 'zeta']);
    });

    it('keeps every root expanded', () => {
      renderMultiRoot();
      expect(capturedProps.current?.expandedPaths).toEqual(
        new Set([':personal', ':organization']),
      );
    });

    it('reports a folder selection as a destination under its root', async () => {
      const onDestinationChange = vi.fn();
      renderMultiRoot({ onDestinationChange });
      await userEvent.click(screen.getByRole('button', { name: 'EPAM' }));
      expect(onDestinationChange).toHaveBeenCalledWith({
        rootKey: 'organization',
        path: ['EPAM'],
      });
    });

    it('reports a root selection as an empty path', async () => {
      const onDestinationChange = vi.fn();
      renderMultiRoot({ onDestinationChange });
      await userEvent.click(screen.getByRole('button', { name: 'Personal' }));
      expect(onDestinationChange).toHaveBeenCalledWith({
        rootKey: 'personal',
        path: [],
      });
    });

    it('highlights the selected destination', () => {
      renderMultiRoot({
        destination: { rootKey: 'personal', path: ['Design', 'Audit'] },
      });
      expect(capturedProps.current?.selectedPath).toBe(
        ':personal/Design/Audit',
      );
    });

    it('filters across all roots', () => {
      renderMultiRoot({ searchQuery: 'aud' });
      expect(capturedProps.current?.items.map((file) => file.name)).toEqual([
        'Personal',
      ]);
    });

    it('creates a folder under the selected root and reports it with the root key', async () => {
      const onCreateDestinationFolder = vi.fn();
      const onDestinationChange = vi.fn();
      renderMultiRoot({
        destination: { rootKey: 'personal', path: ['Design'] },
        onCreateDestinationFolder,
        onDestinationChange,
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      expect(capturedProps.current?.createdFolderPath).toBe(':personal/Design');
      act(() => capturedProps.current?.onCreateFolderSave?.('Reviews'));
      expect(onCreateDestinationFolder).toHaveBeenCalledWith(
        'personal',
        ['Design'],
        'Reviews',
      );
      expect(onDestinationChange).toHaveBeenCalledWith({
        rootKey: 'personal',
        path: ['Design', 'Reviews'],
      });
    });

    it('validates a new name against siblings inside the same root', async () => {
      renderMultiRoot({ destination: { rootKey: 'personal', path: [] } });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      expect(
        capturedProps.current?.onRenameValidate?.('design', {} as never),
      ).toBe('A folder with this name already exists.');
      expect(
        capturedProps.current?.onRenameValidate?.('EPAM', {} as never),
      ).toBeNull();
      expect(
        capturedProps.current?.onRenameValidate?.('Personal', {} as never),
      ).toBeNull();
    });

    it('rejects a nested folder named like its parent inside a root', async () => {
      renderMultiRoot({
        destination: { rootKey: 'personal', path: ['Design'] },
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      expect(
        capturedProps.current?.onRenameValidate?.('design', {} as never),
      ).toBe('A folder cannot have the same name as its parent folder.');
    });

    it('rejects a nested duplicate whose sibling loads after the editor opened', async () => {
      const onCreateDestinationFolder = vi.fn();
      const unloaded: FolderDestinationRoot[] = [
        {
          key: 'personal',
          label: 'Personal',
          items: [{ path: ['Design'], name: 'Design' }],
        },
      ];
      const { rerender } = renderMultiRoot({
        roots: unloaded,
        destination: { rootKey: 'personal', path: ['Design'] },
        onCreateDestinationFolder,
      });
      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      // The editor keeps the callbacks it opened with.
      const { onRenameValidate, onCreateFolderSave } = capturedProps.current!;

      rerender(
        <FolderDestinationTree
          searchQuery=""
          roots={[
            {
              ...unloaded[0],
              items: [
                {
                  path: ['Design'],
                  name: 'Design',
                  children: [{ path: ['Design', 'Audit'], name: 'Audit' }],
                },
              ],
            },
          ]}
          destination={{ rootKey: 'personal', path: ['Design'] }}
          onDestinationChange={vi.fn()}
          onCreateDestinationFolder={onCreateDestinationFolder}
        />,
      );

      expect(onRenameValidate?.('audit', {} as never)).toBe(
        'A folder with this name already exists.',
      );
      act(() => onCreateFolderSave?.('Audit'));
      expect(onCreateDestinationFolder).not.toHaveBeenCalled();
    });

    it('opens the new-folder editor only once the parent has loaded, so an existing child is a duplicate', async () => {
      const onCreateDestinationFolder = vi.fn();
      const design: FolderDestinationRoot = {
        key: 'personal',
        label: 'Personal',
        items: [{ path: ['Design'], name: 'Design' }],
        loadingPaths: new Set(['Design']),
      };
      const renderWith = (root: FolderDestinationRoot) => (
        <FolderDestinationTree
          searchQuery=""
          roots={[root]}
          destination={{ rootKey: 'personal', path: ['Design'] }}
          onDestinationChange={vi.fn()}
          onCreateDestinationFolder={onCreateDestinationFolder}
        />
      );
      const { rerender } = render(renderWith(design));

      await userEvent.click(
        screen.getByRole('button', { name: 'Create new folder' }),
      );
      expect(capturedProps.current?.createdFolderPath).toBeNull();

      rerender(
        renderWith({
          ...design,
          loadingPaths: new Set(),
          items: [
            {
              path: ['Design'],
              name: 'Design',
              children: [
                { path: ['Design', 'New folder'], name: 'New folder' },
              ],
            },
          ],
        }),
      );

      expect(capturedProps.current?.createdFolderPath).toBe(':personal/Design');
      expect(capturedProps.current?.newFolderDefaultName).toBe('New folder 1');
      expect(
        capturedProps.current?.onRenameValidate?.('new folder', {} as never),
      ).toBe('A folder with this name already exists.');
      act(() => capturedProps.current?.onCreateFolderSave?.('New folder'));
      expect(onCreateDestinationFolder).not.toHaveBeenCalled();
    });

    it('omits "Add sibling" on a root node', () => {
      renderMultiRoot();
      const menuItems = capturedProps.current?.getContextMenuItems?.(
        rootFile('organization', 'Organization'),
      );
      expect(menuItems?.map((item) => item.key)).toEqual(['add-child']);
    });

    it('offers no creation under a root that does not accept folders', () => {
      renderMultiRoot({
        roots: [roots[0], { ...roots[1], canCreateFolders: false }],
        destination: { rootKey: 'organization', path: ['EPAM'] },
      });
      expect(
        capturedProps.current?.getContextMenuItems?.(
          rootFile('organization', 'Organization'),
        ),
      ).toEqual([]);
      // The trailing button falls back to the first root that accepts folders.
      expect(
        screen.getByRole('button', { name: 'Create new folder' }),
      ).toHaveProperty('disabled', false);
    });

    it('renders no trailing create button when no root accepts folders', () => {
      renderMultiRoot({
        roots: roots.map((root) => ({ ...root, canCreateFolders: false })),
      });
      expect(
        screen.queryByRole('button', { name: 'Create new folder' }),
      ).toBeNull();
    });

    describe('canCreateFolderIn', () => {
      /* Organization accepts folders only inside `EPAM`; Personal accepts them anywhere. */
      const canCreateFolderIn = ({
        rootKey,
        path,
      }: {
        rootKey: string;
        path: string[];
      }) => rootKey !== 'organization' || path[0] === 'EPAM';

      it('passes the root key and the path inside that root', () => {
        const predicate = vi.fn(() => true);
        renderMultiRoot({ canCreateFolderIn: predicate });

        capturedProps.current?.getContextMenuItems?.({
          path: ':organization/EPAM',
          name: 'EPAM',
          folderId: ':organization/EPAM',
          nodeType: DialFileNodeType.FOLDER,
        });

        expect(predicate).toHaveBeenCalledWith({
          rootKey: 'organization',
          path: ['EPAM'],
        });
      });

      it('offers no creation on a refused root and allows it inside an allowed folder', () => {
        renderMultiRoot({ canCreateFolderIn });

        expect(
          capturedProps.current?.getContextMenuItems?.(
            rootFile('organization', 'Organization'),
          ),
        ).toEqual([]);
        expect(
          capturedProps.current
            ?.getContextMenuItems?.({
              path: ':organization/EPAM',
              name: 'EPAM',
              folderId: ':organization/EPAM',
              nodeType: DialFileNodeType.FOLDER,
            })
            ?.map((item) => item.key),
        ).toEqual(['add-child']);
      });

      it('falls back the trailing create button to the first root the predicate allows', async () => {
        renderMultiRoot({
          roots: [roots[1], roots[0]],
          canCreateFolderIn,
        });

        await userEvent.click(
          screen.getByRole('button', { name: 'Create new folder' }),
        );

        await waitFor(() =>
          expect(capturedProps.current?.createdFolderPath).toBe(':personal'),
        );
      });

      it('renders no trailing create button when the predicate refuses every root', () => {
        renderMultiRoot({ canCreateFolderIn: () => false });

        expect(
          screen.queryByRole('button', { name: 'Create new folder' }),
        ).toBeNull();
      });
    });

    it("splits expanded keys back to each root's own handler", () => {
      const onPersonalExpanded = vi.fn();
      const onOrganizationExpanded = vi.fn();
      renderMultiRoot({
        roots: [
          { ...roots[0], onExpandedPathsChange: onPersonalExpanded },
          { ...roots[1], onExpandedPathsChange: onOrganizationExpanded },
        ],
      });
      act(() =>
        capturedProps.current?.onExpandedPathsChange?.(
          new Set([':personal', ':personal/Design', ':organization/EPAM']),
        ),
      );
      expect(onPersonalExpanded).toHaveBeenCalledWith(new Set(['Design']));
      expect(onOrganizationExpanded).toHaveBeenCalledWith(new Set(['EPAM']));
    });

    it("joins each root's loading and expanded keys", () => {
      renderMultiRoot({
        roots: [
          {
            ...roots[0],
            expandedPaths: new Set(['Design']),
            loadingPaths: new Set(['Design']),
          },
          roots[1],
        ],
      });
      expect(capturedProps.current?.loadingPaths).toEqual(
        new Set([':personal/Design']),
      );
      expect(capturedProps.current?.expandedPaths).toEqual(
        new Set([':personal', ':organization', ':personal/Design']),
      );
    });
  });
});

describe('FolderDestinationTree folder creation outcome and disabled state', () => {
  it('selects the new folder only after an async create succeeds', async () => {
    let resolveCreate: () => void = () => undefined;
    const onCreateFolder = vi.fn(
      () => new Promise<void>((resolve) => (resolveCreate = resolve)),
    );
    const onSelectedPathChange = vi.fn();
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onSelectedPathChange,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));

    expect(onSelectedPathChange).not.toHaveBeenCalled();
    await act(async () => resolveCreate());
    expect(onSelectedPathChange).toHaveBeenCalledWith([
      'Shared',
      'Model releases',
    ]);
  });

  it('does not select the new folder and reports the error when the create rejects', async () => {
    const failure = new Error('create failed');
    const onCreateFolder = vi.fn().mockRejectedValue(failure);
    const onCreateFolderError = vi.fn();
    const onSelectedPathChange = vi.fn();
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onCreateFolderError,
      onSelectedPathChange,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    await act(async () =>
      capturedProps.current?.onCreateFolderSave?.('Model releases'),
    );

    expect(onCreateFolderError).toHaveBeenCalledWith(failure);
    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it('makes the whole tree inert when disabled', () => {
    renderTree({ disabled: true });
    expect(
      screen.getByRole('tree', { hidden: true }).closest('[inert]'),
    ).not.toBeNull();
  });

  it('keeps a root key containing a slash from splitting its token', () => {
    const onDestinationChange = vi.fn();
    render(
      <FolderDestinationTree
        searchQuery=""
        roots={[
          {
            key: 'org/team',
            label: 'Team',
            items: [{ path: ['Reports'], name: 'Reports' }],
          },
        ]}
        onDestinationChange={onDestinationChange}
      />,
    );
    return userEvent.click(screen.getByText('Reports')).then(() => {
      expect(onDestinationChange).toHaveBeenCalledWith({
        rootKey: 'org/team',
        path: ['Reports'],
      });
    });
  });

  it('waits for a late loading flag before opening the editor under a parent with unknown children', async () => {
    const lazyItems: FolderNode[] = [{ path: ['Lazy'], name: 'Lazy' }];
    const Host = () => {
      const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
      return (
        <FolderDestinationTree
          items={lazyItems}
          searchQuery=""
          selectedPath={['Lazy']}
          loadingPaths={loadingPaths}
          onExpandedPathsChange={() =>
            /* The host flags the listing as loading from a later task, not in the expand handler. */
            void setTimeout(() => setLoadingPaths(new Set(['Lazy'])), 0)
          }
        />
      );
    };
    render(<Host />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    expect(capturedProps.current?.createdFolderPath).toBeFalsy();
  });
});

describe('FolderDestinationTree late create results', () => {
  it('does not override a folder the user picked while the create was in flight', async () => {
    let resolveCreate: () => void = () => undefined;
    const onCreateFolder = vi.fn(
      () => new Promise<void>((resolve) => (resolveCreate = resolve)),
    );
    const onSelectedPathChange = vi.fn();
    renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onSelectedPathChange,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
    await userEvent.click(screen.getByText('My workspace'));
    onSelectedPathChange.mockClear();

    await act(async () => resolveCreate());
    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it('does not select after the tree unmounted', async () => {
    let resolveCreate: () => void = () => undefined;
    const onCreateFolder = vi.fn(
      () => new Promise<void>((resolve) => (resolveCreate = resolve)),
    );
    const onSelectedPathChange = vi.fn();
    const { unmount } = renderTree({
      selectedPath: ['Shared'],
      onCreateFolder,
      onSelectedPathChange,
    });
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    act(() => capturedProps.current?.onCreateFolderSave?.('Model releases'));
    unmount();

    await act(async () => resolveCreate());
    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it('opens the editor once the late loading flag has come and gone', async () => {
    const lazyItems: FolderNode[] = [{ path: ['Lazy'], name: 'Lazy' }];
    const Host = () => {
      const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
      return (
        <>
          <button onClick={() => setLoadingPaths(new Set())}>
            Finish loading
          </button>
          <FolderDestinationTree
            items={lazyItems}
            searchQuery=""
            selectedPath={['Lazy']}
            loadingPaths={loadingPaths}
            onExpandedPathsChange={() => {
              /* The host flags the listing as loading from a later task, not in the expand handler. */
              setTimeout(() => setLoadingPaths(new Set(['Lazy'])), 0);
            }}
          />
        </>
      );
    };
    render(<Host />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Create new folder' }),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(capturedProps.current?.createdFolderPath).toBeFalsy();

    await userEvent.click(
      screen.getByRole('button', { name: 'Finish loading' }),
    );
    await waitFor(() =>
      expect(capturedProps.current?.createdFolderPath).toBe('Lazy'),
    );
  });
});

describe('FolderDestinationTree per-row disabled state', () => {
  const sharedFile = (): DialFile => ({
    path: 'Shared',
    name: 'Shared',
    folderId: 'Shared',
    nodeType: DialFileNodeType.FOLDER,
  });
  const reasonFor = (file: DialFile | undefined) =>
    file ? capturedProps.current?.getDisabledTooltip?.(file) : undefined;

  it('passes no tooltip callback to the tree without getDisabledReason', () => {
    renderTree();

    expect(capturedProps.current?.getDisabledTooltip).toBeUndefined();
  });

  it('asks the host about a single-root folder with an empty root key', () => {
    const getDisabledReason = vi.fn(() => 'No access');
    renderTree({ getDisabledReason });

    expect(reasonFor(sharedFile())).toBe('No access');
    expect(getDisabledReason).toHaveBeenCalledWith({
      rootKey: '',
      path: ['Shared'],
    });
  });

  it('asks about the single-root root itself with an empty path', () => {
    const getDisabledReason = vi.fn(() => undefined);
    renderTree({ getDisabledReason });

    reasonFor(capturedProps.current?.items[0]);

    expect(getDisabledReason).toHaveBeenCalledWith({ rootKey: '', path: [] });
  });

  it('treats an empty reason as enabled', () => {
    renderTree({ getDisabledReason: () => '' });

    expect(reasonFor(sharedFile())).toBeUndefined();
  });

  it('does not select a disabled folder', () => {
    const onSelectedPathChange = vi.fn();
    renderTree({
      onSelectedPathChange,
      getDisabledReason: ({ path }) =>
        path[0] === 'Shared' ? 'No access' : undefined,
    });

    act(() => capturedProps.current?.onItemClick?.(sharedFile()));

    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it('keeps a child of a disabled folder selectable', () => {
    const onSelectedPathChange = vi.fn();
    renderTree({
      onSelectedPathChange,
      getDisabledReason: ({ path }) =>
        path.length === 1 && path[0] === 'Shared' ? 'No access' : undefined,
    });

    act(() =>
      capturedProps.current?.onItemClick?.({
        path: 'Shared/Data Science',
        name: 'Data Science',
        folderId: 'Shared/Data Science',
        nodeType: DialFileNodeType.FOLDER,
      }),
    );

    expect(onSelectedPathChange).toHaveBeenCalledWith([
      'Shared',
      'Data Science',
    ]);
  });

  it('lets the whole-tree disabled win over a row the host leaves enabled', () => {
    const onSelectedPathChange = vi.fn();
    renderTree({
      onSelectedPathChange,
      disabled: true,
      getDisabledReason: () => undefined,
    });

    act(() => capturedProps.current?.onItemClick?.(sharedFile()));

    expect(onSelectedPathChange).not.toHaveBeenCalled();
  });

  it('offers no folder creation under a disabled folder', () => {
    renderTree({
      getDisabledReason: ({ path }) =>
        path[0] === 'Shared' ? 'No access' : undefined,
    });

    expect(capturedProps.current?.getContextMenuItems?.(sharedFile())).toEqual(
      [],
    );
  });

  it('disables the create button when the selected folder is disabled', () => {
    renderTree({
      selectedPath: ['Shared'],
      getDisabledReason: ({ path }) =>
        path[0] === 'Shared' ? 'No access' : undefined,
    });

    expect(
      screen
        .getByRole('button', { name: 'Create new folder' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('maps a multi-root folder to its root key and path', () => {
    const getDisabledReason = vi.fn(() => 'No access');
    render(
      <FolderDestinationTree
        roots={[
          {
            key: 'organization',
            label: 'Organization',
            items: [{ path: ['EPAM'], name: 'EPAM' }],
          },
        ]}
        searchQuery=""
        getDisabledReason={getDisabledReason}
      />,
    );

    reasonFor({
      path: ':organization/EPAM',
      name: 'EPAM',
      folderId: ':organization/EPAM',
      nodeType: DialFileNodeType.FOLDER,
    });

    expect(getDisabledReason).toHaveBeenCalledWith({
      rootKey: 'organization',
      path: ['EPAM'],
    });
  });
});
