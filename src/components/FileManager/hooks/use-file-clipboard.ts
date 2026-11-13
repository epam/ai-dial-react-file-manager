import type { DialFile } from '@/models/file';
import type {
  DialCopiedItem,
  DialDestinationRequest,
} from '@/models/file-manager';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FileConflictDecision } from '@/components/FileManager/components/ConflictResolutionPopup/ConflictResolutionPopup';
import { useConflictResolution } from './use-conflict-resolution';
import { DestinationFolderMode } from '@/types/file-manager';

export interface UseFileClipboardOptions {
  getDestinationFiles: (path: string) => DialFile[];
  getSourceFiles: () => DialFile[];
  onCopyFiles?: (items: DialCopiedItem[], destinationFolder: string) => void;
  onMoveToFiles?: (
    items: DialCopiedItem[],
    sourceFolder: string,
    destinationFolder: string,
  ) => void;
  onCopySuccess?: () => void;
  onMoveSuccess?: () => void;
  onDuplicateSuccess?: () => void;
  onDestinationRequest?: (request: DialDestinationRequest) => void;
}

export const useFileClipboard = ({
  getDestinationFiles,
  onCopyFiles,
  onMoveToFiles,
  onCopySuccess,
  onMoveSuccess,
  onDuplicateSuccess,
  onDestinationRequest,
}: UseFileClipboardOptions) => {
  const [copiedFiles, setCopiedFiles] = useState<DialFile[]>([]);
  const [movedFiles, setMovedFiles] = useState<DialFile[]>([]);
  /* A request is raised in the same tick the files are set, before state commits. */
  const copiedFilesRef = useRef<DialFile[]>([]);
  const movedFilesRef = useRef<DialFile[]>([]);

  const [operationMetadata, setOperationMetadata] = useState<{
    type: DestinationFolderMode.Copy | DestinationFolderMode.Move;
    sourceFolder?: string;
  } | null>(null);

  const {
    conflictingFiles,
    conflictResolutionOpen,
    hasActiveConflictRef,
    startConflictResolution,
    resolveConflictsWithStrategy,
    closeConflictResolution,
    openConflictResolution,
    handleReplaceAll: baseHandleReplaceAll,
    handleDuplicateAll: baseHandleDuplicateAll,
    handleCancelAll: baseHandleCancelAll,
    handleDecideForEach: baseHandleDecideForEach,
  } = useConflictResolution({
    getDestinationFiles,
    onResolve: (items, destinationFolder) => {
      if (!items?.length) {
        return;
      }

      if (operationMetadata?.type === DestinationFolderMode.Copy) {
        onCopyFiles?.(items, destinationFolder);
        onCopySuccess?.();
      } else if (
        operationMetadata?.type === DestinationFolderMode.Move &&
        operationMetadata.sourceFolder
      ) {
        onMoveToFiles?.(
          items,
          operationMetadata.sourceFolder,
          destinationFolder,
        );
        onMoveSuccess?.();
      }
    },
  });

  const clearState = useCallback(() => {
    setCopiedFiles([]);
    setMovedFiles([]);
    setOperationMetadata(null);
  }, []);

  const handleCopyTo = useCallback(
    (destinationFolder: string, files: DialFile[] = copiedFiles) => {
      const result = startConflictResolution(destinationFolder, files, {
        type: DestinationFolderMode.Copy,
      });

      setOperationMetadata({ type: DestinationFolderMode.Copy });

      if (!result.hasConflicts) {
        const resolvedItems = resolveConflictsWithStrategy(
          destinationFolder,
          files,
          false,
        );
        onCopyFiles?.(resolvedItems, destinationFolder);
        onCopySuccess?.();
        clearState();
      }
    },
    [
      copiedFiles,
      startConflictResolution,
      resolveConflictsWithStrategy,
      onCopyFiles,
      onCopySuccess,
      clearState,
    ],
  );

  const handleMoveTo = useCallback(
    (
      destinationFolder: string,
      sourceFolder?: string,
      files: DialFile[] = movedFiles,
    ) => {
      const sourceFolderPath =
        sourceFolder || (operationMetadata?.sourceFolder ?? '/');

      const result = startConflictResolution(destinationFolder, files, {
        type: DestinationFolderMode.Move,
        sourceFolderPath,
      });

      if (!result.hasConflicts) {
        const resolvedItems = resolveConflictsWithStrategy(
          destinationFolder,
          files,
          true,
        );
        onMoveToFiles?.(resolvedItems, sourceFolderPath, destinationFolder);
        onMoveSuccess?.();
        clearState();
      }
    },
    [
      movedFiles,
      startConflictResolution,
      resolveConflictsWithStrategy,
      onMoveToFiles,
      onMoveSuccess,
      clearState,
      operationMetadata,
    ],
  );

  const handleConflictReplace = useCallback(() => {
    baseHandleReplaceAll();
    clearState();
  }, [baseHandleReplaceAll, clearState]);

  const handleConflictDuplicate = useCallback(() => {
    baseHandleDuplicateAll();
    clearState();
  }, [baseHandleDuplicateAll, clearState]);

  const handleConflictCancel = useCallback(() => {
    baseHandleCancelAll();
    clearState();
  }, [baseHandleCancelAll, clearState]);

  const handleConflictDecideForEach = useCallback(
    (decisions: FileConflictDecision[]) => {
      baseHandleDecideForEach(decisions);
      clearState();
    },
    [baseHandleDecideForEach, clearState],
  );

  const handleDuplicate = useCallback(
    (files: DialFile[]) => {
      const destinationUrl = files.at(0)?.parentPath ?? '/';
      const resolvedItems = resolveConflictsWithStrategy(
        destinationUrl,
        files,
        false,
      );
      onCopyFiles?.(resolvedItems, destinationUrl);
      onDuplicateSuccess?.();
    },
    [onCopyFiles, onDuplicateSuccess, resolveConflictsWithStrategy],
  );

  const handleSetCopiedFiles = useCallback((files: DialFile[]) => {
    copiedFilesRef.current = files;
    setCopiedFiles(files);
  }, []);

  const handleSetMovedFiles = useCallback((files: DialFile[]) => {
    movedFilesRef.current = files;
    setMovedFiles(files);

    setOperationMetadata({
      type: DestinationFolderMode.Move,
      sourceFolder: files[0]?.parentPath ?? files[0]?.folderId,
    });
  }, []);

  /*
   * The host confirms after it has loaded the destination, so `confirm` must run the
   * handlers of the latest render: older ones would check conflicts against stale items.
   */
  const latestHandlersRef = useRef({ handleCopyTo, handleMoveTo });
  useEffect(() => {
    latestHandlersRef.current = { handleCopyTo, handleMoveTo };
  }, [handleCopyTo, handleMoveTo]);

  /* Hands the files set just before to the host, which picks the destination and confirms. */
  const handleRequestDestination = useCallback(
    (mode: DestinationFolderMode) => {
      const files =
        mode === DestinationFolderMode.Copy
          ? copiedFilesRef.current
          : movedFilesRef.current;
      const sourcePath = files[0]?.parentPath ?? files[0]?.folderId ?? '/';
      onDestinationRequest?.({
        mode,
        items: files,
        sourceFolder: sourcePath,
        confirm: (destinationFolder) => {
          if (mode === DestinationFolderMode.Copy) {
            latestHandlersRef.current.handleCopyTo(destinationFolder, files);
          } else {
            latestHandlersRef.current.handleMoveTo(
              destinationFolder,
              sourcePath,
              files,
            );
          }
        },
        cancel: () => {
          if (!hasActiveConflictRef.current) {
            clearState();
          }
        },
      });
    },
    [onDestinationRequest, hasActiveConflictRef, clearState],
  );

  return {
    handleDuplicate,
    handleRequestDestination,
    handleCopyTo,
    handleMoveTo,
    handleSetCopiedFiles,
    handleSetMovedFiles,
    clearState,
    conflictingFiles,
    conflictResolutionOpen,
    openConflictResolution,
    closeConflictResolution,
    handleConflictReplace,
    handleConflictCancel,
    handleConflictDuplicate,
    handleConflictDecideForEach,
  };
};
