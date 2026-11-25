import { LiveRegion, Popup, PopupSize } from '@epam/ai-dial-ui-kit';
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import type { DialFile } from '@/models/file';
import type { FileMetadataRow } from './constants';
import { FileMetadataSkeleton } from './FileMetadataSkeleton';

/*
 * The body is code-split: it downloads the first time the popup opens (the
 * kit `Popup` renders nothing while closed). Until then the popup shows the
 * same skeleton the body uses while metadata loads.
 */
const FileMetadataContent = lazy(() =>
  import('./FileMetadataContent').then((module) => ({
    default: module.FileMetadataContent,
  })),
);

/**
 * The popup's loading announcement. The kit `Popup` unmounts its content while
 * closed, so this region mounts on every open; a region that mounts with its
 * text already in it is often not announced, so the text is set one commit
 * after the region is in the DOM.
 */
const LoadingAnnouncement: FC<{ busy: boolean; label: string }> = ({
  busy,
  label,
}) => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <LiveRegion visuallyHidden>{isMounted && busy ? label : ''}</LiveRegion>
  );
};

export interface FileMetadataPopupProps {
  open: boolean;
  onClose: () => void;
  fileMetadata?: DialFile;
  loading?: boolean;
  header?: ReactNode;
  nameLabel?: string;
  pathLabel?: string;
  modifiedDateLabel?: string;
  sizeLabel?: string;
  authorLabel?: string;
  loadingLabel?: string;
  dateLocale?: Intl.LocalesArgument;
  dateOptions?: Intl.DateTimeFormatOptions;
}

/**
 * FileMetadataPopup
 *
 * A popup dialog for displaying file metadata information.
 * Shows file details like name, path, modified date, size, and author.
 * While the body's code or the metadata is loading, the values are replaced by
 * a kit skeleton (`SkeletonShimmer` + `useSkeletonTiming`); the labels stay
 * visible.
 *
 * @example
 * ```tsx
 * <FileMetadataPopup
 *   open={isOpen}
 *   onClose={handleClose}
 *   fileMetadata={file}
 *   loading={isLoading}
 *   title="Information"
 *   dateLocale="en-US"
 *   dateOptions={{ year: 'numeric', month: 'short', day: '2-digit' }}
 * />
 * ```
 *
 * @param open - Whether the popup is visible
 * @param onClose - Callback fired when the popup is closed
 * @param [fileMetadata] - File metadata to display
 * @param [loading] - Whether metadata is being loaded
 * @param [title="Information"] - Title of the popup
 * @param [nameLabel="Name:"] - Label for the name field
 * @param [pathLabel="Path:"] - Label for the path field
 * @param [modifiedDateLabel="Modified Date:"] - Label for the modified date field
 * @param [sizeLabel="Size:"] - Label for the size field
 * @param [authorLabel="Author:"] - Label for the author field
 * @param [loadingLabel="Loading file information"] - Text announced to assistive technology while loading
 * @param [dateLocale="en-US"] - Locale for date formatting
 * @param [dateOptions] - Options for date formatting
 */
export const FileMetadataPopup: FC<FileMetadataPopupProps> = ({
  open,
  onClose,
  fileMetadata,
  loading = false,
  header = 'Information',
  nameLabel = 'Name:',
  pathLabel = 'Path:',
  modifiedDateLabel = 'Modified Date:',
  sizeLabel = 'Size:',
  authorLabel = 'Author:',
  loadingLabel = 'Loading file information',
  dateLocale = 'en-US',
  dateOptions,
}) => {
  const rows = useMemo<FileMetadataRow[]>(
    () => [
      { id: 'name', label: nameLabel },
      { id: 'modified', label: modifiedDateLabel },
      { id: 'size', label: sizeLabel },
      { id: 'author', label: authorLabel },
      { id: 'path', label: pathLabel },
    ],
    [nameLabel, modifiedDateLabel, sizeLabel, authorLabel, pathLabel],
  );

  /*
   * The lazy body's code has loaded once it mounts, and stays loaded. Until
   * then the popup is waiting for it, the same as it waits for `loading`.
   */
  const [isBodyLoaded, setIsBodyLoaded] = useState(false);
  const handleBodyMount = useCallback(() => setIsBodyLoaded(true), []);

  return (
    <Popup
      open={open}
      onClose={onClose}
      size={PopupSize.Sm}
      header={header}
      ariaLabel="File information"
    >
      <div className="px-6 py-4">
        {/*
         * One live region for both waits (the body's code, then the
         * metadata), mounted for as long as the popup is open, so the load is
         * announced once rather than by each skeleton as it mounts.
         */}
        <LoadingAnnouncement
          busy={loading || !isBodyLoaded}
          label={loadingLabel}
        />
        <Suspense fallback={<FileMetadataSkeleton rows={rows} />}>
          <FileMetadataContent
            rows={rows}
            fileMetadata={fileMetadata}
            loading={loading}
            dateLocale={dateLocale}
            dateOptions={dateOptions}
            onMount={handleBodyMount}
          />
        </Suspense>
      </div>
    </Popup>
  );
};
