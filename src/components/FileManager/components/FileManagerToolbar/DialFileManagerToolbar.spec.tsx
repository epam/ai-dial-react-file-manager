import { render, fireEvent, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
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
});
