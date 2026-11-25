/*
 * Shared look of the file manager's loading skeletons, from the kit skeleton
 * guide (`getEntityDetails("skeleton")` on the ui-kit MCP server): 20 px bars
 * with a 12 px radius, in a dark tone for primary lines and a light tone for
 * secondary ones, and 24 px circles for icons.
 */

const DARK_TONE_CLASS = 'bg-layer-sunken';
const LIGHT_TONE_CLASS = 'bg-layer-base';
const BAR_RADIUS_CLASS = 'rounded-xl';

/** Primary-tone bar: titles, names. */
export const SKELETON_DARK_BAR_CLASS = `${BAR_RADIUS_CLASS} ${DARK_TONE_CLASS}`;
/** Secondary-tone bar: subtitles, details. */
export const SKELETON_LIGHT_BAR_CLASS = `${BAR_RADIUS_CLASS} ${LIGHT_TONE_CLASS}`;
/** Circle placeholder (icons, avatars): the primary tone, round by variant. */
export const SKELETON_CIRCLE_CLASS = DARK_TONE_CLASS;

/** Height of every skeleton bar, in px. */
export const SKELETON_BAR_HEIGHT = 20;
/** Size of an icon circle in lists, in px. */
export const SKELETON_ICON_SIZE = 24;

/** Alternating bar tone for the row at `index`: dark, light, dark, … */
export const getSkeletonBarClass = (index: number): string =>
  index % 2 === 0 ? SKELETON_DARK_BAR_CLASS : SKELETON_LIGHT_BAR_CLASS;
