# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial standalone AI DIAL React File Manager package.
- **`DialFileManagerNavigationPanel` — `backButtonLabel`** — accessible name of
  the control that collapses the expanded search in compact mode, defaulting to
  `"Back"`. The control carried no name at all, so it was announced as a bare
  "button".

### Changed

- **UI Kit moved to `0.14.0-dev.13`** — the Tailwind token scales in
  `tailwind.config.js` now mirror the kit's 0.14.0 set: the control tokens are
  named by role (`bg-control-disable-primary`, `text-control-accent-hover`,
  `bg-control-neutral-hover-muted`), `border-hover-alpha` is gone in favour of
  `border-accent-alpha`, the focus tokens are back to `focus` / `accent-focus`,
  the accent gradient is themed through `--bg-gradient-*`, and a `fill` scale
  was added so the 2.0 tooltip arrow is painted.
  dev.13 also carries the kit fix for `Grid`: a host passing
  `additionalGridOptions.rowSelection` used to replace the grid's own selection
  config wholesale, which put a second checkbox column beside the grid's own.
- **Shadows are themed per step** — each step reads its own variable named after
  the step rather than the hue: `--shadow-xs-sm-1` / `--shadow-xs-sm-2` for the
  two layers `shadow-xs` and `shadow-sm` share (blue wide, grey tight — the
  reverse of 0.13.0), and `--shadow-md` / `--shadow-lg` for the single blue
  layer those steps now draw. `--shadow-blue-500` and `--shadow-grey-1000` are
  no longer read; a theme that sets them must move the values to the new names.
- **Generation 2.0 components replace their 1.0 counterparts** — `Tooltip`,
  `TooltipContainer`/`Trigger`/`Content`, `EllipsisTooltip`, `RadioGroup` (the
  conflict-resolution choices, previously `DialRadioGroup`),
  `CollapsibleSidebar` and `ConditionalResizableContainer` around the folders
  tree, `Grid` for both the file grid and the conflict grid, `NoDataContent` for
  the empty states, `DateCellRenderer` with its `DEFAULT_DATE_LOCALE` /
  `DEFAULT_DATE_FORMAT_OPTIONS` / `convertToDate` helpers, and `Checkbox` /
  `Switch` in the stories. The 2.0 grid draws its selection column with the 2.0
  `Checkbox` and `Radio` — so select-all reaches the `mixed` state — and honours
  a `sort` declared on a column, which 1.0 stripped on startup. The 2.0 sidebar
  is itself the
  named landmark for the tree panel, so the `aside` that wrapped it is now a
  plain layout box — the tree was being announced twice — and its
  `containerClassName` is passed through as `className`; the `containerClassName`
  prop of `DialFileManager` is unchanged. The tooltip bubble is now the kit's
  inverted surface
  instead of the local one-off styling, which also drops three class names that
  resolved to nothing (`bg-ui-popover`, `fill-ui-popover`,
  `border-ui-outline-primary`).

### Fixed

- **Bulk-action icons were pinned to `text-secondary`**, so every icon in the
  selection toolbar stayed grey while the `NeutralButton` around it drew its
  label in `text-accent` — an icon and its own label in two different colours.
  The class also outlived the button's hover and disabled states, which it knew
  nothing about. The icons now inherit `currentColor`, so they follow the button
  in the toolbar and the row colour — including `danger` and disabled — in the
  overflow dropdown, which renders the same nodes.
- Two colour class names that Tailwind emitted nothing for:
  `bg-bg-control-accent-alpha` on a selected folder-tree row and
  `text-text-visual-violet-1` on the conflict "Replace" dot.
- **The navigation panel's compact-mode collapse control was a filled label
  button** squeezed into an icon with `!p-[9px]`. A 2.0 button is a pill, so it
  rendered as a filled circle next to the search field, reading as a second
  field. It is now a `GhostIconButton` at the field's own 40px.
- **The search field's focus ring was clipped.** A focused 2.0 field paints its
  ring as an `outline` at `outline-offset-0`, in the 1px immediately outside its
  box, and the panel row sat flush against the `overflow-hidden` grid wrapper.
  The row now keeps 1px of padding, and the breadcrumb strip moves from 38px to
  40px so it matches the field and the control beside it.
- **This package's own utility classes were missing from the CSS it ships.** The
  Tailwind `content` globs covered the ui-kit and a path from the chat app, but
  not `src`, so any class the kit happens not to use — `p-px`, `py-[2px]` —
  resolved to nothing here and only rendered in a host that scans our `dist`
  itself.
