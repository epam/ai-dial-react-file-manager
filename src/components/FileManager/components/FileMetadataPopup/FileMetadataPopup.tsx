import { Popup, PopupSize } from '@epam/ai-dial-ui-kit';
import { useMemo, type FC, type ReactNode } from 'react';
import type { DialFile } from '@/models/file';
import { FileMetadataFieldId, type FileMetadataRow } from './constants';
import { FileMetadataContent } from './FileMetadataContent';

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
 * While the metadata is loading, the values are replaced by a kit skeleton
 * (`SkeletonShimmer` + `useSkeletonTiming`); the labels stay visible.
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
      { id: FileMetadataFieldId.Name, label: nameLabel },
      { id: FileMetadataFieldId.Modified, label: modifiedDateLabel },
      { id: FileMetadataFieldId.Size, label: sizeLabel },
      { id: FileMetadataFieldId.Author, label: authorLabel },
      { id: FileMetadataFieldId.Path, label: pathLabel },
    ],
    [nameLabel, modifiedDateLabel, sizeLabel, authorLabel, pathLabel],
  );

  return (
    <Popup
      open={open}
      onClose={onClose}
      size={PopupSize.Sm}
      header={header}
      ariaLabel="File information"
    >
      <div className="px-6 py-4">
        <FileMetadataContent
          rows={rows}
          fileMetadata={fileMetadata}
          loading={loading}
          loadingLabel={loadingLabel}
          dateLocale={dateLocale}
          dateOptions={dateOptions}
        />
      </div>
    </Popup>
  );
};
