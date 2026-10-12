import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useFileUnshare } from '../use-file-unshare';
import { DialFileNodeType, type DialFile } from '@/models/file';

const file: DialFile = {
  id: '1',
  name: 'shared.pdf',
  path: '/shared/shared.pdf',
  nodeType: DialFileNodeType.ITEM,
};

describe('useFileUnshare', () => {
  it('unshares straight away when the confirmation is disabled', () => {
    const onUnshareFiles = vi.fn();
    const { result } = renderHook(() =>
      useFileUnshare({ onUnshareFiles, isConfirmationEnabled: false }),
    );

    act(() => result.current.requestUnshare([file]));

    expect(onUnshareFiles).toHaveBeenCalledWith([file]);
    expect(result.current.unshareConfirmationOpen).toBe(false);
  });

  it('holds the request back until it is confirmed', () => {
    const onUnshareFiles = vi.fn();
    const { result } = renderHook(() =>
      useFileUnshare({ onUnshareFiles, isConfirmationEnabled: true }),
    );

    act(() => result.current.requestUnshare([file]));

    expect(onUnshareFiles).not.toHaveBeenCalled();
    expect(result.current.unshareConfirmationOpen).toBe(true);
    expect(result.current.itemsToUnshare).toEqual([file]);

    act(() => result.current.confirmUnshare());

    expect(onUnshareFiles).toHaveBeenCalledOnce();
    expect(onUnshareFiles).toHaveBeenCalledWith([file]);
    expect(result.current.unshareConfirmationOpen).toBe(false);
    expect(result.current.itemsToUnshare).toEqual([]);
  });

  it('drops the request when the confirmation is closed', () => {
    const onUnshareFiles = vi.fn();
    const { result } = renderHook(() =>
      useFileUnshare({ onUnshareFiles, isConfirmationEnabled: true }),
    );

    act(() => result.current.requestUnshare([file]));
    act(() => result.current.closeUnshareConfirmation());

    expect(onUnshareFiles).not.toHaveBeenCalled();
    expect(result.current.unshareConfirmationOpen).toBe(false);
  });
});
