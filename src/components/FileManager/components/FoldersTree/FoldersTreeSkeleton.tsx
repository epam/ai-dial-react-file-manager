import {
  Skeleton,
  SkeletonShimmer,
  SkeletonVariant,
  mergeClasses,
  useSkeletonTiming,
} from '@epam/ai-dial-ui-kit';
import type { FC, ReactNode } from 'react';
import {
  SKELETON_BAR_HEIGHT,
  SKELETON_CIRCLE_CLASS,
  getSkeletonBarClass,
} from '@/constants/skeleton';

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
        className={mergeClasses('shrink-0', getSkeletonBarClass(index))}
      />
    ))}
  </SkeletonShimmer>
);

export interface FolderChildrenSkeletonProps {
  /** Left inset of the children's level, in px. */
  inset: number;
  /** Announced to assistive technology once the skeleton shows. */
  label?: string;
}

/**
 * Placeholder rows under an expanded folder whose children are loading. It is
 * mounted only while the folder loads and waits the kit's skeleton delay
 * before drawing, so a fast load adds no rows at all.
 */
export const FolderChildrenSkeleton: FC<FolderChildrenSkeletonProps> = ({
  inset,
  label,
}) => {
  // Mounted only while loading, so loading is always true here.
  const { showSkeleton } = useSkeletonTiming(true);
  if (!showSkeleton) return null;

  return (
    <div style={{ paddingLeft: `${inset}px` }}>
      <FoldersTreeSkeleton label={label} rows={FOLDER_CHILDREN_ROW_COUNT} />
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
  /** Row index among its siblings: even rows get the dark tone, odd the light one. */
  index: number;
  /** The row's real icon and name, shown until the skeleton delay has passed. */
  children: ReactNode;
}

/**
 * The icon and name of a loading folder. They stay as they are for the kit's
 * skeleton delay, so a fast load changes nothing; after it they are replaced
 * by a circle and a bar until the folder stops loading (this component is
 * mounted only while it loads). Decorative only: the row keeps the name as its
 * accessible name.
 */
export const FolderNameSkeleton: FC<FolderNameSkeletonProps> = ({
  iconSize,
  name,
  index,
  children,
}) => {
  // Mounted only while loading, so loading is always true here.
  const { showSkeleton } = useSkeletonTiming(true);
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
        className={mergeClasses('shrink-0', SKELETON_CIRCLE_CLASS)}
      />
      <Skeleton
        variant={SkeletonVariant.Text}
        width={`${nameWidthCh}ch`}
        height={SKELETON_BAR_HEIGHT}
        className={mergeClasses('shrink-0', getSkeletonBarClass(index))}
      />
    </span>
  );
};
