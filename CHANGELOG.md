# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- **`unshareConfirmationOptions`** — opt-in confirmation before unsharing
  shared-with-me items from the tree, grid row, or bulk toolbar. Takes the
  same options as `deleteConfirmationOptions`; without it `onUnshareFiles`
  still fires straight from the action, so existing hosts are unaffected.
- **`deleteConfirmationOptions.closeLabel`** — accessible name of the delete
  confirmation's header close control, defaulting to `"Close dialog"`.
- **`deleteConfirmationOptions.titleRenderer` / `contentRenderer` — `items`** —
  both renderers now receive the items being deleted as a second argument,
  after the names, so a host can title the dialog "Delete folder" or "Delete
  file" by `nodeType`. Existing one-argument renderers keep working.
- **`DialFileManager.contentHeaderClassName`** — additional classes for the
  central content header, merged with the default header classes. Complements
  the existing `contentClassName`/`gridClassName` layout hooks.
- Initial standalone AI DIAL React File Manager package.
- **Layout class hooks** — `DialFileManager.contentClassName` and
  `gridOptions.containerClassName` add classes to the central content column
  and the grid-panel container. They are merged with the defaults, so a class
  such as `pb-0` or `shadow-none` overrides the matching default. These
  complement the existing root, layout, tree-panel, and underlying-grid class
  hooks.
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
- **`DialFoldersTree` — tree semantics and keyboard navigation** — the tree
  was click-only. Its root is now `role="tree"` (named by the new `ariaLabel`,
  default `"Folders"`) and each row a `role="treeitem"` carrying
  `aria-level`, `aria-expanded` (folders) and `aria-selected`, with a roving
  tabIndex. Arrow Up/Down and Home/End move focus, Arrow Right/Left expand,
  collapse or step to the parent (mirrored under `dir="rtl"`), and Enter/Space
  activate a row as a click does. New `autoFocus` focuses the selected row on
  mount and `onEscape` fires on Escape, so a host can render the tree inside a
  dismissible overlay. The root's `aria-label="folders-tree"` and each row
  wrapper's `aria-label="folder"` are gone — both were names on generic
  elements that no assistive technology announced.

- **`DialFoldersTree` — `selectOnCaretClick` / `showContextMenuButton`** —
  whether clicking a folder's caret also selects it, and whether rows show the
  hover "more" button that opens the `getContextMenuItems` menu (the
  right-click menu and `renderItemActions` stay either way). Both default to
  `true`; the compact view turns them off unless `treeOptions` sets them.
- **`DialFileManagerSortDropdown` — `iconOnly`** — renders a round icon-only
  trigger named by `label`. The compact view turns it on unless `sortOptions`
  sets it.
- **`toolbarOptions.moreActionsLabel`** — accessible name of the compact
  "more" menu trigger, defaulting to `"More actions"`.
- **`destinationFolderPopupOptions.getSourceItemsLabel` / `destinationLabel`**
  — text for the phone Copy/Move sheet: `getSourceItemsLabel(count)` names
  several items being copied or moved (default `"N items"`) and
  `destinationLabel` heads the folders tree (default `"Copy to folder"` /
  `"Move to folder"`). Both are also props of `DialDestinationFolderPopup`,
  together with `sourceItems`.
- **`destinationFolderPopupOptions.searchFoldersPlaceholder` /
  `searchEmptyStateTitle`** — the placeholder of the phone sheet's folder
  search (default `"Search folders"`) and the title shown when a search in the
  Copy/Move picker finds nothing (default `"No data"`).
- **`bulkActionsToolbarOptions.moreActionsLabel`** — accessible name and
  tooltip of the compact selection bar's overflow menu trigger, defaulting to
  `"More actions"`.

### Changed

- **The compact view follows the mobile design** — the folders panel, the
  breadcrumb trail and the content header give way to a card naming the current
  folder (or, while none is loaded, the active section). It opens into the
  section chips (one scrolling row) and the folders tree and fills the height
  above the search row; the grid stays mounted and keeps its columns and scroll
  position. Picking a folder, typing a search query, picking an action from the
  "more", Sort or Add menus, creating a folder, dropping files or pressing
  Escape in the tree closes it, and focus left inside returns to the card;
  switching sections or expanding a folder from its caret keeps it open. In the
  card the caret only expands a folder and rows drop the hover "more" button
  (the right-click menu stays). With several roots the tree lists them all, so
  the separate list of roots is gone. Search, the "more" menu (horizontal
  dots), an icon-only Sort and a round Add button share one row; the toolbar
  follows the file manager's compact view rather than the viewport width, hides
  the "more" menu when `showHiddenFilesToggle` is off and styles Add after
  `newButtonVariant`. Rows are 68px tall and read "date • size", and folder rows
  no longer start the date with an empty size slot. Host values for the new
  `treeOptions` and `sortOptions` props below win over the compact defaults.
  File and folder icons in the rows are 24px. The wide view is unchanged.
