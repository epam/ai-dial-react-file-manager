# AI DIAL React File Manager

`@epam/ai-dial-react-file-manager` is the reusable React file manager used by
AI DIAL interfaces. Shared controls and design tokens come from
`@epam/ai-dial-ui-kit`; the file tree, file operations, upload flows, selection,
conflict resolution, and file-manager-specific styles live in this package.

The package is ESM-only and is intended for React applications that supply
their own persistence and backend integration through callbacks.

## Features

- File and folder navigation with tree, breadcrumb, and grid views
- Upload, download, copy, move, rename, delete, and conflict-resolution flows
- Controlled and uncontrolled navigation and selection state
- Configurable actions, validation, metadata, and permission-management hooks
- Responsive layouts and reusable standalone file-manager components

## Compatibility

| File manager               | AI DIAL UI Kit   | React     | AG Grid   | Module format |
| -------------------------- | ---------------- | --------- | --------- | ------------- |
| Current development branch | `^0.17.0-dev.16` | `^19.2.5` | `^35.2.1` | ESM           |

## Installation

Install the package together with its peer dependencies:

```bash
npm install @epam/ai-dial-react-file-manager @epam/ai-dial-ui-kit \
  ag-grid-community ag-grid-react react react-dom
```

`@tabler/icons-react` is not in that list any more: this package imports the
icon set itself, so it ships as a dependency and npm installs it for you (see
[issue epam/ai-dial-chat#8719](https://github.com/epam/ai-dial-chat/issues/8719)).
AG Grid stays a peer — the grid engine needs exactly one copy per host, or its
module registration breaks — and so does the UI Kit, the design-system
singleton a host renders with directly.

Import the UI Kit stylesheet first, followed by the file manager stylesheet:

```ts
import '@epam/ai-dial-ui-kit/styles.css';
import '@epam/ai-dial-react-file-manager/styles.css';
```

## Usage

```tsx
import {
  DialFileManager,
  DialFileNodeType,
  type DialFile,
} from '@epam/ai-dial-react-file-manager';

const files: DialFile[] = [
  {
    id: 'documents',
    folderId: 'documents',
    name: 'Documents',
    path: '/Documents',
    nodeType: DialFileNodeType.FOLDER,
    items: [],
  },
];

export const Files = () => (
  <DialFileManager
    items={files}
    defaultPath="/Documents"
    onPathChange={(path) => console.info(path)}
  />
);
```

`DialFileManager` manages the interaction state and calls consumer-provided
handlers for persistence. The consuming application remains responsible for
loading items, calling backend APIs, handling errors, and updating the `items`
prop after an operation completes.

Common integration callbacks include:

- `onPathChange` and `onSelectedPathsChange`
- `onUploadFiles`, `onUploadArchive`, and `onValidateUpload`
- `onUploadValidationError`, to show upload rejections (oversized or
  unsupported files) in the host's own UI instead of the built-in message
- `onCopyFiles`, `onMoveToFiles`, and `onDeleteFiles`
- `onDownloadFiles`, `onUnshareFiles`, and `onRemoveFilesAccess`
- `onManagePermissions`, `onPreview`, and `onOpenInNewTab`
- `onDestinationRequest`, called when the user starts Copy or Move so the host can show its own destination UI instead of the built-in panel (see below), and `destinationPanelOptions` for the text of that panel

### Copy and Move destination

By default Copy and Move open a built-in `FolderDestinationPanel` over the file manager's own folders: it lists the loaded folders, offers folder creation through `onCreateFolder`, disables the folder a Move starts from and, for a moved folder, itself and its subfolders, and runs the same conflict resolution and `onCopyFiles` / `onMoveToFiles` flow when the user confirms. Its text comes from `destinationPanelOptions` (`copyTitle`, `moveTitle`, `copyLabel`, `moveLabel`, `rootLabel`, `getSourceItemsLabel`, `disabledPathTooltip`, `movedIntoItselfTooltip`, `labels`, `panelLabels`) and `excludedPaths` leaves folders out of it.

A host that wants its own destination UI passes `onDestinationRequest`, which replaces the built-in panel. When the user chooses Copy or Move, the file manager calls it with a `DialDestinationRequest` (`mode`, `items`, `sourceFolder`, `confirm`, `cancel`). Show `FolderDestinationPanel` (see below) or your own UI, then call `request.confirm(destinationFolder)` to run the operation — name conflicts are resolved first, and the result reaches `onCopyFiles` / `onMoveToFiles` — or `request.cancel()` if the user dismisses it. Conflicts are checked against the files the file manager already holds for the destination folder. The panel lists folders only, so for a folder the user never opened in the grid, load its contents first and pass them as the second argument — `request.confirm(destinationFolder, destinationItems)` — otherwise existing files with the same names are not detected and can be overwritten.

Upgrading from 0.4.x? See the Breaking Changes in the [CHANGELOG](CHANGELOG.md).

### Folder destination panel

`FolderDestinationPanel` is an end-edge side panel that shows the item being acted on and a folder hierarchy to choose a destination from. `FolderDestinationTree` is the hierarchy on its own, in a single-root form (`items`, `selectedPath`) or a multi-root form (`roots`, `destination`). The panel renders its primary button from a host-supplied `action`, takes its text through `labels` and `panelLabels`, is themed through the same theme tokens as the rest of the file manager (`styles/theme.scss`; there are no per-component color props), and has two layouts: `FolderDestinationLayout.Steps` (a main view and a Change-folder view) and `FolderDestinationLayout.Inline` (search and hierarchy in one view, no Change or Select step).

```tsx
import {
  FolderDestinationLayout,
  FolderDestinationPanel,
  type FolderDestination,
  type FolderDestinationRoot,
} from '@epam/ai-dial-react-file-manager';

// `request` comes from `onDestinationRequest`; `destination`, `setDestination`, `setRequest`, `createFolder`,
// `loadFolderItems` and `showToast` are the host's own.
// The panel reports a `FolderDestination` (`rootKey` + `path`); turning it into the file manager's folder path is up to the host.
const toFolderPath = ({ rootKey, path }: FolderDestination) =>
  [rootKey, ...path].join('/');
const roots: FolderDestinationRoot[] = [
  {
    key: 'files',
    label: 'Files',
    items: [{ path: ['Reports'], name: 'Reports' }],
  },
];

<FolderDestinationPanel
  isOpen={request != null}
  onClose={() => {
    request.cancel();
    setRequest(null);
  }}
  layout={FolderDestinationLayout.Inline}
  item={{ title: 'report.pdf' }}
  roots={roots}
  destination={destination}
  onDestinationChange={setDestination}
  onCreateFolder={async (rootKey, parentPath, name) =>
    createFolder(rootKey, parentPath, name)
  }
  onCreateFolderError={(error) => showToast(String(error))}
  action={{
    label: 'Copy',
    onClick: async () => {
      const folder = toFolderPath(destination);
      // Load the destination's files so name conflicts are detected.
      request.confirm(folder, await loadFolderItems(folder));
      setRequest(null); // closes the panel
    },
  }}
/>;
```

`FolderDestinationPanelBody` is the panel's content without the drawer (the item summary and destination, or the search and tree), exported for a host that renders it in its own container; it takes the panel's props plus `view`, `onChangeFolderClick`, `pendingDestination` and `onPendingDestinationChange`, and the `FolderDestinationPanelBody` stories show each view.

The panel knows nothing about the host: `item.summary` replaces the title-only summary row with a node the host renders (for example an entity header). If `onCreateFolder` rejects, the new folder is not selected and `onCreateFolderError` is called; the panel shows no message of its own, so the host reports the failure. Folder helpers (`getFolderNameError`, `getNextFolderNameFromNames`, `toFolderPathKey`, `fromFolderPathKey`) are exported alongside; `getFolderNameError` and `getNextFolderNameFromNames` are the same validation and default-naming the grid uses, and `onValidateFolderName` adds the host's own name check. `getDisabledReason(destination)` disables a folder as a destination, and `canCreateFolderIn(destination)` keeps a folder selectable but offers no folder creation inside it (no "Create new folder", "Add child", or "Add sibling" on its children), for a host that would not list a folder created there.

## Public API

The primary export is `DialFileManager`. The package also exports:

- `FileManagerProvider` and `useFileManagerContext`
- `DialFoldersTree`
- `FolderDestinationPanel`, `FolderDestinationPanelBody`, `FolderDestinationTree`, their prop and label types, `FolderDestinationLayout` and the `toFolderPathKey`, `fromFolderPathKey`, `getFolderNameError` and `getNextFolderNameFromNames` helpers
- File models, permissions, resource types, and selection modes
- File-manager actions, tabs, trigger views, and column definitions
- Public option and prop types used by the exported components

All supported public exports are declared in `src/index.ts`.

## Local development

Install the npm dependencies and run the complete local verification:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run build
```

Run the interactive component examples with:

```bash
npm run storybook
```

The tree's loading signal is `treeOptions.loading`, independent of the grid's
`filesLoading` and `searchInProgress`. Set it while the tree's first level loads;
use `treeOptions.loadingPaths` for individual expanded folders. Grid reloads do
not show a tree skeleton, including when a loaded root is empty.

## Publishing

Publishing is restricted to project maintainers. Build the package and inspect
the npm archive before starting a release:

```bash
npm run build
npm run publish:dry
```

Release automation is responsible for assigning the version and npm dist-tag.
Do not publish directly from feature branches.

## Versioning

The package follows [Semantic Versioning](https://semver.org/). Changes to
exported components, types, behavior, or styles that require consumer changes
are treated as breaking changes and must be documented in `CHANGELOG.md`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development and pull request
guidelines.

## Security

Please report vulnerabilities privately as described in
[SECURITY.md](SECURITY.md).

## License

Licensed under the [Apache License 2.0](LICENSE).
