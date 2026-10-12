import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileManagerUnshareConfirmationPopup } from './FileManagerUnshareConfirmationPopup';
import { DialFileNodeType, type DialFile } from '@/models/file';

const makeFile = (index: number): DialFile => ({
  id: String(index),
  name: `file${index}.txt`,
  path: `/shared/file${index}.txt`,
  nodeType: DialFileNodeType.ITEM,
});

describe('Dial UI Kit :: FileManagerUnshareConfirmationPopup', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when open is false', () => {
    render(
      <FileManagerUnshareConfirmationPopup
        open={false}
        itemsToUnshare={[makeFile(1)]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the default copy for a single item', () => {
    render(
      <FileManagerUnshareConfirmationPopup
        open
        itemsToUnshare={[makeFile(1)]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.getByText('Confirm Unsharing Items')).toBeInTheDocument();
    expect(screen.getByText('"file1.txt"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Unshare' })).toBeInTheDocument();
  });

  it('lists at most ten items and counts the rest', () => {
    const items = Array.from({ length: 12 }, (_, i) => makeFile(i + 1));
    render(
      <FileManagerUnshareConfirmationPopup
        open
        itemsToUnshare={items}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(screen.getByText('... and 2 more')).toBeInTheDocument();
  });

  it('uses the custom title, content and labels', () => {
    const titleRenderer = vi.fn(() => 'Unshare file');
    const contentRenderer = vi.fn(() => <p>Custom body</p>);
    const items = [makeFile(1)];
    render(
      <FileManagerUnshareConfirmationPopup
        open
        itemsToUnshare={items}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        titleRenderer={titleRenderer}
        contentRenderer={contentRenderer}
        confirmLabel="Stop sharing"
        cancelLabel="Keep"
      />,
    );

    expect(titleRenderer).toHaveBeenCalledWith(['file1.txt'], items);
    expect(contentRenderer).toHaveBeenCalledWith(['file1.txt'], items);
    expect(screen.getByText('Unshare file')).toBeInTheDocument();
    expect(screen.getByText('Custom body')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stop sharing' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument();
  });

  it('calls onConfirm and onClose from the footer buttons', async () => {
    const user = userEvent.setup();
    render(
      <FileManagerUnshareConfirmationPopup
        open
        itemsToUnshare={[makeFile(1)]}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Unshare' }));
    expect(mockOnConfirm).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(mockOnClose).toHaveBeenCalled();
  });
});
