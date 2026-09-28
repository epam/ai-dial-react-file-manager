import { fireEvent, render, screen } from '@testing-library/react';
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
