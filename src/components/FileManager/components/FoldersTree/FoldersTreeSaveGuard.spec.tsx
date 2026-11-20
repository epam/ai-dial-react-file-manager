import { render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DialFileNodeType } from '@/models/file';
import { DialFoldersTree } from './FoldersTree';

interface CapturedItemName {
  onSave?: (value: string) => void;
  onCreateFolderSave?: (value: string) => void;
}

const captured = vi.hoisted(() => ({
  rows: [] as CapturedItemName[],
}));

/*
 * The inline editor lives in the kit's `useEditableItem`, which decides when to
 * commit. The row's save callbacks are captured here so the tree's own gate on
 * `onRenameValidate` is tested without depending on that hook's internals.
 */
vi.mock(
  '@/components/FileManager/components/FileManagerItemName/FileManagerItemName',
  () => ({
    DialFileManagerItemName: (props: CapturedItemName) => {
      captured.rows.push(props);
      return null;
    },
  }),
);

const items = [
  {
    name: 'Root',
    path: '/root',
    nodeType: DialFileNodeType.FOLDER,
    folderId: '1',
    items: [],
  },
];

const renderCreating = (onRenameValidate: (value: string) => string | null) => {
  const onCreateFolderSave = vi.fn();
  const onRenameSave = vi.fn();
  render(
    <DialFoldersTree
      items={items}
      expandedPaths={new Set(['/root'])}
      createdFolderPath="/root"
      renamedPath="/root"
      onCreateFolderSave={onCreateFolderSave}
      onRenameSave={onRenameSave}
      onRenameValidate={onRenameValidate}
    />,
  );
  const row = captured.rows.find((props) => props.onCreateFolderSave);
  return { row, onCreateFolderSave, onRenameSave };
};

describe('Dial UI Kit :: DialFoldersTree — save gated on onRenameValidate', () => {
  beforeEach(() => {
    captured.rows = [];
  });

  test('does not pass a value rejected by onRenameValidate to onCreateFolderSave or onRenameSave', () => {
    const { row, onCreateFolderSave, onRenameSave } = renderCreating((value) =>
      value === 'taken' ? 'Already exists' : null,
    );

    row?.onCreateFolderSave?.('taken');
    row?.onSave?.('taken');

    expect(onCreateFolderSave).not.toHaveBeenCalled();
    expect(onRenameSave).not.toHaveBeenCalled();
  });

  test('passes an accepted value through', () => {
    const { row, onCreateFolderSave, onRenameSave } = renderCreating(
      () => null,
    );

    row?.onCreateFolderSave?.('fresh');
    row?.onSave?.('fresh');

    expect(onCreateFolderSave).toHaveBeenCalledWith('fresh');
    expect(onRenameSave).toHaveBeenCalledWith('fresh');
  });

  test('treats a warning-prefixed message as informational and still saves', () => {
    const { row, onCreateFolderSave } = renderCreating(
      () => 'warning__A dot hides the item',
    );

    row?.onCreateFolderSave?.('.cache');

    expect(onCreateFolderSave).toHaveBeenCalledWith('.cache');
  });
});
