import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DialFoldersTree } from './FoldersTree';
import { DialFileNodeType } from '@/models/file';

const mockItems = [
  {
    name: 'Root',
    path: '/root',
    nodeType: DialFileNodeType.FOLDER,
    folderId: '1',
    items: [
      {
        name: 'Subfolder',
        path: '/root/Subfolder',
        nodeType: DialFileNodeType.FOLDER,
        folderId: '2',
        items: [
          {
            name: 'File.txt',
            path: '/root/Subfolder/File.txt',
            nodeType: DialFileNodeType.ITEM,
            folderId: '3',
          },
        ],
      },
    ],
  },
];

const getMenu = vi.fn(() => [
  { key: 'copy', label: 'Copy', icon: <span>copy-icon</span> },
]);

describe('Dial UI Kit :: DialFoldersTree', () => {
  test('renders folders', () => {
    render(<DialFoldersTree items={mockItems} getContextMenuItems={getMenu} />);
    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();
  });

  test('expands folder on click', () => {
    const onToggleFolder = vi.fn();
    render(
      <DialFoldersTree
        items={mockItems}
        onItemClick={onToggleFolder}
        getContextMenuItems={getMenu}
      />,
    );
    fireEvent.click(screen.getByText('Root'));
    expect(onToggleFolder).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Root' }),
    );
  });

  test('only expands a folder from its caret when selectOnCaretClick is false', () => {
    const onItemClick = vi.fn();
    render(
      <DialFoldersTree
        items={mockItems}
        onItemClick={onItemClick}
        selectOnCaretClick={false}
      />,
    );

    // The caret is a decorative icon with no role of its own.
    const caret = screen
      .getByRole('treeitem', { name: 'Root' })
      .querySelector('svg');
    fireEvent.click(caret!);

    expect(screen.getByText('Subfolder')).toBeInTheDocument();
    expect(onItemClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText('Root'));
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Root' }),
    );
  });

  test('draws the hover tint on a caret only while the caret is visible', () => {
    const emptyFolder = [
      {
        name: 'Empty',
        path: '/empty',
        nodeType: DialFileNodeType.FOLDER,
        folderId: '9',
        items: [],
      },
    ];
    const caretBox = () =>
      screen.getByRole('treeitem', { name: 'Empty' }).querySelector('svg')!
        .parentElement!;
    const { rerender } = render(<DialFoldersTree items={emptyFolder} />);
    expect(caretBox().className).toContain('hover:before:bg-');

    rerender(
      <DialFoldersTree items={emptyFolder} loadedPaths={new Set(['/empty'])} />,
    );
    expect(caretBox().className).not.toContain('hover:before:bg-');
  });

  test('by default the caret only toggles a folder, open or closed, and never selects it', () => {
    const onItemClick = vi.fn();
    render(<DialFoldersTree items={mockItems} onItemClick={onItemClick} />);

    // The caret is a decorative icon with no role of its own.
    const caret = () =>
      // eslint-disable-next-line testing-library/no-node-access
      screen.getByRole('treeitem', { name: 'Root' }).querySelector('svg')!;

    fireEvent.click(caret());
    expect(screen.getByText('Subfolder')).toBeInTheDocument();

    fireEvent.click(caret());
    expect(screen.queryByText('Subfolder')).not.toBeInTheDocument();
    expect(onItemClick).not.toHaveBeenCalled();
  });

  test('clicking a row opens the folder: expands a closed one, never collapses an open one', () => {
    const onItemClick = vi.fn();
    render(<DialFoldersTree items={mockItems} onItemClick={onItemClick} />);

    fireEvent.click(screen.getByText('Root'));
    expect(screen.getByText('Subfolder')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Root'));
    expect(screen.getByText('Subfolder')).toBeInTheDocument();
    expect(onItemClick).toHaveBeenCalledTimes(2);
  });

  test('hides the context menu button but keeps the right-click menu when showContextMenuButton is false', () => {
    const { rerender } = render(
      <DialFoldersTree items={mockItems} getContextMenuItems={getMenu} />,
    );
    expect(screen.getAllByRole('button')).toHaveLength(1);

    rerender(
      <DialFoldersTree
        items={mockItems}
        getContextMenuItems={getMenu}
        showContextMenuButton={false}
      />,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('keeps inline item actions when showContextMenuButton is false', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        getContextMenuItems={getMenu}
        showContextMenuButton={false}
        renderItemActions={(item) => (
          <button type="button" aria-label={`Delete ${item.name}`} />
        )}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: /^Delete / }),
    ).toBeInTheDocument();
  });

  test('shows subfolders when expanded', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root'])}
        getContextMenuItems={getMenu}
      />,
    );
    expect(screen.getByText('Subfolder')).toBeInTheDocument();
  });

  test('shows files when showFiles is true', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        showFiles
        getContextMenuItems={getMenu}
      />,
    );
    expect(screen.getByText('File.txt')).toBeInTheDocument();
  });

  test('reserves the caret slot on a file row so file and folder icons line up', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        showFiles
      />,
    );

    /* Layout-only: no semantic query reaches the decorative slot. */
    const slotOf = (name: string) =>
      // eslint-disable-next-line testing-library/no-node-access
      screen
        .getByRole('treeitem', { name })
        .querySelector('span[aria-hidden][style*="width"]');

    expect(slotOf('File.txt')).toHaveStyle({ width: '10px' });
    expect(slotOf('Subfolder')).toBeNull();
  });

  test('does not show files when showFiles is false', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        showFiles={false}
        getContextMenuItems={getMenu}
      />,
    );
    expect(screen.queryByText('File.txt')).not.toBeInTheDocument();
  });

  test('renders empty state', () => {
    render(<DialFoldersTree items={[]} emptyStateTitle="No folders" />);
    expect(screen.getByText('No folders')).toBeInTheDocument();
  });

  test('calls getContextMenuItems for each node', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root'])}
        getContextMenuItems={getMenu}
      />,
    );
    expect(getMenu).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Root' }),
    );
    expect(getMenu).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Subfolder' }),
    );
  });

  test('renders root item with custom label when rootItemLabel is provided', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        rootItemPath="/root"
        rootItemLabel="Custom Root Label"
        expandedPaths={new Set(['/root'])}
      />,
    );

    expect(screen.getByText('Custom Root Label')).toBeInTheDocument();

    expect(screen.queryByText('Root')).not.toBeInTheDocument();
  });

  test('renders shared icon for folders included in sharedByMePaths', () => {
    const sharedPaths = new Set(['/root/Subfolder']);

    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        sharedByMePaths={sharedPaths}
        getContextMenuItems={getMenu}
      />,
    );

    expect(screen.getByText('Subfolder')).toBeInTheDocument();

    const sharedLabel = screen.getByText('Shared');
    expect(sharedLabel).toBeInTheDocument();
  });

  test('does not render shared icon when folder is not shared', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        sharedByMePaths={new Set()}
        getContextMenuItems={getMenu}
      />,
    );

    expect(screen.queryByText('Shared')).not.toBeInTheDocument();
  });

  test('renders inline item actions only for nodes that return them', () => {
    const onDelete = vi.fn();
    render(
      <DialFoldersTree
        items={mockItems}
        showFiles
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        renderItemActions={(item) =>
          item.nodeType === DialFileNodeType.ITEM ? (
            <button aria-label={`Delete ${item.name}`} onClick={onDelete} />
          ) : null
        }
      />,
    );

    expect(screen.getAllByRole('button', { name: /^Delete/ })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Delete File.txt' }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('draws the icon from getItemIcon instead of the type icon, only for the rows that return one', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        getItemIcon={(item) =>
          item.path === '/root/Subfolder' ? (
            <svg data-testid="unit-icon" />
          ) : undefined
        }
      />,
    );

    const icons = screen.getAllByTestId('unit-icon');
    expect(icons).toHaveLength(1);
    expect(
      screen.getByRole('treeitem', { name: 'Subfolder' }),
    ).toContainElement(icons[0]);
    expect(screen.getByRole('treeitem', { name: 'Root' })).not.toContainElement(
      icons[0],
    );
  });

  test('keeps default icons when getItemIcon is not set', () => {
    render(
      <DialFoldersTree items={mockItems} expandedPaths={new Set(['/root'])} />,
    );

    expect(screen.queryByTestId('unit-icon')).not.toBeInTheDocument();
    expect(
      screen.getByRole('treeitem', { name: 'Subfolder' }).querySelector('svg'),
    ).toBeInTheDocument();
  });

  describe('tree semantics and keyboard', () => {
    const allExpanded = new Set(['/root', '/root/Subfolder']);

    test('exposes a labelled tree whose rows are treeitems', () => {
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          ariaLabel="Skill files"
        />,
      );
      expect(screen.getByRole('tree', { name: 'Skill files' })).toBeVisible();
      const root = screen.getByRole('treeitem', { name: 'Root' });
      expect(root).toHaveAttribute('aria-expanded', 'true');
      expect(root).toHaveAttribute('aria-level', '1');
      const file = screen.getByRole('treeitem', { name: 'File.txt' });
      expect(file).not.toHaveAttribute('aria-expanded');
      expect(file).toHaveAttribute('aria-level', '3');
    });

    test('marks only the selected row as selected and makes it the tab stop', () => {
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          selectedPath="/root/Subfolder/File.txt"
        />,
      );
      const file = screen.getByRole('treeitem', { name: 'File.txt' });
      expect(file).toHaveAttribute('aria-selected', 'true');
      expect(file).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('treeitem', { name: 'Root' })).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });

    test('autoFocus focuses the selected row on mount', () => {
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          selectedPath="/root/Subfolder/File.txt"
          autoFocus
        />,
      );
      expect(screen.getByRole('treeitem', { name: 'File.txt' })).toHaveFocus();
    });

    test('Arrow Down/Up and Home/End move focus between visible rows', () => {
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          autoFocus
        />,
      );
      const root = screen.getByRole('treeitem', { name: 'Root' });
      expect(root).toHaveFocus();
      fireEvent.keyDown(root, { key: 'ArrowDown' });
      expect(screen.getByRole('treeitem', { name: 'Subfolder' })).toHaveFocus();
      fireEvent.keyDown(document.activeElement!, { key: 'End' });
      expect(screen.getByRole('treeitem', { name: 'File.txt' })).toHaveFocus();
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
      expect(screen.getByRole('treeitem', { name: 'Subfolder' })).toHaveFocus();
      fireEvent.keyDown(document.activeElement!, { key: 'Home' });
      expect(root).toHaveFocus();
    });

    test('Arrow Right expands a collapsed folder, Arrow Left collapses it', () => {
      const onExpandedPathsChange = vi.fn();
      const { rerender } = render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={new Set()}
          onExpandedPathsChange={onExpandedPathsChange}
          autoFocus
        />,
      );
      const root = screen.getByRole('treeitem', { name: 'Root' });
      fireEvent.keyDown(root, { key: 'ArrowRight' });
      expect(onExpandedPathsChange).toHaveBeenLastCalledWith(
        new Set(['/root']),
      );

      rerender(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={new Set(['/root'])}
          onExpandedPathsChange={onExpandedPathsChange}
          autoFocus
        />,
      );
      fireEvent.keyDown(root, { key: 'ArrowLeft' });
      expect(onExpandedPathsChange).toHaveBeenLastCalledWith(new Set());
    });

    test('Arrow Right on an expanded folder moves to its first child; Arrow Left returns to the parent', () => {
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          autoFocus
        />,
      );
      const root = screen.getByRole('treeitem', { name: 'Root' });
      fireEvent.keyDown(root, { key: 'ArrowRight' });
      expect(screen.getByRole('treeitem', { name: 'Subfolder' })).toHaveFocus();
      fireEvent.keyDown(document.activeElement!, { key: 'End' });
      fireEvent.keyDown(document.activeElement!, { key: 'ArrowLeft' });
      expect(screen.getByRole('treeitem', { name: 'Subfolder' })).toHaveFocus();
    });

    test('Enter activates a file row like a click', () => {
      const onItemClick = vi.fn();
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={allExpanded}
          showFiles
          onItemClick={onItemClick}
        />,
      );
      fireEvent.keyDown(screen.getByRole('treeitem', { name: 'File.txt' }), {
        key: 'Enter',
      });
      expect(onItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/root/Subfolder/File.txt' }),
      );
    });

    test('Space on a folder row reports the click and toggles it', () => {
      const onItemClick = vi.fn();
      const onExpandedPathsChange = vi.fn();
      render(
        <DialFoldersTree
          items={mockItems}
          expandedPaths={new Set()}
          onItemClick={onItemClick}
          onExpandedPathsChange={onExpandedPathsChange}
        />,
      );
      fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Root' }), {
        key: ' ',
      });
      expect(onItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ path: '/root' }),
      );
      expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['/root']));
    });

    test('Escape calls onEscape', () => {
      const onEscape = vi.fn();
      render(<DialFoldersTree items={mockItems} onEscape={onEscape} />);
      fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Root' }), {
        key: 'Escape',
      });
      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    test('an empty tree renders its empty state without a tree role', () => {
      render(<DialFoldersTree items={[]} emptyStateTitle="No folders" />);
      expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    });
  });
});

