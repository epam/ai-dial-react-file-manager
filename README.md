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
| Current development branch | `0.13.0-dev.25` | `^19.2.5` | `^35.2.1` | ESM           |

## Installation

Install the package together with its peer dependencies:

```bash
npm install @epam/ai-dial-react-file-manager @epam/ai-dial-ui-kit \
  @tabler/icons-react ag-grid-community ag-grid-react react react-dom
```

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
- `onCopyFiles`, `onMoveToFiles`, and `onDeleteFiles`
- `onDownloadFiles`, `onUnshareFiles`, and `onRemoveFilesAccess`
- `onManagePermissions`, `onPreview`, and `onOpenInNewTab`

## Public API

The primary export is `DialFileManager`. The package also exports:

- `FileManagerProvider` and `useFileManagerContext`
- `DialDestinationFolderPopup` and `DialFoldersTree`
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
