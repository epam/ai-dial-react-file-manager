import { BASE_ICON_SIZE, DIAL_KIT_ICON_STROKE } from '@epam/ai-dial-ui-kit';

/**
 * Icon stroke (1.5px) from the 2.0 stroke scale — one step above the 1px main
 * stroke that controls and standalone dividers use. Tabler renders every
 * outline icon at `stroke={2}` unless told otherwise, so the token has to be
 * passed explicitly: an icon that omits it draws heavier than the design system
 * asks for, and heavier than this package's own SVG assets, which are authored
 * at 1.5.
 *
 * Re-exported from the kit's `DIAL_KIT_ICON_STROKE` rather than written out
 * again, so the file manager's icons cannot drift from the ones the 2.0
 * components draw themselves. It keeps a name of its own because it is part of
 * this package's public surface: a host that never imports the kit directly
 * still needs a way to match the iconography.
 *
 * It is a number rather than a Tailwind utility because an icon's weight is an
 * SVG `stroke-width` attribute on the glyph, not a border on its box. The
 * border half of the same scale stays on plain Tailwind widths — `border`,
 * `border-2`, `border-4`.
 *
 * Exported publicly so icons a host passes in — a `NewAction`, a bulk action, a
 * context-menu entry, an empty-state override — can match the ones the file
 * manager draws itself.
 *
 * One deliberate departure: the empty-state illustrations render at a much
 * lighter stroke, since a 1.5px line reads as a drawing at 16px and as a fence
 * at 100px.
 */
export const FILE_MANAGER_ICON_STROKE = DIAL_KIT_ICON_STROKE;

/**
 * Drop-in replacement for the kit's 1.0 `BASE_ICON_PROPS`: the same 18px size,
 * on the 2.0 stroke. Spread onto a Tabler icon that should look like the rest
 * of the file manager's iconography.
 */
export const FILE_MANAGER_ICON_PROPS = {
  size: BASE_ICON_SIZE,
  stroke: FILE_MANAGER_ICON_STROKE,
};