- **Copy/Move opens a bottom sheet on phones** — below 640px (viewport)
  `DialDestinationFolderPopup` renders a full-height kit `BottomSheet` instead
  of the popup: the item being copied or moved (or the count of several), a
  heading, a folder search, a folders-only tree and full-width confirm and
  Cancel buttons. The search filters the loaded folders by name, as the
  popup's search does, keeping the folders that lead to each match open.
  The tree opens on the picked folder and shows `rootItem.label` for the
  root. Picking a folder makes it the destination; the source folder keeps
  the confirm button disabled with its tooltip. The sheet has no Add folder or
  hidden-files controls, so `showCreateFolderButton` and
  `showHiddenFileSwitcher` apply to the popup only, and hidden folders stay
  hidden, in the search too. A non-string `header` falls back to `"Copy to"` /
  `"Move to"` as the sheet title. Wider screens keep the popup unchanged.
- **The compact view docks the selection bar** — while items are selected, the
  bar spans the bottom edge of the file manager over the grid, and the grid's
  scroll area gains a matching bottom inset so the last rows scroll clear of
  it. It shows the count, the clear control and the actions as 24px icons with
  tooltips; actions that don't fit move into a "more" menu at the end.
- **The delete confirmation follows the DIAL delete design** — Cancel is a
  text (ghost) button, Delete is a danger button led by a trash icon, and the
  header close control is shown. Before, the kit's default footer rendered a
  solid neutral Cancel, an icon-less Delete, and no close control. A string
  title from `titleRenderer` now also names the dialog.
- **The grid panel has rounded corners and a small shadow by default** — the
  grid no longer draws a wrapper border, and `gridOptions.wrapperBorder` is no
  longer exposed or honoured (breaking for consumers that configured it). The
  drag-over dashed outline now sits on the rounded grid panel instead of the
  inner grid, so it follows the corner radius. Use
  `gridOptions.containerClassName` to adjust the panel classes.
- **UI Kit moved to `0.15.0-dev.11`** — it brings `FilterChips`, the row the
  folders panel needs, the 2.0 `Breadcrumbs` the content header now heads with,
  and the public `DIAL_KIT_CLASS` names for the 2.0 components. The peer range
  moved with it: neither component existed in `0.15.0-dev.0`, so a host on an
  earlier dev build would crash rather than render them.
- **The breadcrumb trail is the 2.0 `Breadcrumbs`, drawn as the page heading
  (breaking)** — `DialFileManagerNavigationPanel` was still built on the 1.0
  `DialBreadcrumb`, which scrolls horizontally on overflow and carries no type
  scale of its own. It now renders the kit's `Breadcrumbs` at
  `BreadcrumbsSize.Heading` (`dial-h2-text`), so the trail reads as the content
  column's title rather than as a strip of small text above one. A trail
  longer than `maxVisibleItems` (4) collapses its middle behind an ellipsis
  menu instead of scrolling, and a clipped segment reveals its full label in a
  tooltip. The panel's prop surface follows the new component:
  `labelClassName` is now `itemClassName`, `size`, `maxVisibleItems` and
  `overflowAriaLabel` are new, and `onBeforeNavigate` is gone — the 2.0 trail
  has no navigation guard, so a host that needs one blocks in `onItemClick`.
  An undefined `path` now draws the root `/` item, since `Breadcrumbs` renders
  nothing at all when handed an empty trail.
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
- **`getSelectionLabel` returns the wording, not the whole label (breaking)** —
  the bar draws the count itself, as a badge beside the sentence, so the
  callback supplies only what goes next to it: `"items selected"`, not
  `"4 items selected"`. The count is still passed in, for pluralisation. A host
  that keeps interpolating the count into its string will render it twice.
- **The bulk actions row follows the design's order and colour (breaking)** —
  it runs Download, Move to, Copy to, Duplicate, Delete, with the destructive
  action last instead of fourth, and the two sharing actions grouped before it.
  The buttons are ghost accent rather than neutral, and `Delete` carries
  `danger`, so it paints in the danger colour here and in the overflow menu.
  The bar itself is 64px tall and sized by its contents.
