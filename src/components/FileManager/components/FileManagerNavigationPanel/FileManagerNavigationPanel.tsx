import { type FC, type MouseEvent, useMemo } from 'react';

import { getSegments } from '@/utils/path';
import {
  DialBreadcrumb,
  type DialBreadcrumbPathItem,
  type DialBreadcrumbProps,
  mergeClasses,
} from '@epam/ai-dial-ui-kit';
import { breadcrumbContainerClassName, panelBaseClassName } from './constants';

export interface DialFileManagerNavigationPanelProps extends Omit<
  DialBreadcrumbProps,
  'pathItems' | 'children' | 'className' | 'separator'
> {
  path?: string;
  makeHref?: (segments: string[], index: number) => string | undefined;
  className?: string;
  breadcrumbClassName?: string;
  onItemClick?: (href?: string) => void;
  rootItemPath?: string;
  rootItemLabel?: string;
  breadcrumbsHiddenPathPart?: string;
}

/**
 * FileManagerNavigationPanel
 *
 * The breadcrumb trail of the File Manager, shown at the leading edge of the
 * content header next to the toolbar actions. The search field it used to carry
 * on its right now heads the grid card as {@link DialFileManagerSearchBar}.
 *
 * Uses the shared {@link DialBreadcrumb} for navigation.
 *
 * @example
 * ```tsx
 * <FileManagerNavigationPanel path="Organization/Folder 4" />
 *
 * // With clickable parents
 * <FileManagerNavigationPanel
 *   path="Org/Design/Assets"
 *   makeHref={(segments, i) => '#' + segments.slice(0, i + 1).join('/')}
 * />
 * ```
 *
 * @param [ariaLabel="Breadcrumb"] - Aria label for the breadcrumb `<nav>`
 * @param [labelClassName] - Extra classes for breadcrumb titles
 * @param [path] - A full path string that will be split into breadcrumb items
 * @param [makeHref] - Factory to create hrefs for segments
 * @param [onItemClick] - Callback fired when a breadcrumb item is clicked
 * @param [className] - Additional classes for the panel container
 * @param [breadcrumbClassName] - ClassName forwarded to inner `DialBreadcrumb`
 * @param [breadcrumbsHiddenPathPart] - A slash-separated path fragment whose segments will be omitted from the rendered breadcrumb trail.
 */
export const DialFileManagerNavigationPanel: FC<
  DialFileManagerNavigationPanelProps
> = ({
  ariaLabel = 'Breadcrumb',
  labelClassName,
  onItemClick,

  path,
  makeHref,
  rootItemPath,
  rootItemLabel,
  breadcrumbsHiddenPathPart,

  className,
  breadcrumbClassName,
}) => {
  const breadcrumbPathItems: DialBreadcrumbPathItem[] | undefined =
    useMemo(() => {
      if (!path) return undefined;
      let segments = getSegments(path);
      const originalSegments = [...segments];

      let hiddenSegmentsCount = 0;
      if (breadcrumbsHiddenPathPart) {
        const hiddenSegments = getSegments(breadcrumbsHiddenPathPart);

        if (hiddenSegments.length) {
          const hiddenIndex = segments.findIndex((_, idx) =>
            hiddenSegments.every((seg, hIdx) => segments[idx + hIdx] === seg),
          );

          if (hiddenIndex !== -1) {
            hiddenSegmentsCount = hiddenSegments.length;
            segments = [
              ...segments.slice(0, hiddenIndex),
              ...segments.slice(hiddenIndex + hiddenSegments.length),
            ];
          }
        }
      }

      if (!segments.length) return [{ label: '/' }];

      const items = segments.map((segment, index) => {
        const originalIndex =
          index < segments.length - hiddenSegmentsCount
            ? index
            : index + hiddenSegmentsCount;

        const acc = originalSegments.slice(0, originalIndex + 1);
        const href =
          typeof makeHref === 'function'
            ? makeHref(acc, originalIndex)
            : undefined;

        return {
          label: segment,
          href,
          onClick: onItemClick
            ? (e: MouseEvent<HTMLAnchorElement>) => {
                e.preventDefault();
                onItemClick(href);
              }
            : undefined,
        };
      });

      if (rootItemPath && rootItemLabel) {
        const rootPathSegments = rootItemPath.split('/').filter(Boolean);
        const currentPathSegments = path.split('/').filter(Boolean);

        const isRootPath = rootPathSegments.every(
          (segment, idx) => currentPathSegments[idx] === segment,
        );

        if (isRootPath && items.length > 0) {
          const remainingItems = items.slice(rootPathSegments.length);

          return [
            {
              label: rootItemLabel,
              href: rootItemPath,
              onClick: onItemClick
                ? (e: MouseEvent<HTMLAnchorElement>) => {
                    e.preventDefault();
                    onItemClick(rootItemPath);
                  }
                : undefined,
            },
            ...remainingItems,
          ];
        }
      }

      return items;
    }, [
      path,
      breadcrumbsHiddenPathPart,
      rootItemPath,
      rootItemLabel,
      makeHref,
      onItemClick,
    ]);

  return (
    <div
      className={mergeClasses(panelBaseClassName, className)}
      aria-label="navigation-panel"
    >
      <div className={breadcrumbContainerClassName}>
        <DialBreadcrumb
          pathItems={breadcrumbPathItems}
          ariaLabel={ariaLabel}
          labelClassName={labelClassName}
          className={breadcrumbClassName}
        />
      </div>
    </div>
  );
};
