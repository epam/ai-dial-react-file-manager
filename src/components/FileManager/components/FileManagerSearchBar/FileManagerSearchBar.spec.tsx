import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DialFileManagerSearchBar } from './FileManagerSearchBar';

describe('Dial UI Kit :: DialFileManagerSearchBar', () => {
  test('renders a named search landmark and reflects the controlled value', () => {
    render(<DialFileManagerSearchBar elementId="fm-search" value="diagram" />);

    expect(screen.getByRole('search', { name: 'Search' })).toBeInTheDocument();

    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.value).toBe('diagram');
    expect(input).toHaveAttribute('id', 'fm-search');
  });

  test('falls back to a default input id', () => {
    render(<DialFileManagerSearchBar value="" />);

    expect(screen.getByRole('textbox')).toHaveAttribute(
      'id',
      'file-manager-search',
    );
  });

  test('forwards the placeholder to the input', () => {
    render(
      <DialFileManagerSearchBar value="" placeholder="Search in My files..." />,
    );

    expect(
      screen.getByPlaceholderText('Search in My files...'),
    ).toBeInTheDocument();
  });

  test('calls `onSearchChange` with new text', () => {
    const onSearchChange = vi.fn();
    render(
      <DialFileManagerSearchBar value="" onSearchChange={onSearchChange} />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'abc' },
    });

    expect(onSearchChange).toHaveBeenCalledTimes(1);
    expect(onSearchChange).toHaveBeenCalledWith('abc');
  });

  test('clears the query when a whitespace-only field loses focus', () => {
    const onSearchChange = vi.fn();
    render(
      <DialFileManagerSearchBar value="   " onSearchChange={onSearchChange} />,
    );

    fireEvent.blur(screen.getByRole('textbox'));

    expect(onSearchChange).toHaveBeenCalledWith('');
  });

  test('leaves a real query alone on blur', () => {
    const onSearchChange = vi.fn();
    render(
      <DialFileManagerSearchBar
        value="report"
        onSearchChange={onSearchChange}
      />,
    );

    fireEvent.blur(screen.getByRole('textbox'));

    expect(onSearchChange).not.toHaveBeenCalled();
  });

  test('applies the container className to the root element', () => {
    const { container } = render(
      <DialFileManagerSearchBar value="" className="bg-red-500" />,
    );

    expect(container.firstChild).toHaveClass('bg-red-500');
  });

  test('disables the input when `disabled` is set', () => {
    render(<DialFileManagerSearchBar value="" disabled />);

    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
