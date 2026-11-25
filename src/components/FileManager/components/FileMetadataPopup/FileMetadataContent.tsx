import {
  EllipsisTooltip,
  mergeClasses,
  useSkeletonTiming,
} from '@epam/ai-dial-ui-kit';
import { useEffect, type FC, type ReactNode } from 'react';
import type { DialFile } from '@/models/file';
import { formatBytes, formatDate } from '@/components/FileManager/utils';
import {
  GRID_CLASS,
  LABEL_CLASS,
  PATH_CLASS,
  VALUE_CLASS,
  type FileMetadataFieldId,
  type FileMetadataRow,
} from './constants';
import { FileMetadataSkeleton } from './FileMetadataSkeleton';

export interface FileMetadataContentProps {
  rows: FileMetadataRow[];
  fileMetadata?: DialFile;
  loading: boolean;
  dateLocale: Intl.LocalesArgument;
  dateOptions?: Intl.DateTimeFormatOptions;
  /** Called once this body has mounted, i.e. its code has loaded. */
  onMount?: () => void;
}

/**
 * The body of the file metadata popup. Loaded lazily by `FileMetadataPopup`,
 * which shows `FileMetadataSkeleton` until this code arrives.
 */
export const FileMetadataContent: FC<FileMetadataContentProps> = ({
  rows,
  fileMetadata,
  loading,
  dateLocale,
  dateOptions,
  onMount,
}) => {
  useEffect(() => {
    onMount?.();
  }, [onMount]);

  /*
   * The popup is already open while it loads, so the skeleton shows at once
   * (`delay: 0`) instead of leaving a blank body for the default delay.
   */
  const {
    showPlaceholder,
    placeholderClassName,
    showContent,
    contentClassName,
  } = useSkeletonTiming(loading, { delay: 0 });

  if (showPlaceholder) {
    return (
      <FileMetadataSkeleton rows={rows} className={placeholderClassName} />
    );
  }

  if (!showContent || !fileMetadata) return null;

  const values: Record<FileMetadataFieldId, ReactNode> = {
    name: <EllipsisTooltip text={fileMetadata.name} />,
    modified: (
      <EllipsisTooltip
        text={formatDate(fileMetadata.updatedAt, dateLocale, dateOptions)}
      />
    ),
    size: <EllipsisTooltip text={formatBytes(fileMetadata.contentLength)} />,
    author: <EllipsisTooltip text={fileMetadata.author || '—'} />,
    path: decodeURIComponent(fileMetadata.path),
  };

  return (
    <div className={GRID_CLASS}>
      {rows.map(({ id, label }) => [
        <div key={`${id}-label`} className={LABEL_CLASS}>
          {label}
        </div>,
        <div
          key={`${id}-value`}
          className={mergeClasses(
            id === 'path' ? PATH_CLASS : VALUE_CLASS,
            contentClassName,
          )}
        >
          {values[id]}
        </div>,
      ])}
    </div>
  );
};
