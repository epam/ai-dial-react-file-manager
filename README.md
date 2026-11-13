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

| File manager               | AI DIAL UI Kit  | React     | AG Grid   | Module format |
| -------------------------- | --------------- | --------- | --------- | ------------- |
| Current development branch | `0.14.0-dev.12` | `^19.2.5` | `^35.2.1` | ESM           |

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
- `onDestinationRequest`, called when the user starts Copy or Move so the host can show its own destination UI (see below)

### Copy and Move destination

Copy and Move need `onDestinationRequest`; without it they do nothing. When the user chooses Copy or Move, the file manager calls it with a `DialDestinationRequest` (`mode`, `items`, `sourceFolder`, `confirm`, `cancel`). It does not render a destination picker itself: show `FolderDestinationPanel` (see below) or your own UI, then call `request.confirm(destinationFolder)` to run the operation — name conflicts are resolved first, and the result reaches `onCopyFiles` / `onMoveToFiles` — or `request.cancel()` if the user dismisses it. The folders of the destination must be present in `items` for conflict detection.

Upgrading from 0.4.x? See the Breaking Changes in the [CHANGELOG](CHANGELOG.md).

### Folder destination panel

`FolderDestinationPanel` is an end-edge side panel that shows the item being acted on and a folder hierarchy to choose a destination from. `FolderDestinationTree` is the hierarchy on its own, in a single-root form (`items`, `selectedPath`) or a multi-root form (`roots`, `destination`). The panel renders its primary button from a host-supplied `action`, takes its text through `labels`, `panelLabels` and its colors through CSS variables (`colors`, `panelStyles`), and has two layouts: `FolderDestinationLayout.Steps` (a main view and a Change-folder view) and `FolderDestinationLayout.Inline` (search and hierarchy in one view, no Change or Select step).

```tsx
import {
  FolderDestinationLayout,
  FolderDestinationPanel,
  type FolderDestination,
  type FolderDestinationRoot,
} from '@epam/ai-dial-react-file-manager';

// `request` comes from `onDestinationRequest`; `destination`, `setDestination`, `createFolder` and `showToast` are the host's own.
const roots: FolderDestinationRoot[] = [
  {
    key: 'files',
    label: 'Files',
    items: [{ path: ['Reports'], name: 'Reports' }],
  },
];

<FolderDestinationPanel
  isOpen
  onClose={request.cancel}
  layout={FolderDestinationLayout.Inline}
  item={{ title: 'report.pdf' }}
  roots={roots}
  destination={destination}
  onDestinationChange={setDestination}
  onCreateFolder={async (rootKey, parentPath, name) =>
    createFolder(rootKey, parentPath, name)
  }
  onCreateFolderError={(error) => showToast(String(error))}
  action={{ label: 'Copy', onClick: () => request.confirm('files/Reports') }}
/>;
```

The panel knows nothing about the host: `item.summary` replaces the title-only summary row with a node the host renders (for example an entity header). If `onCreateFolder` rejects, the new folder is not selected and `onCreateFolderError` is called; the panel shows no message of its own, so the host reports the failure. Folder helpers (`validateFolderName`, `toFolderPathKey`, `fromFolderPathKey`) are exported alongside.

## Public API

The primary export is `DialFileManager`. The package also exports:

- `FileManagerProvider` and `useFileManagerContext`
- `DialFoldersTree`
- `FolderDestinationPanel`, `FolderDestinationTree`, their prop, label and color types, `FolderDestinationLayout` and the `toFolderPathKey`, `fromFolderPathKey` and `validateFolderName` helpers
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
