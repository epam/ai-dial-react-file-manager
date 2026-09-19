import { useCallback, type FC } from 'react';

import {
  type DialSearchProps,
  mergeClasses,
  Search,
} from '@epam/ai-dial-ui-kit';
import {
  searchBarBaseClassName,
  searchInputContainerClassName,
} from './constants';

export interface DialFileManagerSearchBarProps extends Omit<
  DialSearchProps,
  'onChange' | 'id' | 'value' | 'className' | 'containerClassName'
> {
  /** Controlled value for the search input (parent-managed). */
  value?: string | number | null;
  /** DOM id for the internal Search input. */
  elementId?: string;
  /** Callback fired when the search value changes. */
  onSearchChange?: (value: string) => void;
  /** Additional classes for the bar container. */
  className?: string;
  /** Extra classes for the search input element. */
  searchClassName?: string;
  /** Extra classes for the search input's own container. */
  searchContainerClassName?: string;
}

/**
 * FileManagerSearchBar
 *
 * The full-width search row that heads the File Manager grid card. It used to
 * be a 260px field pinned to the right of the breadcrumb trail; the breadcrumbs
 * now live in the content header, and the search reads as part of the table it
 * filters.
 *
 * The input is controlled by the parent: the component holds no query state of
 * its own and only reports changes through `onSearchChange`.
 *
 * @example
 * ```tsx
 * <DialFileManagerSearchBar
 *   value={query}
 *   placeholder="Search in My files..."
 *   onSearchChange={setQuery}
 * />
 * ```
 *
 * @param [value] - Controlled value for the search input
 * @param [elementId="file-manager-search"] - DOM id for the internal Search input
 * @param [onSearchChange] - Callback fired when the search value changes
 * @param [className] - Additional classes for the bar container
 * @param [searchClassName] - Extra classes for the search input element
 * @param [searchContainerClassName] - Extra classes for the search input's own container
 */
export const DialFileManagerSearchBar: FC<DialFileManagerSearchBarProps> = ({
  value,
  elementId = 'file-manager-search',
  onSearchChange,
  className,
  searchClassName,
  searchContainerClassName,
  disabled,
  invalid,
  ...searchProps
}) => {
  const handleSearch = useCallback(
    (nextValue?: string) => {
      onSearchChange?.(nextValue ?? '');
    },
    [onSearchChange],
  );

  /*
   * A field left holding only whitespace reads as a filter that hides
   * everything for no visible reason, so blurring an empty-looking field
   * clears the query outright.
   */
  const handleSearchBlur = useCallback(() => {
    if (!value || String(value).trim() === '') {
      onSearchChange?.('');
    }
  }, [value, onSearchChange]);

  return (
    <div
      className={mergeClasses(searchBarBaseClassName, className)}
      role="search"
      aria-label="Search"
    >
      <div className={searchInputContainerClassName}>
        <Search
          {...searchProps}
          id={elementId}
          value={value ?? ''}
          onChange={handleSearch}
          onBlur={handleSearchBlur}
          disabled={disabled}
          invalid={invalid}
          className={searchClassName}
          containerClassName={searchContainerClassName}
        />
      </div>
    </div>
  );
};
