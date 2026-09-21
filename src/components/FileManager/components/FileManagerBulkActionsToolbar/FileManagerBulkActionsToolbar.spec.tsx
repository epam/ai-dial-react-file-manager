import { render, fireEvent, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DialFileManagerBulkActionsToolbar } from './FileManagerBulkActionsToolbar';

vi.mock('@/hooks/use-is-mobile-screen', () => ({
  useIsMobileScreen: vi.fn(() => false),
}));

vi.mock('@/hooks/use-flexible-actions', () => ({
  useFlexibleActions: vi.fn(({ actions }) => ({
    refs: {
      containerRef: { current: null },
      leftSectionRef: { current: null },
      measureRef: { current: null },
    },
    visibleActions: actions,
    hiddenActions: [],
  })),
}));

describe('Dial UI Kit :: DialFileManagerBulkActionsToolbar', () => {
  const actions = [
    { key: 'download', title: 'Download', onClick: vi.fn() },
    { key: 'delete', title: 'Delete', onClick: vi.fn() },
    { key: 'share', title: 'Share', onClick: vi.fn() },
  ];

  it('renders the selection label', () => {
    const getLabel = vi.fn(
      (count: number) => `file${count === 1 ? '' : 's'} selected`,
    );

    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={getLabel}
        onClearSelection={vi.fn()}
        actions={actions}
        selectedCount={3}
      />,
    );

    expect(getLabel).toHaveBeenCalledWith(3);

    const toolbar = screen.getByRole('toolbar');
    expect(within(toolbar).getByText('3')).toBeInTheDocument();
    expect(within(toolbar).getByText('files selected')).toBeInTheDocument();
  });

  /*
   * The label used to double as the clear control. It is plain text now, and
   * the selection is dropped through a close button of its own.
   */
  it('clears the selection from its own close button', () => {
    const onClear = vi.fn();

    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={(count) => `file${count === 1 ? '' : 's'} selected`}
        onClearSelection={onClear}
        actions={actions}
        selectedCount={3}
      />,
    );

    const toolbar = screen.getByRole('toolbar');
    fireEvent.click(
      within(toolbar).getByRole('button', { name: 'Clear selection' }),
    );

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('names the clear control from clearSelectionLabel', () => {
    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={(count) => `file${count === 1 ? '' : 's'} selected`}
        onClearSelection={vi.fn()}
        actions={actions}
        selectedCount={3}
        clearSelectionLabel="Отменить выбор"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Отменить выбор' }),
    ).toBeInTheDocument();
  });

  it('renders all action buttons', () => {
    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={(count) => `${count} selected`}
        onClearSelection={vi.fn()}
        actions={actions}
        selectedCount={3}
      />,
    );

    const toolbar = screen.getByRole('toolbar');

    actions.forEach((action) => {
      expect(
        within(toolbar).getByRole('button', { name: action.title }),
      ).toBeInTheDocument();
    });
  });

  it('calls action onClick handler when action button is clicked', () => {
    const mockOnClick = vi.fn();
    const actionsWithMock = [
      { key: 'download', title: 'Download', onClick: vi.fn() },
      { key: 'delete', title: 'Delete', onClick: mockOnClick },
      { key: 'share', title: 'Share', onClick: vi.fn() },
    ];

    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={(count) => `${count} selected`}
        onClearSelection={vi.fn()}
        actions={actionsWithMock}
        selectedCount={3}
      />,
    );

    const toolbar = screen.getByRole('toolbar');
    const deleteButton = within(toolbar).getByRole('button', {
      name: 'Delete',
    });
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);
    expect(mockOnClick).toHaveBeenCalled();
  });

  it('renders toolbar with proper accessibility attributes', () => {
    render(
      <DialFileManagerBulkActionsToolbar
        getSelectionLabel={(count) => `${count} selected`}
        onClearSelection={vi.fn()}
        actions={actions}
        selectedCount={3}
      />,
    );

    const toolbar = screen.getByRole('toolbar', {
      name: 'File bulk actions',
    });
    expect(toolbar).toBeInTheDocument();
  });
});
