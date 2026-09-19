import { BASE_ICON_SIZE } from '@epam/ai-dial-ui-kit';

export const ACTIONS_GAP = 12;
export const MORE_BUTTON_WIDTH = BASE_ICON_SIZE;
export const CONTAINER_PADDING = 8;

/*
 * The bar floats over the grid rather than replacing the content header, so it
 * is sized by its contents and bounded by the card it sits in: `max-w-full`
 * keeps the width measurement that drives action overflow meaningful on a
 * narrow grid.
 */
export const bulkActionsContainerClassName =
  'w-auto max-w-full rounded bg-layer-raised p-2 pl-3 flex items-center gap-3 shadow-lg border border-tertiary';

export const bulkActionsLabelClassName =
  'flex shrink-0 items-center gap-1 dial-body-text text-primary';

export const bulkActionsGroupClassName = 'flex gap-3 items-center';
