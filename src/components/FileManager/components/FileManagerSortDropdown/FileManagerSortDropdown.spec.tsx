import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import {
  FileManagerSortDirection,
  FileManagerSortField,
} from '@/types/file-manager';
import { DialFileManagerSortDropdown } from './FileManagerSortDropdown';

const NAME_ASC = {
  field: FileManagerSortField.Name,
  direction: FileManagerSortDirection.Asc,
};

const openMenu = async () => {
  await userEvent.click(screen.getByRole('button', { name: /sort/i }));
};

describe('Dial UI Kit :: DialFileManagerSortDropdown', () => {
  test('lists the sort fields and directions and checks the current ones', async () => {
    render(<DialFileManagerSortDropdown sort={NAME_ASC} />);

    await openMenu();

    const items = await screen.findAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      'Name',
      'Modified date',
      'Size',
      'Ascending',
      'Descending',
    ]);

    const checked = items.filter(
      (item) => item.getAttribute('aria-checked') === 'true',
    );
    expect(checked.map((item) => item.textContent)).toEqual([
      'Name',
      'Ascending',
    ]);
  });

  test('reports a picked field and keeps the direction', async () => {
    const onSortChange = vi.fn();
    render(
      <DialFileManagerSortDropdown
        sort={NAME_ASC}
        onSortChange={onSortChange}
      />,
    );

    await openMenu();
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Size' }),
    );

    expect(onSortChange).toHaveBeenCalledWith({
      field: FileManagerSortField.Size,
      direction: FileManagerSortDirection.Asc,
    });
  });

  test('reports a picked direction and keeps the field', async () => {
    const onSortChange = vi.fn();
    render(
      <DialFileManagerSortDropdown
        sort={NAME_ASC}
        onSortChange={onSortChange}
      />,
    );

    await openMenu();
    await userEvent.click(
      await screen.findByRole('menuitemradio', { name: 'Descending' }),
    );

    expect(onSortChange).toHaveBeenCalledWith({
      field: FileManagerSortField.Name,
      direction: FileManagerSortDirection.Desc,
    });
  });

  test('uses custom trigger and item labels', async () => {
    render(
      <DialFileManagerSortDropdown
        sort={NAME_ASC}
        label="Order"
        fieldLabels={{ [FileManagerSortField.UpdatedAt]: 'Changed' }}
        directionLabels={{ [FileManagerSortDirection.Desc]: 'Z → A' }}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /order/i }));

    expect(
      await screen.findByRole('menuitemradio', { name: 'Changed' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitemradio', { name: 'Z → A' }),
    ).toBeInTheDocument();
  });
});