- **The bulk actions bar floats over the grid instead of replacing the header
  (breaking)** — a live selection used to swap the whole toolbar row for the
  bulk bar, which took the breadcrumbs and the add button away mid-task. The bar
  is now a content-sized bar over the bottom of the grid card, and the header
  stays put. Its selection label is plain text rather than a button, and the
  selection is dropped through a close button of its own, named by
  `clearSelectionLabel`.
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

- **`NavigationPanelOptions.topLevelLabel`, `isTopLevel` and `onTopLevelClick`
  (breaking)** — 0.3.0 opened the compact view on a list of the roots when a
  host passed several (an "All" tab), with a leading breadcrumb segment named
  after the active tab that returned to the list; these props drove that
  segment. The compact navigation card now lists every root in its folders
  tree, so the list and the segment are gone. The file manager always overrode
  these values, so nothing changes at runtime.
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
- **The tree's built-in "collapse all" button (breaking)** — the panel heading
  carries the title and nothing else, so the control the kit sidebar's footer
  used to hold is gone, and with it the `useTreeAdditionalButtons` hook that
  built it. `treeOptions.additionalButtons` stays as a slot at the trailing
  edge of the heading row, but it is now empty unless the host fills it: a host
  that wants "collapse all" back renders its own button there and drives it
  from `treeOptions.onExpandedPathsChange`.
- **`managerLabel` (breaking)** — the node it rendered headed the toolbar row
  that no longer exists. The panel's own `treeOptions.header` titles the File
  Manager now, so the prop is gone from `DialFileManager`,
  `FileManagerProvider` and the context value.
- **The folders panel no longer resizes or collapses (breaking)** — it holds a
  fixed width as the page's left edge rather than a pane the user arranges, so
  the drag handle, its throttled width state and `treeOptions.width` are gone
  along with the kit's `ConditionalResizableContainer` and
  `CollapsibleSidebar`. The panel is its own `aside` landmark now that the kit
  sidebar is not there to be one, named by its heading.
  `treeOptions.containerClassName` still restyles the panel; its default is the
  panel's own surface rather than the old tree box.
- **`DialFileManagerNavigationPanel` — `backButtonLabel`** — the compact view no
  longer collapses the search into an icon, so the control this named is gone
  along with the `isCompactView` prop it belonged to.

### Fixed

- **`gridOptions.className` no longer replaces the grid's own classes** — it is
  merged with them, so the default minimum height and overflow, and the
  compact view's bottom inset under the selection bar, stay unless the host
  overrides them.

- **A leading-dot rename skipped every blocking check** — any name starting
  with `.` returned the non-blocking hidden-item warning straight away, so the
  duplicate-name check and the host's `onRenameValidate` never ran and a
  reserved name such as `.dial_folder` could be saved. The warning is now
  returned only after every blocking check passes.
- **The Copy/Move destination grid ignored its own loading state** — the
  popup grid's `loading` always followed the main grid's `filesLoading`, so it
  showed the empty state while the destination folder was still loading.
  `destinationFolderPopupOptions.filesLoading` now drives it, falling back to
  the main `filesLoading`.
- **The Copy/Move destination popup's layout didn't match Figma** — its grid
  sat flush against the popup edges with no spacing, and its tree panel drew
  no card background, shadow, or rounded corners, unlike the rest of the
  component. The grid now gets `gap-6 px-6 py-4`, and the tree panel gets the
  same `rounded-xl bg-layer-raised shadow-sm` treatment (and fixed
  `w-[360px] shrink-0` width) as the main folders panel from #56. The popup's
  tree header is now always hidden (it previously repeated whatever header the
  host's main tree happened to have, which is not configurable for the popup
  specifically) and the panel keeps top padding to compensate for the removed
  heading row.
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
- **A file could not be selected from the search results**
  ([epam/ai-dial-chat#8820](https://github.com/epam/ai-dial-chat/issues/8820)).
  Selected paths were resolved against the `items` tree alone, and a server-side
  search hit usually lives in a folder the tree has never loaded. So the path
  the grid reported on the click resolved to nothing, was treated as a stale
  selection, and was pruned away on the same render — the row never came back
  checked. Selection now falls back to `searchResults` when the tree does not
  hold the path, so a search hit selects like any other row while paths that
  exist in neither are still dropped.
