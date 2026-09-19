import { BASE_ICON_SIZE } from '@epam/ai-dial-ui-kit';

export const ACTIONS_GAP = 12;
export const MORE_BUTTON_WIDTH = BASE_ICON_SIZE;
export const CONTAINER_PADDING = 8;

/*
 * The strip the bar is centered in. It spans the space the caller gives it, and
 * it — not the bar — is what the overflow measurement reads: the bar is sized by
 * its contents, so measuring the bar would feed the collapse decision back into
 * its own input and settle on everything hidden.
 */
export const bulkActionsStripClassName = 'w-full flex justify-center';

export const bulkActionsContainerClassName =
  'w-auto max-w-full rounded bg-layer-raised p-2 pl-3 flex items-center gap-3 shadow-lg border border-tertiary';

export const bulkActionsLabelClassName =
  'flex shrink-0 items-center gap-1 dial-body-text text-primary';

export const bulkActionsGroupClassName = 'flex gap-3 items-center';
