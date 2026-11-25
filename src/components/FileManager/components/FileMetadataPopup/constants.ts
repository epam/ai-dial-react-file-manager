/** Two columns: labels (100 px), then values. */
export const GRID_CLASS =
  'grid grid-cols-[100px_1fr] gap-4 items-center dial-small-text';

export const LABEL_CLASS = 'text-secondary';
export const VALUE_CLASS = 'text-primary min-w-0';
export const PATH_CLASS = 'text-primary break-words min-w-0';

export enum FileMetadataFieldId {
  Name = 'name',
  Modified = 'modified',
  Size = 'size',
  Author = 'author',
  Path = 'path',
}

export interface FileMetadataRow {
  id: FileMetadataFieldId;
  label: string;
}

/*
 * The skeleton places each label in its own row of the first column and spans
 * the value column with one shimmer. The popup always has these five fields,
 * so the placement is written out as literal classes Tailwind can see.
 */
export const LABEL_ROW_CLASSES = [
  'col-start-1 row-start-1',
  'col-start-1 row-start-2',
  'col-start-1 row-start-3',
  'col-start-1 row-start-4',
  'col-start-1 row-start-5',
] as const;
export const SKELETON_COLUMN_CLASS = 'col-start-2 row-start-1 row-span-5';

/**
 * Skeleton bar width per field: fixed, varied so the placeholder reads as
 * text. The tone alternates by row (`getSkeletonTone`).
 */
export const SKELETON_BAR_WIDTHS: Record<FileMetadataFieldId, string> = {
  [FileMetadataFieldId.Name]: '70%',
  [FileMetadataFieldId.Modified]: '55%',
  [FileMetadataFieldId.Size]: '40%',
  [FileMetadataFieldId.Author]: '60%',
  [FileMetadataFieldId.Path]: '100%',
};
