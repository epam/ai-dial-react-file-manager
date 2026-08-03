import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useFileMetadata } from '../use-file-metadata';
import { DialFileNodeType, type DialFile } from '@/models/file';

const file: DialFile = {
  folderId: '/documents',
  name: 'document.txt',
  nodeType: DialFileNodeType.ITEM,
  path: '/documents/document.txt',
};

describe('useFileMetadata', () => {
  it('opens metadata, loads file info, and resets state on close', async () => {
    const onGetInfo = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    await act(async () => {
      await result.current.openMetadataPopup(file);
    });

    expect(onGetInfo).toHaveBeenCalledWith(file);
    expect(result.current.isMetadataPopupOpen).toBe(true);
    expect(result.current.selectedFileForMetadata).toBe(file);

    act(() => result.current.closeMetadataPopup());

    expect(result.current.isMetadataPopupOpen).toBe(false);
    expect(result.current.selectedFileForMetadata).toBeUndefined();
  });

  it('opens metadata when no info callback is provided', async () => {
    const { result } = renderHook(() => useFileMetadata({}));

    await act(async () => {
      await result.current.openMetadataPopup(file);
    });

    expect(result.current.isMetadataPopupOpen).toBe(true);
    expect(result.current.selectedFileForMetadata).toBe(file);
  });
});