describe('Dial UI Kit :: DialFoldersTree — context menu button name', () => {
  test('names the row "more" button "More actions" by default', () => {
    render(<DialFoldersTree items={mockItems} getContextMenuItems={getMenu} />);

    expect(
      screen.getByRole('button', { name: 'More actions' }),
    ).toBeInTheDocument();
  });

  test('names the row "more" button with contextMenuButtonLabel', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        getContextMenuItems={getMenu}
        contextMenuButtonLabel="Weitere Aktionen"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Weitere Aktionen' }),
    ).toBeInTheDocument();
  });
});

describe('Dial UI Kit :: DialFoldersTree — rows without a menu', () => {
  test('gives a menu-less row no popup attributes', () => {
    render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        showFiles
      />,
    );

    const file = screen.getByRole('treeitem', { name: 'File.txt' });
    expect(file).not.toHaveAttribute('aria-haspopup');
    expect(file).not.toHaveAttribute('aria-expanded');
  });
});

describe('Dial UI Kit :: DialFoldersTree — search highlight', () => {
  test('marks the matching part of each row name', () => {
    const { container } = render(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root'])}
        searchQuery="sub"
      />,
    );
    const marks = [...container.querySelectorAll('mark')];
    expect(marks.map((mark) => mark.textContent)).toEqual(['Sub']);
    expect(
      screen.getByRole('treeitem', { name: 'Subfolder' }).textContent,
    ).toContain('Subfolder');
  });

  test('renders plain names without a query', () => {
    const { container } = render(
      <DialFoldersTree items={mockItems} expandedPaths={new Set(['/root'])} />,
    );
    expect(container.querySelector('mark')).toBeNull();
  });

  test('leaves the root row unmarked', () => {
    const { container } = render(
      <DialFoldersTree
        items={mockItems}
        rootItemPath="/root"
        rootItemLabel="Root"
        expandedPaths={new Set(['/root'])}
        searchQuery="root"
      />,
    );
    expect(container.querySelector('mark')).toBeNull();
  });
});

