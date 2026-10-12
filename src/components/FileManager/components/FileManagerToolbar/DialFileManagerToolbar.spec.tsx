import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ButtonVariant } from '@epam/ai-dial-ui-kit';
import { DialFileManagerToolbar } from './DialFileManagerToolbar';

describe('Dial UI Kit :: DialFileManagerToolbar', () => {
  it('manages hidden files switch state via props', () => {
    const onToggleHiddenFiles = vi.fn();
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={true}
        onToggleHiddenFiles={onToggleHiddenFiles}
      />,
    );

    const switcher = screen.getByRole('switch');
    expect(switcher).toBeChecked();

    fireEvent.click(switcher);
    expect(onToggleHiddenFiles).toHaveBeenCalledWith(false);
  });

  it('shows new button only when isNewButtonVisible is true', () => {
    const { rerender } = render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isNewButtonVisible={false}
        newButtonLabel="New"
      />,
    );

    expect(
      screen.queryByRole('button', { name: /new/i }),
    ).not.toBeInTheDocument();

    rerender(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isNewButtonVisible={true}
        newButtonLabel="New"
        newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
      />,
    );

    expect(screen.getByRole('button', { name: /new/i })).toBeInTheDocument();
  });

  it('renders new button with custom label', () => {
    const customLabel = 'Add';
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isNewButtonVisible={true}
        newButtonLabel={customLabel}
        newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
      />,
    );

    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('opens the Add menu at least 108px wide instead of the button width', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isNewButtonVisible={true}
        newButtonLabel="Add"
        newButtonDropdownItems={[{ key: '1', label: 'Folder' }]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    const menu = screen.getByRole('menu');
    expect(menu).toHaveClass('min-w-[108px]');
    expect(menu.style.minWidth).toBe('');
  });

  /*
   * The toggle is labelled by the action it offers, so the label names the
   * state the click leads to rather than the one it is in.
   */
  it('labels the hidden files switch with the action it offers', () => {
    const { rerender } = render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        showHiddenFilesLabel="Show system files"
        hideHiddenFilesLabel="Hide system files"
        onToggleHiddenFiles={vi.fn()}
      />,
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByText('Show system files')).toBeInTheDocument();

    rerender(
      <DialFileManagerToolbar
        areHiddenFilesVisible={true}
        showHiddenFilesLabel="Show system files"
        hideHiddenFilesLabel="Hide system files"
        onToggleHiddenFiles={vi.fn()}
      />,
    );

    expect(screen.getByText('Hide system files')).toBeInTheDocument();
  });

  it('falls back to the default switch labels', () => {
    const { rerender } = render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
      />,
    );

    expect(screen.getByText('Show hidden files')).toBeInTheDocument();

    rerender(
      <DialFileManagerToolbar
        areHiddenFilesVisible={true}
        onToggleHiddenFiles={vi.fn()}
      />,
    );

    expect(screen.getByText('Hide hidden files')).toBeInTheDocument();
  });

  it('disables new button when isNewButtonDisabled is true', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isNewButtonVisible={true}
        isNewButtonDisabled={true}
        newButtonLabel="New"
        newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
      />,
    );

    const newButton = screen.getByRole('button', { name: /new/i });
    expect(newButton).toBeDisabled();
  });

  /*
   * The tab row moved into the folders panel; the toolbar is now only the
   * hidden-files switch and the add button.
   */
  it('renders no tablist of its own', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
      />,
    );

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('renders the compact layout as more menu, slot, then round Add button', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isCompactView
        isNewButtonVisible
        newButtonLabel="Add"
        newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
        additionalButtons={<button type="button">Sort</button>}
      />,
    );

    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('button')
        .map(
          (button) => button.textContent || button.getAttribute('aria-label'),
        ),
    ).toEqual(['More actions', 'Sort', 'Add']);
  });

  it('offers the hidden files toggle from the compact more menu', async () => {
    const onToggleHiddenFiles = vi.fn();
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={onToggleHiddenFiles}
        isCompactView
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(await screen.findByText('Show hidden files'));

    expect(onToggleHiddenFiles).toHaveBeenCalledWith(true);
  });

  it('drops the compact more menu when the hidden files toggle is off', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isCompactView
        showHiddenFilesToggle={false}
        isNewButtonVisible
        newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'More actions' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('styles the compact Add button after newButtonVariant', () => {
    const renderAddButton = (newButtonVariant: ButtonVariant) => {
      const { unmount } = render(
        <DialFileManagerToolbar
          areHiddenFilesVisible={false}
          onToggleHiddenFiles={vi.fn()}
          isCompactView
          isNewButtonVisible
          newButtonVariant={newButtonVariant}
          newButtonDropdownItems={[{ key: '1', label: 'New File' }]}
        />,
      );
      const { className } = screen.getByRole('button', { name: 'Add' });
      unmount();
      return className;
    };

    expect(renderAddButton(ButtonVariant.Neutral)).not.toBe(
      renderAddButton(ButtonVariant.Primary),
    );
  });

  it('keeps the desktop layout when isCompactView is false', () => {
    render(
      <DialFileManagerToolbar
        areHiddenFilesVisible={false}
        onToggleHiddenFiles={vi.fn()}
        isCompactView={false}
      />,
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'More actions' }),
    ).not.toBeInTheDocument();
  });
});
