import {
  Skeleton,
  SkeletonShimmer,
  SkeletonVariant,
  SKELETON_BAR_CLASS_NAME,
  SKELETON_BAR_HEIGHT,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import type { FC } from 'react';
import { getSkeletonTone } from '@/constants/skeleton';
import {
  GRID_CLASS,
  LABEL_CLASS,
  LABEL_ROW_CLASSES,
  METADATA_SKELETON_BAR_WIDTHS,
  SKELETON_COLUMN_CLASS,
  type FileMetadataRow,
} from './constants';

export interface FileMetadataSkeletonProps {
  rows: FileMetadataRow[];
  /** Extra class for the shimmer, e.g. `useSkeletonTiming`'s `placeholderClassName`. */
  className?: string;
}

/**
 * The loading state of the file metadata popup body: the real labels, with
 * one shimmer over the value column while the metadata loads.
 *
 * It announces nothing itself: `FileMetadataContent` keeps one live region
 * mounted for the whole load.
 */
export const FileMetadataSkeleton: FC<FileMetadataSkeletonProps> = ({
  rows,
  className,
}) => (
  <div className={GRID_CLASS}>
    {rows.map(({ id, label }, index) => (
      <div
        key={id}
        className={mergeClasses(LABEL_CLASS, LABEL_ROW_CLASSES[index])}
      >
        {label}
      </div>
    ))}
    {/*
     * A subgrid, so every bar sits in the row of its label. Only the loaded
     * values are skeleton; the labels stay real.
     */}
    <SkeletonShimmer
      className={mergeClasses(
        'grid grid-rows-subgrid items-center',
        SKELETON_COLUMN_CLASS,
        className,
      )}
    >
      {rows.map(({ id }, index) => (
        <Skeleton
          key={id}
          variant={SkeletonVariant.Text}
          width={METADATA_SKELETON_BAR_WIDTHS[id]}
          height={SKELETON_BAR_HEIGHT}
          tone={getSkeletonTone(index)}
          className={SKELETON_BAR_CLASS_NAME}
        />
      ))}
    </SkeletonShimmer>
  </div>
);
