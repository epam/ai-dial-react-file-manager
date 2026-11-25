import { useCallback, useRef, useState } from 'react';
import type { DialFile } from '@/models/file';

export interface UseFileMetadataProps {
  onGetInfo?: (file: DialFile) => void | Promise<void>;
}

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as PromiseLike<unknown> | undefined)?.then === 'function';

export const useFileMetadata = ({ onGetInfo }: UseFileMetadataProps) => {
  const [isMetadataPopupOpen, setIsMetadataPopupOpen] = useState(false);
  const [isMetadataLoading, setIsMetadataLoading] = useState(false);
  const [selectedFileForMetadata, setSelectedFileForMetadata] = useState<
    DialFile | undefined
  >(undefined);
  /*
   * Identifies the latest request, so a slow response for a file the user has
   * moved on from (closed the popup or opened another file) does not end the
   * loading state of the current one.
   */
  const requestIdRef = useRef(0);

  const openMetadataPopup = useCallback(
    async (file: DialFile) => {
      const requestId = ++requestIdRef.current;
      setSelectedFileForMetadata(file);
      setIsMetadataPopupOpen(true);
      setIsMetadataLoading(false);

      const result = onGetInfo?.(file);
      // A synchronous handler has nothing to wait for, so no skeleton flashes.
      if (!isPromiseLike(result)) return;

      setIsMetadataLoading(true);
      /*
       * A rejection ends the loading state and is passed on to the caller, as
       * before this hook tracked loading: `onGetInfo` owns its error handling.
       */
      try {
        await result;
      } finally {
        if (requestIdRef.current === requestId) {
          setIsMetadataLoading(false);
        }
      }
    },
    [onGetInfo],
  );

  const closeMetadataPopup = useCallback(() => {
    requestIdRef.current += 1;
    setIsMetadataPopupOpen(false);
    setIsMetadataLoading(false);
    setSelectedFileForMetadata(undefined);
  }, []);

  return {
    isMetadataPopupOpen,
    isMetadataLoading,
    selectedFileForMetadata,
    openMetadataPopup,
    closeMetadataPopup,
  };
};
