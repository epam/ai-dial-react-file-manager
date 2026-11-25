import { act, render, screen, type RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { beforeAll, describe, it, expect, vi } from 'vitest';
import { FileMetadataPopup } from './FileMetadataPopup';
import { DialFileNodeType, type DialFile } from '@/models/file';
import userEvent from '@testing-library/user-event';

const mockFile: DialFile = {
  id: 'file-1',
  name: 'test-file.svg',
  path: 'My files/Folder 1/test-file.svg',
  updatedAt: '2025-09-05T10:30:00Z',
  contentLength: 2150,
  author: 'John Doe',
  contentType: 'image/svg+xml',
  nodeType: DialFileNodeType.ITEM,
  folderId: 'folder-1',
};

/** Renders the popup and waits for its lazily loaded body. */
const renderPopup = async (ui: ReactElement): Promise<RenderResult> => {
  let result!: RenderResult;
  await act(async () => {
    result = render(ui);
  });
  return result;
};

describe('Dial UI Kit :: FileMetadataPopup', () => {
  beforeAll(async () => {
    await import('./FileMetadataContent');
  });

  it('renders popup when open', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
      />,
    );

    expect(screen.getByText('Information')).toBeInTheDocument();
    expect(screen.getByText('test-file.svg')).toBeInTheDocument();
  });

  it('does not render when closed', async () => {
    const { container } = await renderPopup(
      <FileMetadataPopup
        open={false}
        onClose={vi.fn()}
        fileMetadata={mockFile}
      />,
    );

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('displays all file metadata fields', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
      />,
    );

    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('test-file.svg')).toBeInTheDocument();

    expect(screen.getByText('Modified Date:')).toBeInTheDocument();
    expect(screen.getByText('Sep 05, 2025')).toBeInTheDocument();

    expect(screen.getByText('Size:')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();

    expect(screen.getByText('Author:')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    expect(screen.getByText('Path:')).toBeInTheDocument();
    expect(
      screen.getByText('My files/Folder 1/test-file.svg'),
    ).toBeInTheDocument();
  });

  it('decodes URI encoded path', async () => {
    const fileWithEncodedPath: DialFile = {
      ...mockFile,
      path: 'files/folder/Screenshot%202025-12-10%20at%2009.44.24.png',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithEncodedPath}
      />,
    );

    expect(
      screen.getByText('files/folder/Screenshot 2025-12-10 at 09.44.24.png'),
    ).toBeInTheDocument();
  });

  it('decodes URI encoded path with special characters', async () => {
    const fileWithSpecialChars: DialFile = {
      ...mockFile,
      path: 'files/folder/file%20with%20%26%20special%20%23%20chars.txt',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithSpecialChars}
      />,
    );

    expect(
      screen.getByText('files/folder/file with & special # chars.txt'),
    ).toBeInTheDocument();
  });

  it('decodes complex URI encoded path', async () => {
    const fileWithComplexPath: DialFile = {
      ...mockFile,
      path: 'files/akWB1YBFr8MR1nshJgXHKUWfPCLZf8x6nMKGsa9WMxmggzPWW42NdcfpPRiPjRHT5/13/Screenshot%202025-12-10%20at%2009.44.24.png',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithComplexPath}
      />,
    );

    expect(
      screen.getByText(
        'files/akWB1YBFr8MR1nshJgXHKUWfPCLZf8x6nMKGsa9WMxmggzPWW42NdcfpPRiPjRHT5/13/Screenshot 2025-12-10 at 09.44.24.png',
      ),
    ).toBeInTheDocument();
  });

  it('handles path with multiple encoded spaces', async () => {
    const fileWithSpaces: DialFile = {
      ...mockFile,
      path: 'My%20Files/My%20Folder/My%20Document.pdf',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithSpaces}
      />,
    );

    expect(
      screen.getByText('My Files/My Folder/My Document.pdf'),
    ).toBeInTheDocument();
  });

  it('handles path with plus signs', async () => {
    const fileWithPlus: DialFile = {
      ...mockFile,
      path: 'files/folder/file+with+plus.txt',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithPlus}
      />,
    );

    expect(
      screen.getByText('files/folder/file+with+plus.txt'),
    ).toBeInTheDocument();
  });

  it('handles already decoded path', async () => {
    const fileWithDecodedPath: DialFile = {
      ...mockFile,
      path: 'files/folder/normal file name.txt',
    };

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithDecodedPath}
      />,
    );

    expect(
      screen.getByText('files/folder/normal file name.txt'),
    ).toBeInTheDocument();
  });

  it('calls onClose when popup is closed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={onClose}
        fileMetadata={mockFile}
      />,
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays custom title', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        header="File Details"
      />,
    );

    expect(screen.getByText('File Details')).toBeInTheDocument();
  });

  it('displays custom labels', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        nameLabel="File Name:"
        pathLabel="Location:"
        modifiedDateLabel="Last Updated:"
        sizeLabel="File Size:"
        authorLabel="Created By:"
      />,
    );

    expect(screen.getByText('File Name:')).toBeInTheDocument();
    expect(screen.getByText('Location:')).toBeInTheDocument();
    expect(screen.getByText('Last Updated:')).toBeInTheDocument();
    expect(screen.getByText('File Size:')).toBeInTheDocument();
    expect(screen.getByText('Created By:')).toBeInTheDocument();
  });

  it('displays "—" when author is missing', async () => {
    const fileWithoutAuthor = { ...mockFile, author: undefined };
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithoutAuthor}
      />,
    );

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('formats file size correctly for bytes', async () => {
    const smallFile = { ...mockFile, contentLength: 512 };
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={smallFile}
      />,
    );

    expect(screen.getByText('512 bytes')).toBeInTheDocument();
  });

  it('formats file size correctly for KB', async () => {
    const mediumFile = { ...mockFile, contentLength: 153600 };
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mediumFile}
      />,
    );

    expect(screen.getByText('150 KB')).toBeInTheDocument();
  });

  it('formats file size correctly for MB', async () => {
    const largeFile = { ...mockFile, contentLength: 15728640 };
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={largeFile}
      />,
    );

    expect(screen.getByText('15.0 MB')).toBeInTheDocument();
  });

  it('shows labels in loading state', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loading={true}
      />,
    );

    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Modified Date:')).toBeInTheDocument();
    expect(screen.getByText('Size:')).toBeInTheDocument();
    expect(screen.getByText('Author:')).toBeInTheDocument();
    expect(screen.getByText('Path:')).toBeInTheDocument();
  });

  it('replaces only the values with a busy skeleton while loading', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loading={true}
      />,
    );

    const dialog = screen.getByRole('dialog');
    const busy = dialog.querySelector('[aria-busy="true"]');
    expect(busy).toBeInTheDocument();
    expect(busy).not.toHaveTextContent('Name:');
    expect(screen.queryByText('test-file.svg')).not.toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
  });

  it('announces the loading label once, and clears it when loading ends', async () => {
    const { rerender } = await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        loading={true}
        loadingLabel="Loading info"
      />,
    );

    expect(await screen.findAllByText('Loading info')).toHaveLength(1);

    rerender(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loading={false}
        loadingLabel="Loading info"
      />,
    );

    expect(screen.queryByText('Loading info')).not.toBeInTheDocument();
  });

  it('announces the loading label again when the popup is reopened', async () => {
    const popup = (open: boolean) => (
      <FileMetadataPopup
        open={open}
        onClose={vi.fn()}
        loading={true}
        loadingLabel="Loading info"
      />
    );
    const { rerender } = await renderPopup(popup(true));
    expect(await screen.findAllByText('Loading info')).toHaveLength(1);

    await act(async () => rerender(popup(false)));
    expect(screen.queryByText('Loading info')).not.toBeInTheDocument();

    await act(async () => rerender(popup(true)));
    expect(await screen.findAllByText('Loading info')).toHaveLength(1);
  });

  it('shows the values once loading finishes', async () => {
    const { rerender } = await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loading={true}
      />,
    );

    rerender(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loading={false}
      />,
    );

    expect(await screen.findByText('test-file.svg')).toBeInTheDocument();
    expect(
      screen.getByRole('dialog').querySelector('[aria-busy="true"]'),
    ).not.toBeInTheDocument();
  });

  it('formats date correctly', async () => {
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
      />,
    );

    expect(screen.getByText('Sep 05, 2025')).toBeInTheDocument();
  });

  it('handles invalid date gracefully', async () => {
    const fileWithInvalidDate = { ...mockFile, updatedAt: 'invalid-date' };
    await renderPopup(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={fileWithInvalidDate}
      />,
    );

    expect(screen.getByText('invalid-date')).toBeInTheDocument();
  });
});
