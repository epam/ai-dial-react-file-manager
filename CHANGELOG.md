# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Initial standalone AI DIAL React File Manager package.
- **`DialFileManagerSearchBar`** — the search field as a component of its own,
  full width at the head of the grid card. It takes the search props the
  navigation panel used to carry, plus `placeholder`, which the panel omitted,
  so the field can name the folder it searches ("Search in My files...").
- **`treeOptions.tabs` / `activeTab` / `onTabChange` / `tabsAriaLabel`** — the
  filter row in the folders panel. The tabs scope both the tree and the grid, so
  they now sit above the tree they filter instead of in the toolbar.
- **`DialFileManagerBulkActionsToolbar` — `clearSelectionLabel`** — accessible
  name of the control that drops the selection, defaulting to
  `"Clear selection"`.

### Changed

- **UI Kit moved to `0.15.0-dev.9`** — it brings `FilterChips`, the row the
  folders panel needs, and the public `DIAL_KIT_CLASS` names for the 2.0
  components. The peer range moved with it: `FilterChips` did not exist in
  `0.15.0-dev.0`, so a host on an earlier dev build would crash rather than
  render a filter row.
- **The storage sections are filter chips, not tabs (breaking)** — the row
  scopes one list to a subset of itself, which is what `FilterChips` is for;
  `Tabs` underlines an option and reads as navigation between panels. The row
  is a named `role="group"` of `aria-pressed` toggles instead of a
  `tablist`, and it is named from the panel's own visible heading, falling back
  to `treeOptions.tabsAriaLabel` when there is no heading to point at. The item
  shape moved with the component: `treeOptions.tabs` takes
  `{ value, label }` rather than `{ id, label }`, and `useDialFileManagerTabs`
  returns the new shape. `count` and `disabled` are gone — a chip row has no
  disabled chip, so an option the user must not pick is left out of `tabs`.
  `treeOptions.activeTab` is typed `DialFileManagerTabs` rather than `string`,
  since the search behind it always branched on the enum.
- **The content header replaces the full-width toolbar row (breaking)** — the
  layout now follows the 2.0 File Manager design. The tab row moved out of
  `toolbarOptions` into `treeOptions`, so it sits in the folders panel above the
  tree it scopes; `toolbarOptions.tabs`, `activeTab` and `onTabChange` are gone.
  The toolbar itself is no longer a row of its own above the sidebar: the
  hidden-files switch and the add button sit at the trailing edge of the content
  column's header, on the same line as the breadcrumb trail. The trail lost its
  raised plaque and reads as plain text on the page, and the search field left
  the trail's right-hand side for the head of the grid card, where it spans the
  full width. Its props still arrive through `navigationPanelOptions`, so a host
  configuring search needs no change; a host rendering
  `DialFileManagerNavigationPanel` directly does, as the panel is breadcrumbs
  only now.
- **The bulk actions bar floats over the grid instead of replacing the header
  (breaking)** — a live selection used to swap the whole toolbar row for the
  bulk bar, which took the breadcrumbs and the add button away mid-task. The bar
  is now a content-sized bar over the bottom of the grid card, and the header
  stays put. Its selection label is plain text rather than a button:
  `getSelectionLabel` may return a node, and the selection is dropped through a
  close button of its own, named by `clearSelectionLabel`.
- **`NavigationPanelOptions` lists only the search props it forwards** — the
  type used to carry the whole input surface through `DialSearchProps`, but
  `readOnly`, `name` and the focus handlers never reached the field. It now
  picks the eight that do — `elementId`, `placeholder`, `size`,
  `withoutBorder`, `disabled`, `invalid`, `searchClassName`,
  `searchContainerClassName` — so a no-op stops type-checking instead of
  silently doing nothing.
- **`treeOptions.header` is visible while the panel is expanded** — the kit's
  `CollapsibleSidebar` paints its `title` only on the collapsed rail, so the
  expanded folders panel carried no heading at all. It now renders the same
  `header` as a heading above the tab row, the way the design titles the panel.
  A host that passed `header` only for the collapsed rail will see it in both
  states.
- **The compact view no longer collapses the search into an icon** — the field
  stays open across widths, so `isCompactView` and `backButtonLabel` left
  `DialFileManagerNavigationPanel` with the expand-and-collapse behaviour they
  drove.
