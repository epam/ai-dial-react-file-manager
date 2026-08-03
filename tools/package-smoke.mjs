import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import process from 'node:process';

const packageRoot = process.cwd();
const temporaryRoot = mkdtempSync(
  join(tmpdir(), 'ai-dial-react-file-manager-package-'),
);

const run = (command, args, options = {}) =>
  execFileSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

try {
  const packOutput = execFileSync(
    'npm',
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--silent',
      '--pack-destination',
      temporaryRoot,
    ],
    {
      cwd: packageRoot,
      encoding: 'utf8',
    },
  );
  const jsonStart = packOutput.indexOf('[');

  if (jsonStart === -1) {
    throw new Error('npm pack did not return JSON metadata.');
  }

  const [{ filename }] = JSON.parse(packOutput.slice(jsonStart));
  const tarballPath = resolve(temporaryRoot, filename);

  writeFileSync(
    join(temporaryRoot, 'package.json'),
    JSON.stringify({ private: true }, null, 2),
  );
  run(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      tarballPath,
      'typescript@~5.9.3',
      '@types/react@^19.2.14',
      '@types/react-dom@^19.2.3',
    ],
    { cwd: temporaryRoot },
  );

  writeFileSync(
    join(temporaryRoot, 'smoke.mjs'),
    `import * as fileManager from '@epam/ai-dial-react-file-manager';

if (typeof fileManager.DialFileManager !== 'function') {
  throw new TypeError('DialFileManager is not a runtime export.');
}

if (typeof fileManager.DialFoldersTree !== 'function') {
  throw new TypeError('DialFoldersTree is not a runtime export.');
}

const stylesheet = import.meta.resolve(
  '@epam/ai-dial-react-file-manager/styles.css',
);

if (!stylesheet.endsWith('/dist/index.css')) {
  throw new Error('The styles.css export does not resolve to dist/index.css.');
}
`,
  );
  run(process.execPath, ['smoke.mjs'], { cwd: temporaryRoot });

  writeFileSync(
    join(temporaryRoot, 'smoke.tsx'),
    `import type { ComponentProps } from 'react';
import {
  DialFileManager,
  DialFileNodeType,
  type DialFile,
} from '@epam/ai-dial-react-file-manager';

const items: DialFile[] = [
  {
    id: 'root',
    folderId: 'root',
    name: 'Root',
    path: '/Root',
    nodeType: DialFileNodeType.FOLDER,
    items: [],
  },
];

const props: ComponentProps<typeof DialFileManager> = {
  items,
  defaultPath: '/Root',
};

export const Smoke = () => <DialFileManager {...props} />;
`,
  );
  writeFileSync(
    join(temporaryRoot, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: 'react-jsx',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: 'ES2022',
        },
        include: ['smoke.tsx'],
      },
      null,
      2,
    ),
  );
  run('npm', ['exec', 'tsc', '--', '--project', 'tsconfig.json'], {
    cwd: temporaryRoot,
  });

  process.stdout.write(
    'Packed package runtime, stylesheet, and types are valid.\n',
  );
} finally {
  rmSync(temporaryRoot, { force: true, recursive: true });
}
