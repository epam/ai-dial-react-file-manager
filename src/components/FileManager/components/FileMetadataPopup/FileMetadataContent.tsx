import {
  EllipsisTooltip,
  LiveRegion,
  mergeClasses,
  useSkeletonTiming,
} from '@epam/ai-dial-ui-kit';
import { useEffect, useState, type FC, type ReactNode } from 'react';
import type { DialFile } from '@/models/file';
import { formatBytes, formatDate } from '@/components/FileManager/utils';
import {
  GRID_CLASS,
  LABEL_CLASS,
  PATH_CLASS,
  VALUE_CLASS,
  FileMetadataFieldId,
  type FileMetadataRow,
} from './constants';
import { FileMetadataSkeleton } from './FileMetadataSkeleton';

export interface FileMetadataContentProps {
  rows: FileMetadataRow[];
  fileMetadata?: DialFile;
  loading: boolean;
  loadingLabel: string;
  dateLocale: Intl.LocalesArgument;
  dateOptions?: Intl.DateTimeFormatOptions;
}

/** The body of the file metadata popup. */
export const FileMetadataContent: FC<FileMetadataContentProps> = ({
  rows,
  fileMetadata,
  loading,
  loadingLabel,
  dateLocale,
  dateOptions,
}) => {
  // The Popup mounts its body on open. Populate the live region in an effect
  // so it is already in the DOM before the loading text is added.
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    setAnnouncement(loading ? loadingLabel : '');
  }, [loading, loadingLabel]);

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

  let content: ReactNode = null;
  if (showPlaceholder) {
    content = (
      <FileMetadataSkeleton rows={rows} className={placeholderClassName} />
    );
  } else if (showContent && fileMetadata) {
    const values: Record<FileMetadataFieldId, ReactNode> = {
      [FileMetadataFieldId.Name]: <EllipsisTooltip text={fileMetadata.name} />,
      [FileMetadataFieldId.Modified]: (
        <EllipsisTooltip
          text={formatDate(fileMetadata.updatedAt, dateLocale, dateOptions)}
        />
      ),
      [FileMetadataFieldId.Size]: (
        <EllipsisTooltip text={formatBytes(fileMetadata.contentLength)} />
      ),
      [FileMetadataFieldId.Author]: (
        <EllipsisTooltip text={fileMetadata.author || '—'} />
      ),
      [FileMetadataFieldId.Path]: decodeURIComponent(fileMetadata.path),
    };

    content = (
      <div className={GRID_CLASS}>
        {rows.map(({ id, label }) => [
          <div key={`${id}-label`} className={LABEL_CLASS}>
            {label}
          </div>,
          <div
            key={`${id}-value`}
            className={mergeClasses(
              id === FileMetadataFieldId.Path ? PATH_CLASS : VALUE_CLASS,
              contentClassName,
            )}
          >
            {values[id]}
          </div>,
        ])}
      </div>
    );
  }

  return (
    <>
      <LiveRegion visuallyHidden>{announcement}</LiveRegion>
      {content}
    </>
  );
};