- **UI Kit moved to `0.14.0-dev.15`** — the Tailwind token scales in
  `tailwind.config.js` now mirror the kit's 0.14.0 set: the control tokens are
  named by role (`bg-control-disable-primary`, `text-control-accent-hover`,
  `bg-control-neutral-hover-muted`), `border-hover-alpha` is gone in favour of
  `border-accent-alpha`, the focus tokens are back to `focus` / `accent-focus`,
  the accent gradient is themed through `--bg-gradient-*`, and a `fill` scale
  was added so the 2.0 tooltip arrow is painted.
  dev.13 also carries the kit fix for `Grid`: a host passing
  `additionalGridOptions.rowSelection` used to replace the grid's own selection
  config wholesale, which put a second checkbox column beside the grid's own.
  dev.14 lands the kit half of the stroke and shadow scales described below,
  which this package had mirrored in its own token config ahead of the release:
  the icon stroke is a published token, and `Grid` draws its row, header-row
  and header-column dividers on the 0.5px thin stroke instead of the 1px main
  one, so a dense file grid reads as rows of data rather than a set of boxes —
  the table frame and the pinned-column boundary stay on the main stroke.
  dev.15 gives the 2.0 resize handle its chevron back, so the draggable edge of
  the folders-tree panel is marked by an arrow again instead of a bare accent
  line.
- **Shadows are themed per step** — each step reads its own variable named after
  the step rather than the hue: `--shadow-xs-1` / `--shadow-xs-2` for the two
  layers `shadow-xs` draws (blue wide, grey tight — the reverse of 0.13.0), and
  `--shadow-sm` / `--shadow-md` / `--shadow-lg` for the single blue layer each of
  those steps now draws. The scale reads xs, sm, md, lg with `sm` as the side
  bar / side panel / right panel step (`0 8px 10px`, blue-500 alpha-8) and `md` a
  notch stronger at alpha-6; `sm` used to hold the resting shadow of a solid
  control, which now lives in the kit's `dial-kit-control-shadow` class. Nothing
  in this package draws a shadow, so the change is a token surface only — but
  `shadow-sm` is safelisted so the panel step survives into the shipped
  stylesheet. `--shadow-blue-500` and `--shadow-grey-1000` are no longer read; a
  theme that sets them must move the values to the new names.
- **Icons are on the 1.5px stroke of the 2.0 scale.** Tabler draws every outline
  icon at `stroke={2}` unless told otherwise, so the file manager's icons were a
  step heavier than the design system asks for — and heavier than this package's
  own SVG assets, which are authored at 1.5. `FILE_MANAGER_ICON_PROPS` replaces
  the kit's 1.0 `BASE_ICON_PROPS` at every internal call site (same 18px size,
  new stroke), and both it and `FILE_MANAGER_ICON_STROKE` are exported so icons a
  host passes in — a `NewAction`, a bulk action, a context-menu entry — can
  match. `FILE_MANAGER_ICON_STROKE` re-exports the kit's `DIAL_KIT_ICON_STROKE`
  rather than repeating the value, so the file manager's icons cannot drift from
  the ones the 2.0 components draw themselves. The empty-state illustrations
  keep their much lighter stroke: 1.5px reads as a drawing at 16px and as a
  fence at 100px.
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

### Removed

- **`toolbarOptions.hiddenFilesSwitcherLabel` (breaking)** — the hidden-files
  toggle carried two labels: a static one naming the control and a pair naming
  the action. It now reads only the pair, so the toggle says what the click
  leads to — `showHiddenFilesLabel` while hidden files are out of sight,
  `hideHiddenFilesLabel` while they are shown — in the header as well as in the
  compact menu, and the static label is gone. A host that set only
  `hiddenFilesSwitcherLabel` now shows the `"Show hidden files"` /
  `"Hide hidden files"` defaults and should move its translation onto the pair.
  `DestinationFolderPopup` keeps a `hiddenFilesSwitcherLabel` of its own; that
  one is untouched.
- **`managerLabel` (breaking)** — the node it rendered headed the toolbar row
  that no longer exists. The panel's own `treeOptions.header` titles the File
  Manager now, so the prop is gone from `DialFileManager`,
  `FileManagerProvider` and the context value.
- **The folders panel no longer resizes or collapses (breaking)** — it holds a
  fixed width as the page's left edge rather than a pane the user arranges, so
  the drag handle, its throttled width state and `treeOptions.width` are gone
  along with the kit's `ConditionalResizableContainer` and
  `CollapsibleSidebar`. The panel is its own `aside` landmark now that the kit
  sidebar is not there to be one, named by its heading, and the "collapse all"
  control — with whatever `treeOptions.additionalButtons` adds before it —
  moved from the sidebar footer to the trailing edge of the heading row.
  `treeOptions.containerClassName` still restyles the panel; its default is the
  panel's own surface rather than the old tree box.
- **`DialFileManagerNavigationPanel` — `backButtonLabel`** — the compact view no
  longer collapses the search into an icon, so the control this named is gone
  along with the `isCompactView` prop it belonged to.

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
