# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial standalone AI DIAL React File Manager package.

### Changed

- **UI Kit moved to `0.14.0-dev.9`** — the Tailwind token scales in
  `tailwind.config.js` now mirror the kit's 0.14.0 set: the control tokens are
  named by role (`bg-control-disable-primary`, `text-control-accent-hover`,
  `bg-control-neutral-hover-muted`), `border-hover-alpha` is gone in favour of
  `border-accent-alpha`, the focus tokens are back to `focus` / `accent-focus`,
  the accent gradient is themed through `--bg-gradient-*`, and a `fill` scale
  was added so the 2.0 tooltip arrow is painted.
- **Shadows are themed per step** — each step reads its own variable named after
  the step rather than the hue: `--shadow-xs-sm-1` / `--shadow-xs-sm-2` for the
  two layers `shadow-xs` and `shadow-sm` share (blue wide, grey tight — the
  reverse of 0.13.0), and `--shadow-md` / `--shadow-lg` for the single blue
  layer those steps now draw. `--shadow-blue-500` and `--shadow-grey-1000` are
  no longer read; a theme that sets them must move the values to the new names.
- **Generation 2.0 components replace their 1.0 counterparts** — `Tooltip`,
  `TooltipContainer`/`Trigger`/`Content`, `EllipsisTooltip`, `RadioGroup` (the
  conflict-resolution choices, previously `DialRadioGroup`), and `Checkbox` /
  `Switch` in the stories. The tooltip bubble is now the kit's inverted surface
  instead of the local one-off styling, which also drops three class names that
  resolved to nothing (`bg-ui-popover`, `fill-ui-popover`,
  `border-ui-outline-primary`).

### Fixed

- Two colour class names that Tailwind emitted nothing for:
  `bg-bg-control-accent-alpha` on a selected folder-tree row and
  `text-text-visual-violet-1` on the conflict "Replace" dot.
