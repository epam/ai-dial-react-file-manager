import type { DialFile } from '@/models/file';
import { useState, useCallback } from 'react';

export interface UseFileUnshareOptions {
  onUnshareFiles?: (files: DialFile[]) => void | Promise<void>;
  /** When false, an unshare request reaches `onUnshareFiles` without a confirmation. */
  isConfirmationEnabled: boolean;
}

export const useFileUnshare = ({
  onUnshareFiles,
  isConfirmationEnabled,
}: UseFileUnshareOptions) => {
  const [itemsToUnshare, setItemsToUnshare] = useState<DialFile[]>([]);

  const requestUnshare = useCallback(
    (files: DialFile[]) => {
      if (!isConfirmationEnabled) {
        void onUnshareFiles?.(files);
        return;
      }
      setItemsToUnshare(files);
    },
    [isConfirmationEnabled, onUnshareFiles],
  );

  const closeUnshareConfirmation = useCallback(() => {
    setItemsToUnshare([]);
  }, []);

  const confirmUnshare = useCallback(() => {
    if (itemsToUnshare.length > 0) void onUnshareFiles?.(itemsToUnshare);
    closeUnshareConfirmation();
  }, [itemsToUnshare, onUnshareFiles, closeUnshareConfirmation]);

  return {
    unshareConfirmationOpen: itemsToUnshare.length > 0,
    itemsToUnshare,
    requestUnshare,
    closeUnshareConfirmation,
    confirmUnshare,
  };
};
