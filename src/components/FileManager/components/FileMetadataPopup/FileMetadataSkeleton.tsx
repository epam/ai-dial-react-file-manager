import {
  Skeleton,
  SkeletonShimmer,
  SkeletonVariant,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import type { FC } from 'react';
import { SKELETON_BAR_HEIGHT, getSkeletonBarClass } from '@/constants/skeleton';
import {
  GRID_CLASS,
  LABEL_CLASS,
  LABEL_ROW_CLASSES,
  SKELETON_BAR_WIDTHS,
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
 * one shimmer over the value column. Used both as the `Suspense` fallback
 * while the body's code loads and as the body's own loading state, so the two
 * waits read as one continuous skeleton.
 *
 * It announces nothing itself: `FileMetadataPopup` keeps one live region
 * mounted for the whole load, so the two waits are announced once.
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
          width={SKELETON_BAR_WIDTHS[id]}
          height={SKELETON_BAR_HEIGHT}
          className={getSkeletonBarClass(index)}
        />
      ))}
    </SkeletonShimmer>
  </div>
);