describe('Dial UI Kit :: DialFoldersTree — disabled rows', () => {
  const REASON = 'You have no access to save here';
  const getDisabledTooltip = (item: { path: string }) =>
    item.path === '/root' ? REASON : undefined;

  const renderTree = (props = {}) =>
    render(
      <DialFoldersTree
        items={mockItems}
        showFiles
        expandedPaths={new Set(['/root', '/root/Subfolder'])}
        getDisabledTooltip={getDisabledTooltip}
        {...props}
      />,
    );

  test('marks only the row with a reason as disabled and describes it', () => {
    renderTree();

    const disabled = screen.getByRole('treeitem', { name: 'Root' });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).toHaveAccessibleDescription(REASON);
    const enabled = screen.getByRole('treeitem', { name: 'Subfolder' });
    expect(enabled).not.toHaveAttribute('aria-disabled');
    expect(enabled).not.toHaveAccessibleDescription();
  });

  test('treats an empty reason as enabled', () => {
    renderTree({ getDisabledTooltip: () => '' });

    expect(screen.getByRole('treeitem', { name: 'Root' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  test('does not report a click, Enter or Space on a disabled row', () => {
    const onItemClick = vi.fn();
    renderTree({ onItemClick });

    const row = screen.getByRole('treeitem', { name: 'Root' });
    fireEvent.click(screen.getByText('Root'));
    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: ' ' });

    expect(onItemClick).not.toHaveBeenCalled();
  });

  test('still reports a click on an enabled row', () => {
    const onItemClick = vi.fn();
    renderTree({ onItemClick });

    fireEvent.click(screen.getByText('Subfolder'));

    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/root/Subfolder' }),
    );
  });

  test('expands a collapsed disabled folder from a row click without selecting it', () => {
    const onItemClick = vi.fn();
    const onExpandedPathsChange = vi.fn();
    renderTree({
      expandedPaths: new Set(),
      onItemClick,
      onExpandedPathsChange,
    });

    fireEvent.click(screen.getByText('Root'));

    expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['/root']));
    expect(onItemClick).not.toHaveBeenCalled();
  });

  test('expands a disabled folder from Enter, Space and ArrowRight', () => {
    const onExpandedPathsChange = vi.fn();
    renderTree({ expandedPaths: new Set(), onExpandedPathsChange });
    const row = screen.getByRole('treeitem', { name: 'Root' });

    for (const key of ['Enter', ' ', 'ArrowRight']) {
      onExpandedPathsChange.mockClear();
      fireEvent.keyDown(row, { key });
      expect(onExpandedPathsChange).toHaveBeenCalledWith(new Set(['/root']));
    }
  });

  test('expands and collapses a disabled folder from its caret', () => {
    const onExpandedPathsChange = vi.fn();
    const { container, rerender } = renderTree({
      expandedPaths: new Set(),
      onExpandedPathsChange,
    });
    const caret = () =>
      container.querySelector('[role="treeitem"] span.relative.flex svg')!;

    fireEvent.click(caret());
    expect(onExpandedPathsChange).toHaveBeenLastCalledWith(new Set(['/root']));

    rerender(
      <DialFoldersTree
        items={mockItems}
        expandedPaths={new Set(['/root'])}
        onExpandedPathsChange={onExpandedPathsChange}
        getDisabledTooltip={getDisabledTooltip}
      />,
    );
    fireEvent.click(caret());
    expect(onExpandedPathsChange).toHaveBeenLastCalledWith(new Set());
  });

  test('collapses a disabled folder with ArrowLeft', () => {
    const onExpandedPathsChange = vi.fn();
    renderTree({ onExpandedPathsChange });

    fireEvent.keyDown(screen.getByRole('treeitem', { name: 'Root' }), {
      key: 'ArrowLeft',
    });

    expect(onExpandedPathsChange).toHaveBeenLastCalledWith(
      new Set(['/root/Subfolder']),
    );
  });

  test('keeps a disabled row focusable and its children selectable', () => {
    const onItemClick = vi.fn();
    renderTree({ onItemClick });

    screen.getByRole('treeitem', { name: 'Root' }).focus();
    expect(screen.getByRole('treeitem', { name: 'Root' })).toHaveFocus();

    fireEvent.click(screen.getByText('File.txt'));
    expect(onItemClick).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/root/Subfolder/File.txt' }),
    );
  });

  test('hides the context menu button and item actions on a disabled row', () => {
    renderTree({
      getContextMenuItems: getMenu,
      renderItemActions: (item: { name: string }) => (
        <button>{`Action ${item.name}`}</button>
      ),
    });

    expect(
      screen.queryByRole('button', { name: 'Action Root' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Action Subfolder' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'More actions' }),
    ).toHaveLength(2);
  });

  test('shows the reason in a tooltip when the row is focused', async () => {
    renderTree();

    fireEvent.focus(screen.getByRole('treeitem', { name: 'Root' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(REASON);
  });

  test('lets a disabled row be the selected row', () => {
    renderTree({ selectedPath: '/root' });

    expect(screen.getByRole('treeitem', { name: 'Root' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  test('keeps the search highlight on a disabled row', () => {
    const { container } = renderTree({ searchQuery: 'roo' });

    expect(
      [...container.querySelectorAll('mark')].map((mark) => mark.textContent),
    ).toEqual(['Roo']);
  });

  describe('first-load skeleton', () => {
    test('shows a busy skeleton instead of the empty state while loading', () => {
      const { container } = render(
        <DialFoldersTree items={[]} loading emptyStateTitle="No folders" />,
      );

      expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
      expect(screen.queryByText('No folders')).not.toBeInTheDocument();
      expect(screen.queryByRole('tree')).not.toBeInTheDocument();
    });

    test('announces the loading label once the skeleton shows', () => {
      vi.useFakeTimers();
      try {
        render(
          <DialFoldersTree items={[]} loading loadingLabel="Loading tree" />,
        );
        expect(screen.queryByText('Loading tree')).not.toBeInTheDocument();

        act(() => {
          vi.advanceTimersByTime(400);
        });

        expect(screen.getByText('Loading tree')).toBeInTheDocument();
      } finally {
        vi.useRealTimers();
      }
    });

    test('shows the empty state once loading ends with no items', () => {
      const { rerender, container } = render(
        <DialFoldersTree items={[]} loading emptyStateTitle="No folders" />,
      );
      rerender(
        <DialFoldersTree
          items={[]}
          loading={false}
          emptyStateTitle="No folders"
        />,
      );

      expect(screen.getByText('No folders')).toBeInTheDocument();
      expect(
        container.querySelector('[aria-busy="true"]'),
      ).not.toBeInTheDocument();
    });

    test('keeps showing the tree while loading when it already has items', () => {
      const { container } = render(
        <DialFoldersTree items={mockItems} loading />,
      );

      expect(screen.getByRole('tree')).toBeInTheDocument();
      expect(
        container.querySelector('[aria-busy="true"]'),
      ).not.toBeInTheDocument();
    });

    describe('a folder loading its children', () => {
      const ROOT = '/root';
      const loadingRoot = [
        {
          name: 'Root',
          path: ROOT,
          nodeType: DialFileNodeType.FOLDER,
          folderId: '1',
          items: [] as typeof mockItems,
        },
      ];

      test('keeps its icon and name during the delay, then hides them under skeletons, never a spinner', () => {
        vi.useFakeTimers();
        try {
          const { container } = render(
            <DialFoldersTree
              items={loadingRoot}
              loadingPaths={new Set([ROOT])}
            />,
          );

          // A fast load changes nothing: the name stays, with no spinner.
          expect(screen.getByText('Root')).toBeInTheDocument();
          expect(screen.queryByRole('status')).not.toBeInTheDocument();

          act(() => {
            vi.advanceTimersByTime(400);
          });

          const row = screen.getByRole('treeitem', { name: 'Root' });
          expect(row.querySelector('.rounded-full')).toBeInTheDocument();
          expect(row.querySelector('.rounded-xl')).toBeInTheDocument();
          expect(screen.queryByText('Root')).not.toBeInTheDocument();
          expect(screen.queryByRole('status')).not.toBeInTheDocument();
          // Collapsed: no placeholder rows under it.
          expect(
            container.querySelector('[aria-busy="true"]'),
          ).not.toBeInTheDocument();
        } finally {
          vi.useRealTimers();
        }
      });

      test('shows placeholder rows under it once expanded, after the delay', () => {
        vi.useFakeTimers();
        try {
          const { container } = render(
            <DialFoldersTree
              items={loadingRoot}
              expandedPaths={new Set([ROOT])}
              loadingPaths={new Set([ROOT])}
              loadingLabel="Loading folders"
            />,
          );
          const announcement = screen.getByRole('status');
          expect(announcement).toBeEmptyDOMElement();
          expect(
            container.querySelector('[aria-busy="true"]'),
          ).not.toBeInTheDocument();

          act(() => {
            vi.advanceTimersByTime(400);
          });

          expect(
            container.querySelector('[aria-busy="true"]'),
          ).toBeInTheDocument();
          expect(screen.getByText('Loading folders')).toBe(announcement);
        } finally {
          vi.useRealTimers();
        }
      });

      test('shows no placeholder rows when the folder already has children', () => {
        vi.useFakeTimers();
        try {
          const { container } = render(
            <DialFoldersTree
              items={mockItems}
              expandedPaths={new Set(['/root'])}
              loadingPaths={new Set(['/root'])}
            />,
          );
          act(() => {
            vi.advanceTimersByTime(400);
          });

          expect(
            container.querySelector('[aria-busy="true"]'),
          ).not.toBeInTheDocument();
        } finally {
          vi.useRealTimers();
        }
      });
    });

    describe('root folder whose children are not loaded yet', () => {
      const ROOT = '/My files';
      const rootWith = (items: typeof mockItems) => [
        {
          name: 'My files',
          path: ROOT,
          nodeType: DialFileNodeType.FOLDER,
          folderId: 'bucket',
          items,
        },
      ];
      const loadedRoot = rootWith([
        {
          name: 'Documents',
          path: `${ROOT}/Documents`,
          nodeType: DialFileNodeType.FOLDER,
          folderId: 'bucket',
          items: [],
        },
      ]);

      test('keeps a decorative skeleton directly under the expanded root', () => {
        const { container } = render(
          <DialFoldersTree
            items={rootWith([])}
            expandedPaths={new Set([ROOT])}
            loading
          />,
        );

        const tree = screen.getByRole('tree');
        expect(
          screen.getByRole('treeitem', { name: 'My files' }),
        ).toBeInTheDocument();
        const busy = container.querySelector('[aria-busy="true"]');
        expect(busy).toBeInTheDocument();
        expect(tree).toContainElement(busy as HTMLElement);
        expect(busy?.closest('[aria-hidden="true"]')).toHaveAttribute('inert');
      });

      test('shows no skeleton under a collapsed root', () => {
        const { container } = render(
          <DialFoldersTree items={rootWith([])} loading />,
        );

        expect(
          container.querySelector('[aria-busy="true"]'),
        ).not.toBeInTheDocument();
      });

      test('shows no skeleton when not loading: the root is just empty', () => {
        const { container } = render(
          <DialFoldersTree
            items={rootWith([])}
            expandedPaths={new Set([ROOT])}
          />,
        );

        expect(
          container.querySelector('[aria-busy="true"]'),
        ).not.toBeInTheDocument();
      });

      test('preserves the gap between top-level children', () => {
        render(
          <DialFoldersTree
            items={loadedRoot}
            expandedPaths={new Set([ROOT])}
          />,
        );
        const child = screen.getByRole('treeitem', { name: 'Documents' });
        const childrenWrapper = child.closest('.cursor-pointer')?.parentElement;
        expect(childrenWrapper).toHaveClass('flex', 'flex-col', 'gap-1');
      });

      test('puts a placeholder beneath each expanded root instead of after the tree', () => {
        const secondRoot = {
          name: 'Shared',
          path: '/Shared',
          nodeType: DialFileNodeType.FOLDER,
          folderId: 'shared',
          items: [],
        };
        const { container } = render(
          <DialFoldersTree
            items={[...rootWith([]), secondRoot]}
            expandedPaths={new Set([ROOT, secondRoot.path])}
            loading
          />,
        );
        const placeholders = container.querySelectorAll('[aria-busy="true"]');
        expect(placeholders).toHaveLength(2);
        const roots = screen.getAllByRole('treeitem');
        roots.forEach((root, index) => {
          expect(root.parentElement?.parentElement).toContainElement(
            placeholders[index] as HTMLElement,
          );
        });
      });

      test('only the pending root shows a placeholder when another root is loaded and empty', () => {
        const pendingRoot = {
          name: 'Shared',
          path: '/Shared',
          nodeType: DialFileNodeType.FOLDER,
          folderId: 'shared',
          items: [],
        };
        render(
          <DialFoldersTree
            items={[...rootWith([]), pendingRoot]}
            expandedPaths={new Set([ROOT, pendingRoot.path])}
            loadedPaths={new Set([ROOT])}
            loading
          />,
        );
        const loadedBranch = screen.getByRole('treeitem', { name: 'My files' })
          .parentElement?.parentElement;
        const pendingBranch = screen.getByRole('treeitem', { name: 'Shared' })
          .parentElement?.parentElement;
        expect(
          loadedBranch?.querySelector('[aria-busy="true"]'),
        ).not.toBeInTheDocument();
        expect(
          pendingBranch?.querySelector('[aria-busy="true"]'),
        ).toBeInTheDocument();
      });

      test('a loaded empty root does not show a first-load skeleton again', () => {
        const { container } = render(
          <DialFoldersTree
            items={rootWith([])}
            expandedPaths={new Set([ROOT])}
            loadedPaths={new Set([ROOT])}
            loading
          />,
        );
        expect(
          container.querySelector('[aria-busy="true"]'),
        ).not.toBeInTheDocument();
      });

      test('keeps a visible Tab stop and arrow navigation while incoming children are hidden', () => {
        vi.useFakeTimers();
        try {
          const props = {
            expandedPaths: new Set([ROOT]),
            selectedPath: `${ROOT}/Documents`,
          };
          const { rerender } = render(
            <DialFoldersTree {...props} items={rootWith([])} loading />,
          );
          act(() => vi.advanceTimersByTime(400));
          rerender(<DialFoldersTree {...props} items={loadedRoot} />);
          const root = screen.getByRole('treeitem', { name: 'My files' });
          expect(root).toHaveAttribute('tabindex', '0');
          expect(
            screen.queryByRole('treeitem', { name: 'Documents' }),
          ).not.toBeInTheDocument();
          act(() => root.focus());
          fireEvent.keyDown(root, { key: 'ArrowDown' });
          expect(root).toHaveFocus();

          act(() => vi.advanceTimersByTime(500));
          fireEvent.keyDown(root, { key: 'ArrowDown' });
          expect(
            screen.getByRole('treeitem', { name: 'Documents' }),
          ).toHaveFocus();
        } finally {
          vi.useRealTimers();
        }
      });

      test('holds the children back for the minimum time, then shows them', () => {
        vi.useFakeTimers();
        try {
          const { container, rerender } = render(
            <DialFoldersTree
              items={rootWith([])}
              expandedPaths={new Set([ROOT])}
              loading
            />,
          );
          act(() => {
            vi.advanceTimersByTime(400);
          });

          rerender(
            <DialFoldersTree
              items={loadedRoot}
              expandedPaths={new Set([ROOT])}
              loading={false}
            />,
          );

          // The skeleton is still within its minimum time: no children yet.
          expect(
            container.querySelector('[aria-busy="true"]'),
          ).toBeInTheDocument();
          expect(
            screen.queryByRole('treeitem', { name: 'Documents' }),
          ).not.toBeInTheDocument();

          act(() => {
            vi.advanceTimersByTime(500);
          });

          expect(
            screen.getByRole('treeitem', { name: 'Documents' }),
          ).toBeInTheDocument();
          expect(
            container.querySelector('[aria-busy="true"]'),
          ).not.toBeInTheDocument();
        } finally {
          vi.useRealTimers();
        }
      });
    });
  });
});
