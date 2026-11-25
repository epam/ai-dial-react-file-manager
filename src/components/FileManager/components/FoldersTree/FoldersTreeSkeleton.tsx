import {
  Skeleton,
  SkeletonShimmer,
  SkeletonTone,
  SkeletonVariant,
  SKELETON_BAR_CLASS_NAME,
  SKELETON_BAR_HEIGHT,
  mergeClasses,
  useSkeletonTiming,
} from '@epam/ai-dial-ui-kit';
import type { FC, ReactNode } from 'react';
import { getSkeletonTone } from '@/constants/skeleton';

/*
 * Sidebar list recipe of the kit skeleton guide: bars only, 20 px high, 16 px
 * apart, 8 px from the left edge, fixed widths alternating dark / light. The
 * widths are the guide's 224 px sidebar example as fractions of the width.
 */
const BAR_WIDTHS = ['48%', '93%', '79%', '93%', '79%', '66%'];

/** Placeholder rows under a folder that is loading its children. */
const FOLDER_CHILDREN_ROW_COUNT = 3;

export interface FoldersTreeSkeletonProps {
  /** Announced to assistive technology; omit while the skeleton is hidden. */
  label?: string;
  /** Extra class, e.g. `useSkeletonTiming`'s `placeholderClassName`. */
  className?: string;
  /** Number of placeholder bars. Defaults to 6. */
  rows?: number;
}

/** Placeholder for the folders tree, or part of it, while it loads. */
export const FoldersTreeSkeleton: FC<FoldersTreeSkeletonProps> = ({
  label,
  className,
  rows = BAR_WIDTHS.length,
}) => (
  <SkeletonShimmer
    label={label}
    className={mergeClasses('flex flex-col gap-4 py-2 pl-2 pr-4', className)}
  >
    {BAR_WIDTHS.slice(0, rows).map((width, index) => (
      <Skeleton
        key={index}
        variant={SkeletonVariant.Text}
        width={width}
        height={SKELETON_BAR_HEIGHT}
        tone={getSkeletonTone(index)}
        className={mergeClasses('shrink-0', SKELETON_BAR_CLASS_NAME)}
      />
    ))}
  </SkeletonShimmer>
);

export interface FolderChildrenSkeletonProps {
  /** Left inset of the children's level, in px. */
  inset: number;
  /** Whether the folder is still loading its children. */
  loading: boolean;
}

/**
 * Placeholder rows under an expanded folder whose children are loading. The
 * parent keeps it mounted while the folder has no visible children, so it owns
 * the kit's skeleton timing: a fast load adds no rows at all, and a shown
 * skeleton stays for its minimum duration. The tree announces the loading
 * state once, in its own live region.
 */
export const FolderChildrenSkeleton: FC<FolderChildrenSkeletonProps> = ({
  inset,
  loading,
}) => {
  const { showSkeleton } = useSkeletonTiming(loading);
  if (!showSkeleton) return null;

  return (
    <div style={{ paddingLeft: `${inset}px` }}>
      <FoldersTreeSkeleton rows={FOLDER_CHILDREN_ROW_COUNT} />
    </div>
  );
};

/*
 * Name bar width in `ch` of the row's own font, about as wide as the name,
 * within these bounds. An absolute width: the row's name slot is sized by its
 * content, so a percentage width would resolve to 0.
 */
const MIN_NAME_BAR_CH = 4;
const MAX_NAME_BAR_CH = 24;

export interface FolderNameSkeletonProps {
  /** Size of the icon circle, in px. */
  iconSize: number;
  /** The folder's name; the bar is about as wide as it. */
  name: string;
  /** Row index among its siblings: even rows get the sunken tone, odd the base one. */
  index: number;
  /** Whether the folder is still loading its children. */
  loading: boolean;
  /** The row's real icon and name, shown until the skeleton delay has passed. */
  children: ReactNode;
}

/**
 * The icon and name of a loading folder. They stay as they are for the kit's
 * skeleton delay, so a fast load changes nothing; after it they are replaced
 * by a circle and a bar until the folder stops loading and the skeleton has
 * met its minimum duration. Decorative only: the row keeps the name as its
 * accessible name.
 */
export const FolderNameSkeleton: FC<FolderNameSkeletonProps> = ({
  iconSize,
  name,
  index,
  loading,
  children,
}) => {
  const { showSkeleton } = useSkeletonTiming(loading);
  if (!showSkeleton) return <>{children}</>;

  const nameWidthCh = Math.min(
    Math.max(name.length, MIN_NAME_BAR_CH),
    MAX_NAME_BAR_CH,
  );

  return (
    <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
      <Skeleton
        variant={SkeletonVariant.Circular}
        width={iconSize}
        height={iconSize}
        tone={SkeletonTone.Sunken}
        className="shrink-0"
      />
      <Skeleton
        variant={SkeletonVariant.Text}
        width={`${nameWidthCh}ch`}
        height={SKELETON_BAR_HEIGHT}
        tone={getSkeletonTone(index)}
        className={mergeClasses('shrink-0', SKELETON_BAR_CLASS_NAME)}
      />
    </span>
  );
};
