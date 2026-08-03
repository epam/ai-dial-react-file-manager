import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DialFileNodeType } from '@/models/file';
import { FileManagerTooltip } from './FileManagerTooltip';

describe('FileManagerTooltip', () => {
  it('shows a disabled-row tooltip and clears it on mouse leave', () => {
    const row = {
      id: 'blocked',
      name: 'blocked.txt',
      nodeType: DialFileNodeType.ITEM,
      path: '/blocked.txt',
    };
    const getRowDisabledTooltip = vi.fn(() => 'File type is not allowed');

    render(
      <>
        <section aria-label="File Manager Grid View">
          <div className="ag-row" row-id={row.path}>
            Blocked row
          </div>
        </section>
        <FileManagerTooltip
          disabledGridRowIds={new Set([row.path])}
          gridRows={[row]}
          getRowDisabledTooltip={getRowDisabledTooltip}
        />
      </>,
    );

    fireEvent.mouseMove(screen.getByText('Blocked row'));

    expect(getRowDisabledTooltip).toHaveBeenCalledWith(
      row,
      undefined,
      undefined,
    );
    expect(screen.getByText('File type is not allowed')).toBeInTheDocument();

    fireEvent.mouseLeave(
      screen.getByRole('region', { name: 'File Manager Grid View' }),
    );

    expect(
      screen.queryByText('File type is not allowed'),
    ).not.toBeInTheDocument();
  });
});
