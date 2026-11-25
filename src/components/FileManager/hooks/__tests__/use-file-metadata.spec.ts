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
    expect(result.current.isMetadataLoading).toBe(false);
  });

  it('is loading while the info promise is pending', async () => {
    let resolve!: () => void;
    const onGetInfo = vi.fn(
      () => new Promise<void>((done) => (resolve = done)),
    );
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.openMetadataPopup(file);
    });

    expect(result.current.isMetadataLoading).toBe(true);

    await act(async () => {
      resolve();
      await pending;
    });

    expect(result.current.isMetadataLoading).toBe(false);
  });

  it('does not load for a synchronous info callback', async () => {
    const onGetInfo = vi.fn();
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    await act(async () => {
      await result.current.openMetadataPopup(file);
    });

    expect(onGetInfo).toHaveBeenCalledWith(file);
    expect(result.current.isMetadataLoading).toBe(false);
  });

  it('stops loading when the info promise rejects', async () => {
    const onGetInfo = vi.fn().mockRejectedValue(new Error('failed'));
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    await act(async () => {
      await expect(result.current.openMetadataPopup(file)).rejects.toThrow(
        'failed',
      );
    });

    expect(result.current.isMetadataLoading).toBe(false);
    expect(result.current.isMetadataPopupOpen).toBe(true);
  });

  it('stops loading on close and ignores the late response', async () => {
    let resolve!: () => void;
    const onGetInfo = vi.fn(
      () => new Promise<void>((done) => (resolve = done)),
    );
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    let pending!: Promise<void>;
    act(() => {
      pending = result.current.openMetadataPopup(file);
    });
    act(() => result.current.closeMetadataPopup());

    expect(result.current.isMetadataLoading).toBe(false);

    await act(async () => {
      resolve();
      await pending;
    });

    expect(result.current.isMetadataLoading).toBe(false);
    expect(result.current.isMetadataPopupOpen).toBe(false);
  });

  it('keeps loading for the latest file when an earlier request settles', async () => {
    const resolvers: Array<() => void> = [];
    const onGetInfo = vi.fn(
      () => new Promise<void>((done) => resolvers.push(done)),
    );
    const otherFile: DialFile = { ...file, name: 'other.txt' };
    const { result } = renderHook(() => useFileMetadata({ onGetInfo }));

    let first!: Promise<void>;
    act(() => {
      first = result.current.openMetadataPopup(file);
    });
    act(() => {
      void result.current.openMetadataPopup(otherFile);
    });

    await act(async () => {
      resolvers[0]();
      await first;
    });

    expect(result.current.selectedFileForMetadata).toBe(otherFile);
    expect(result.current.isMetadataLoading).toBe(true);
  });
});
