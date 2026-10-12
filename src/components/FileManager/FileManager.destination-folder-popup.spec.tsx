import { render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DialFileManager } from './FileManager';

const destinationPopupRender = vi.hoisted(() => vi.fn());

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@epam/ai-dial-ui-kit')>();

  return {
    ...actual,
    DialGrid: () => <div role="grid" aria-label="File Manager Grid View" />,
  };
});

vi.mock('./components/DestinationFolderPopup/DestinationFolderPopup', () => ({
  DialDestinationFolderPopup: (props: unknown) => {
    destinationPopupRender(props);
    return null;
  },
}));

vi.mock('./components/ConflictResolutionPopup/ConflictResolutionPopup', () => ({
  ConflictResolutionPopup: () => null,
}));

vi.mock(
  './components/FileManagerDeleteConfirmationPopup/FileManagerDeleteConfirmationPopup',
  () => ({ FileManagerDeleteConfirmationPopup: () => null }),
);

vi.mock('./components/FileMetadataPopup/FileMetadataPopup', () => ({
  FileMetadataPopup: () => null,
}));

describe('Dial UI Kit :: FileManager destination folder popup', () => {
  test('forwards folder loading state without forwarding outer expansion state', () => {
    const loadedPaths = new Set(['All files/Loaded empty folder']);
    const loadingPaths = new Set(['All files/Loading folder']);

    render(
      <div style={{ height: 640, width: 1100 }}>
        <DialFileManager
          items={[]}
          showNavigationPanel={false}
          treeOptions={{
            header: 'Folder tree',
            expandedPaths: new Set(['All files']),
            loadedPaths,
            loadingPaths,
          }}
        />
      </div>,
    );

    expect(destinationPopupRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        treeOptions: {
          header: 'Folder tree',
          loadedPaths,
          loadingPaths,
        },
      }),
    );
  });

  test('drives the destination grid loading state from the popup filesLoading option', () => {
    render(
      <div style={{ height: 640, width: 1100 }}>
        <DialFileManager
          items={[]}
          showNavigationPanel={false}
          filesLoading={false}
          destinationFolderPopupOptions={{ filesLoading: true }}
        />
      </div>,
    );

    expect(destinationPopupRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        gridOptions: expect.objectContaining({ loading: true }),
      }),
    );
  });

  test('falls back to the main filesLoading when the popup sets none', () => {
    render(
      <div style={{ height: 640, width: 1100 }}>
        <DialFileManager items={[]} showNavigationPanel={false} filesLoading />
      </div>,
    );

    expect(destinationPopupRender).toHaveBeenLastCalledWith(
      expect.objectContaining({
        gridOptions: expect.objectContaining({ loading: true }),
      }),
    );
  });
});
