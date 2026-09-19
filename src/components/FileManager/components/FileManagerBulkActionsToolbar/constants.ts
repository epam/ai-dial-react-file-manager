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
  'rounded bg-control-neutral-active px-1.5 py-0.5 dial-small-text font-semibold text-primary rounded-full';

export const bulkActionsGroupClassName = 'flex gap-3 items-center';
