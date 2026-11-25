import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DialFileNodeType, type DialFile } from '@/models/file';
import { FileMetadataPopup } from './FileMetadataPopup';

const mockFile: DialFile = {
  id: 'file-1',
  name: 'test-file.svg',
  path: 'My files/test-file.svg',
  updatedAt: '2025-09-05T10:30:00Z',
  contentLength: 2150,
  author: 'John Doe',
  nodeType: DialFileNodeType.ITEM,
  folderId: 'folder-1',
};

/*
 * Kept in its own file: the lazy body is loaded once per module registry, and
 * each spec file gets a fresh one, so here it has not been loaded yet.
 */
describe('Dial UI Kit :: FileMetadataPopup lazy body', () => {
  it('shows the skeleton with real labels until the body loads, then the values', async () => {
    render(
      <FileMetadataPopup
        open={true}
        onClose={vi.fn()}
        fileMetadata={mockFile}
        loadingLabel="Loading info"
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.getByText('Name:')).toBeInTheDocument();
    expect(screen.getByText('Loading info')).toBeInTheDocument();
    expect(screen.queryByText('test-file.svg')).not.toBeInTheDocument();

    expect(await screen.findByText('test-file.svg')).toBeInTheDocument();
    expect(dialog.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
  });
});
