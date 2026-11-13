import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileClipboard } from '@/components/FileManager/hooks/use-file-clipboard';
import type { DialFile } from '@/models/file';
import { DialFileNodeType } from '@/models/file';
import {
  DestinationFolderMode,
  DialFileManagerConflictActions,
} from '@/types/file-manager';

describe('Dial UI Kit :: FileManager :: useFileClipboard', () => {
  let destinationFiles: DialFile[] = [];
  let sourceFiles: DialFile[] = [];
  const getDestinationFiles = () => destinationFiles;
  const getSourceFiles = () => sourceFiles;

  beforeEach(() => {
    destinationFiles = [];
    sourceFiles = [];
  });

  it('handleCopyTo without conflicts calls onCopyFiles and onCopySuccess', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    destinationFiles = [];
    const copiedFiles: DialFile[] = [
      {
        id: '1',
        name: 'a.txt',
        path: '/src/a.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '2',
        name: 'b.txt',
        path: '/src/b.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles(copiedFiles);
    });

    act(() => {
      result.current.handleCopyTo('/dest');
    });

    expect(onCopyFiles).toHaveBeenCalledTimes(1);
    expect(onCopyFiles).toHaveBeenCalledWith(
      [
        {
          sourceUrl: '/src/a.txt',
          destinationUrl: '/dest/a.txt',
          overwrite: false,
          nodeType: DialFileNodeType.ITEM,
        },
        {
          sourceUrl: '/src/b.txt',
          destinationUrl: '/dest/b.txt',
          overwrite: false,
          nodeType: DialFileNodeType.ITEM,
        },
      ],
      '/dest',
    );
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(result.current.conflictResolutionOpen).toBe(false);
  });

  it('handleCopyTo with conflicts opens conflict resolution popup', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    destinationFiles = [
      {
        id: '1',
        name: 'a.txt',
        path: '/dest/a.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];
    const copiedFiles: DialFile[] = [
      {
        id: '2',
        name: 'a.txt',
        path: '/src/a.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '3',
        name: 'b.txt',
        path: '/src/b.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles(copiedFiles);
    });

    act(() => {
      result.current.handleCopyTo('/dest');
    });

    expect(result.current.conflictResolutionOpen).toBe(true);
    expect(result.current.conflictingFiles).toHaveLength(1);
    expect(result.current.conflictingFiles[0].name).toBe('a.txt');
    expect(onCopyFiles).not.toHaveBeenCalled();
    expect(onCopySuccess).not.toHaveBeenCalled();
  });

  it('handleConflictReplace resolves with overwrite=true and calls onCopySuccess', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    destinationFiles = [
      {
        id: '1',
        name: 'file.txt',
        path: '/dest/file.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];
    const copiedFiles: DialFile[] = [
      {
        id: '2',
        name: 'file.txt',
        path: '/src/file.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles(copiedFiles);
    });

    act(() => {
      result.current.handleCopyTo('/dest');
    });

    expect(result.current.conflictResolutionOpen).toBe(true);

    act(() => {
      result.current.handleConflictReplace();
    });

    expect(onCopyFiles).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          sourceUrl: '/src/file.txt',
          destinationUrl: '/dest/file.txt',
          overwrite: true,
          nodeType: DialFileNodeType.ITEM,
        }),
      ],
      '/dest',
    );
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(result.current.conflictResolutionOpen).toBe(false);
  });

  it('handleConflictDuplicate resolves with renamed files and calls onCopySuccess', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    destinationFiles = [
      {
        id: '1',
        name: 'file.txt',
        path: '/dest/file.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];
    const copiedFiles: DialFile[] = [
      {
        id: '2',
        name: 'file.txt',
        path: '/src/file.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles(copiedFiles);
    });

    act(() => {
      result.current.handleCopyTo('/dest');
    });

    expect(result.current.conflictResolutionOpen).toBe(true);

    act(() => {
      result.current.handleConflictDuplicate();
    });

    expect(onCopyFiles).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          sourceUrl: '/src/file.txt',
          destinationUrl: '/dest/file (1).txt',
          overwrite: false,
          nodeType: DialFileNodeType.ITEM,
        }),
      ],
      '/dest',
    );
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(result.current.conflictResolutionOpen).toBe(false);
  });

  it('handleConflictDecideForEach with mixed decisions calls onCopySuccess', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    destinationFiles = [
      {
        id: '1',
        name: 'a.txt',
        path: '/dest/a.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '2',
        name: 'b.txt',
        path: '/dest/b.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '3',
        name: 'c.txt',
        path: '/dest/c.txt',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];
    const copiedFiles: DialFile[] = [
      {
        id: '4',
        name: 'a.txt',
        path: '/src/a.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '5',
        name: 'b.txt',
        path: '/src/b.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
      {
        id: '6',
        name: 'c.txt',
        path: '/src/c.txt',
        parentPath: '/src',
        nodeType: DialFileNodeType.ITEM,
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles(copiedFiles);
    });

    act(() => {
      result.current.handleCopyTo('/dest');
    });

    act(() => {
      result.current.handleConflictDecideForEach([
        {
          file: copiedFiles[0],
          action: DialFileManagerConflictActions.Replace,
        },
        {
          file: copiedFiles[1],
          action: DialFileManagerConflictActions.Duplicate,
        },
        { file: copiedFiles[2], action: DialFileManagerConflictActions.Cancel },
      ]);
    });

    expect(onCopyFiles).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          sourceUrl: '/src/a.txt',
          destinationUrl: '/dest/a.txt',
          overwrite: true,
          nodeType: DialFileNodeType.ITEM,
        }),
        expect.objectContaining({
          sourceUrl: '/src/b.txt',
          destinationUrl: '/dest/b (1).txt',
          overwrite: false,
          nodeType: DialFileNodeType.ITEM,
        }),
      ],
      '/dest',
    );
    expect(onCopySuccess).toHaveBeenCalledTimes(1);
    expect(result.current.conflictResolutionOpen).toBe(false);
  });

  it('handleMoveTo without conflicts calls onMoveToFiles and onMoveSuccess', () => {
    const onMoveToFiles = vi.fn();
    const onMoveSuccess = vi.fn();
    destinationFiles = [];
    const movedFiles: DialFile[] = [
      {
        id: '1',
        name: 'm1',
        path: '/source/m1',
        nodeType: DialFileNodeType.FOLDER,
        parentPath: '/source',
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onMoveToFiles,
        onMoveSuccess,
      }),
    );

    act(() => {
      result.current.handleSetMovedFiles(movedFiles);
    });

    act(() => {
      result.current.handleMoveTo('/dest', '/source');
    });

    expect(onMoveToFiles).toHaveBeenCalledWith(
      [
        {
          sourceUrl: '/source/m1',
          destinationUrl: '/dest/m1',
          overwrite: false,
          nodeType: DialFileNodeType.FOLDER,
        },
      ],
      '/source',
      '/dest',
    );
    expect(onMoveSuccess).toHaveBeenCalledTimes(1);
  });

  it('handleDuplicate duplicates files in the same folder and calls onDuplicateSuccess', () => {
    const onCopyFiles = vi.fn();
    const onDuplicateSuccess = vi.fn();
    destinationFiles = [
      {
        id: '1',
        name: 'file.txt',
        path: '/folder/file.txt',
        nodeType: DialFileNodeType.ITEM,
        parentPath: '/folder',
      } as DialFile,
    ];
    const filesToDuplicate: DialFile[] = [
      {
        id: '1',
        name: 'file.txt',
        path: '/folder/file.txt',
        nodeType: DialFileNodeType.ITEM,
        parentPath: '/folder',
      } as DialFile,
    ];

    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onDuplicateSuccess,
      }),
    );

    act(() => {
      result.current.handleDuplicate(filesToDuplicate);
    });

    expect(onCopyFiles).toHaveBeenCalledWith(
      [
        {
          sourceUrl: '/folder/file.txt',
          destinationUrl: '/folder/file (1).txt',
          overwrite: false,
          nodeType: DialFileNodeType.ITEM,
        },
      ],
      '/folder',
    );
    expect(onDuplicateSuccess).toHaveBeenCalledTimes(1);
  });

  const file = (name: string, parentPath = '/src'): DialFile =>
    ({
      id: name,
      name,
      path: `${parentPath}/${name}`,
      parentPath,
      nodeType: DialFileNodeType.ITEM,
    }) as DialFile;

  it('hands a copy request with the files and source folder to the host', () => {
    const onDestinationRequest = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onDestinationRequest,
      }),
    );
    const files = [file('a.txt'), file('b.txt')];

    act(() => {
      result.current.handleSetCopiedFiles(files);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });

    expect(onDestinationRequest).toHaveBeenCalledOnce();
    expect(onDestinationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: DestinationFolderMode.Copy,
        items: files,
        sourceFolder: '/src',
      }),
    );
  });

  it('falls back to folderId for the source folder when parentPath is missing', () => {
    const onDestinationRequest = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onDestinationRequest,
      }),
    );

    act(() => {
      result.current.handleSetMovedFiles([
        { ...file('a.txt'), parentPath: undefined, folderId: '/root' },
      ]);
      result.current.handleRequestDestination(DestinationFolderMode.Move);
    });

    expect(onDestinationRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: DestinationFolderMode.Move,
        sourceFolder: '/root',
      }),
    );
  });

  it('copies the requested files when the host confirms a destination', () => {
    const onCopyFiles = vi.fn();
    const onCopySuccess = vi.fn();
    const onDestinationRequest = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onCopySuccess,
        onDestinationRequest,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });
    act(() => {
      onDestinationRequest.mock.calls[0][0].confirm('/dest');
    });

    expect(onCopyFiles).toHaveBeenCalledWith(
      [expect.objectContaining({ sourceUrl: '/src/a.txt' })],
      '/dest',
    );
    expect(onCopySuccess).toHaveBeenCalledOnce();
  });

  it('moves the requested files from their source folder when the host confirms', () => {
    const onMoveToFiles = vi.fn();
    const onDestinationRequest = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onMoveToFiles,
        onDestinationRequest,
      }),
    );

    act(() => {
      result.current.handleSetMovedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Move);
    });
    act(() => {
      onDestinationRequest.mock.calls[0][0].confirm('/dest');
    });

    expect(onMoveToFiles).toHaveBeenCalledWith(
      [expect.objectContaining({ sourceUrl: '/src/a.txt' })],
      '/src',
      '/dest',
    );
  });

  it('opens conflict resolution instead of copying when the destination has a same-named file', () => {
    const onCopyFiles = vi.fn();
    const onDestinationRequest = vi.fn();
    destinationFiles = [file('a.txt', '/dest')];
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onDestinationRequest,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });
    act(() => {
      onDestinationRequest.mock.calls[0][0].confirm('/dest');
    });

    expect(result.current.conflictResolutionOpen).toBe(true);
    expect(onCopyFiles).not.toHaveBeenCalled();
  });

  it('checks conflicts against the destination files of the latest render when the host confirms later', () => {
    const onCopyFiles = vi.fn();
    const onDestinationRequest = vi.fn();
    const { result, rerender } = renderHook(
      ({ destination }: { destination: DialFile[] }) =>
        useFileClipboard({
          getDestinationFiles: () => destination,
          getSourceFiles,
          onCopyFiles,
          onDestinationRequest,
        }),
      { initialProps: { destination: [] as DialFile[] } },
    );

    act(() => {
      result.current.handleSetCopiedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });
    rerender({ destination: [file('a.txt', '/dest')] });
    act(() => {
      onDestinationRequest.mock.calls[0][0].confirm('/dest');
    });

    expect(result.current.conflictResolutionOpen).toBe(true);
    expect(onCopyFiles).not.toHaveBeenCalled();
  });

  it('does nothing when no host handles destination requests', () => {
    const onCopyFiles = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({ getDestinationFiles, getSourceFiles, onCopyFiles }),
    );

    act(() => {
      result.current.handleSetCopiedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });

    expect(onCopyFiles).not.toHaveBeenCalled();
  });

  it('cancel abandons the request without copying', () => {
    const onCopyFiles = vi.fn();
    const onDestinationRequest = vi.fn();
    const { result } = renderHook(() =>
      useFileClipboard({
        getDestinationFiles,
        getSourceFiles,
        onCopyFiles,
        onDestinationRequest,
      }),
    );

    act(() => {
      result.current.handleSetCopiedFiles([file('a.txt')]);
      result.current.handleRequestDestination(DestinationFolderMode.Copy);
    });
    act(() => {
      onDestinationRequest.mock.calls[0][0].cancel();
    });

    expect(onCopyFiles).not.toHaveBeenCalled();
    expect(result.current.conflictResolutionOpen).toBe(false);
  });
});
