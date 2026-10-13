/*
 * Full screen height, as in the mobile design, instead of the kit's 85% cap; a
 * fixed height also keeps the sheet from jumping while folders load or expand.
 */
export const destinationSheetClassName = 'h-dvh max-h-dvh';

/* The kit body stops scrolling, so the footer stays put and only the content above it scrolls. */
export const destinationSheetScrollAreaClassName =
  'flex min-h-0 flex-1 flex-col overflow-hidden';

export const destinationSheetBodyClassName =
  'flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4';

export const destinationSheetSourceClassName =
  'flex h-12 shrink-0 items-center rounded-lg border border-tertiary bg-layer-sunken px-4';

export const destinationSheetSectionClassName = 'flex flex-col gap-4';

export const destinationSheetHeadingClassName =
  'dial-h3-text shrink-0 text-primary';

export const destinationSheetFooterClassName =
  'flex shrink-0 items-center gap-3 border-t border-tertiary p-4';
