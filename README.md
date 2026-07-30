# AI DIAL React File Manager

`@epam/ai-dial-react-file-manager` is the reusable React file manager used by
AI DIAL interfaces. Shared controls and design tokens come from
`@epam/ai-dial-ui-kit`; the file tree, file operations, upload flows, selection,
conflict resolution, and file-manager-specific styles live in this package.

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

The package also exports the provider/context API, destination-folder popup,
folders tree, file models, file-manager enums, column definitions, and the
public option and prop types used by `DialFileManager`.

## Local development

The development dependency on `@epam/ai-dial-ui-kit` points to the sibling
`../ai-dial-ui-kit` checkout. Build that checkout after changing its public
exports, then install and verify this package:

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

Storybook is available through `npm run storybook`.

## Publishing

Use the dry run first, then publish an explicit version and npm tag:

```bash
npm run release:dry
npm run release -- --version <version> --tag <tag>
```
