import { BASE_ICON_SIZE } from '@epam/ai-dial-ui-kit';

export const ACTIONS_GAP = 12;
export const MORE_BUTTON_WIDTH = BASE_ICON_SIZE;
export const CONTAINER_PADDING = 8;

export const bulkActionsStripClassName = 'w-full flex justify-center';

/* 64px tall and sized by its contents, per the design. */
export const bulkActionsContainerClassName =
  'w-auto max-w-full h-16 rounded-[12px] bg-layer-base shadow-sm px-[24px] flex items-center gap-3';

export const bulkActionsLabelClassName =
  'flex shrink-0 items-center gap-1 dial-small-semi-text text-primary';

/* The count reads as a badge, so the number is legible apart from the wording. */
export const bulkActionsCountClassName =
  'rounded bg-control-neutral-active w-[22px] flex items-center justify-center h-[22px] dial-small-text font-semibold text-primary rounded-full';

export const bulkActionsGroupClassName = 'flex gap-3 items-center';

export const COMPACT_ACTIONS_GAP = 4;
export const COMPACT_CONTAINER_PADDING = 12;

/* Docked to the bottom edge in the compact view: full width, icon-only actions spread across it. */
export const compactBulkActionsContainerClassName =
  'w-full h-16 bg-layer-base border-t border-tertiary px-3 flex items-center gap-2';

/* A 24px circle that widens into a pill for longer counts. */
export const compactBulkActionsCountClassName =
  'h-6 min-w-6 px-1.5 flex shrink-0 items-center justify-center rounded-full bg-control-neutral-active dial-small-semi-text text-primary';

export const compactBulkActionsDividerClassName =
  'w-px h-[26px] bg-control-disable-primary';

/*
 * The action icons arrive pre-sized at 18px for the desktop bar; the mobile
 * design draws them at 24px in the same 40px buttons. Strokes keep their 1.5px
 * on screen, since the Move/Copy icons are drawn on an 18px grid and would
 * otherwise thicken as they scale up.
 */
export const compactBulkActionsGroupClassName =
  'flex flex-1 min-w-0 items-center justify-between gap-1 [&_svg]:size-6 [&_svg_*]:[vector-effect:non-scaling-stroke]';
