import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DialFileManagerCompactNavigation } from './FileManagerCompactNavigation';

describe('Dial UI Kit :: DialFileManagerCompactNavigation', () => {
  it('names the trigger after the current folder and hides the panel while closed', () => {
    render(
      <DialFileManagerCompactNavigation
        label="DK Test"
        isOpen={false}
        onOpenChange={vi.fn()}
      >
        <div>Folders tree</div>
      </DialFileManagerCompactNavigation>,
    );

    const trigger = screen.getByRole('button', {
      name: 'DK Test',
      expanded: false,
    });
    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(screen.queryByText('Folders tree')).not.toBeInTheDocument();
  });

  it('renders the panel content while open and links it to the trigger', () => {
    render(
      <DialFileManagerCompactNavigation
        label="My files"
        isOpen
        onOpenChange={vi.fn()}
      >
        <div>Folders tree</div>
      </DialFileManagerCompactNavigation>,
    );

    const trigger = screen.getByRole('button', {
      name: 'My files',
      expanded: true,
    });
    const panel = screen.getByText('Folders tree').parentElement;

    expect(trigger).toHaveAttribute('aria-controls', panel?.id);
  });

  it('reports the next open state when the trigger is pressed', async () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <DialFileManagerCompactNavigation
        label="My files"
        isOpen={false}
        onOpenChange={onOpenChange}
      >
        <div>Folders tree</div>
      </DialFileManagerCompactNavigation>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'My files' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    rerender(
      <DialFileManagerCompactNavigation
        label="My files"
        isOpen
        onOpenChange={onOpenChange}
      >
        <div>Folders tree</div>
      </DialFileManagerCompactNavigation>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'My files' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
