import {
  DIAL_ICON_SIZE,
  DIAL_KIT_ICON_STROKE,
  DialItemType,
  ElementSize,
  ErrorText,
  FileName,
  FolderName,
  GhostButton,
  LinkButton,
  LiveRegion,
  LiveRegionPoliteness,
  mergeClasses,
  Search,
} from '@epam/ai-dial-ui-kit';
import { IconFolder } from '@tabler/icons-react';
import { type FC, useMemo, useState } from 'react';
import { buildCssVars } from '@/utils/css-vars';
import type { FolderDestination } from '@/models/folder-destination';
import type { FolderDestinationPanelBodyProps } from '@/models/folder-destination-panel';
import {
  FolderDestinationItemIcon,
  FolderDestinationLayout,
  FolderDestinationView,
} from '@/types/folder-destination-panel';
import { FolderDestinationTree } from '@/components/FolderDestinationTree/FolderDestinationTree';

const HEADING_CLASS =
  'text-[color:var(--fdpb-heading-text,--theme(--text-color-primary))]';
const DESTINATION_CLASS =
  'text-[color:var(--fdpb-destination-text,--theme(--text-color-secondary))]';
const SUMMARY_CLASS =
  'border-[color:var(--fdpb-summary-border,--theme(--border-color-tertiary))] bg-[color:var(--fdpb-summary-bg,--theme(--background-color-layer-sunken))]';
const TREE_SCROLL_CLASS =
  '[scrollbar-width:thin] [scrollbar-color:var(--fdp-scrollbar-thumb,--theme(--border-color-secondary))_transparent]';

/** Body of the folder destination panel: the item summary, destination and host sections, or the destination folder tree. */
export const FolderDestinationPanelBody: FC<
  FolderDestinationPanelBodyProps
> = ({
  view,
  layout = FolderDestinationLayout.Steps,
  collapsibleRoots = false,
  item,
  roots,
  destination,
  onDestinationChange,
  onCreateFolder,
  onCreateFolderError,
  onChangeFolderClick,
  changeFolderButtonRef,
  pendingDestination,
  onPendingDestinationChange,
  mainSections,
  renderFolderViewFooter,
  isSubmitting = false,
  submitError,
  foldersError,
  onRetryFolders,
  panelLabels = {},
  panelStyles = {},
  headingClassName = 'dial-body-semi-text',
  destinationClassName = 'dial-small-semi-text',
}) => {
  const {
    destinationHeading = 'Destination folder',
    changeFolderLabel = 'Change',
    destinationAriaLabel = 'Destination folder',
    searchPlaceholder = 'Search folders',
    clearSearchAriaLabel = 'Clear search',
    folderEmptyStateLabel,
    createFolderLabel,
    cancelCreatingFolderLabel,
    addSiblingFolderLabel,
    addChildFolderLabel,
    createFolderEmptyNameError,
    createFolderInvalidNameError,
    createFolderDuplicateNameError,
    createFolderSameAsParentNameError,
    retryLabel = 'Retry',
  } = panelLabels;
  const { colors, folderTree: folderTreeStyles } = panelStyles;
  const cssVars = {
    ...buildCssVars({
      '--fdpb-heading-text': colors?.headingText,
      '--fdpb-destination-text': colors?.destinationText,
    }),
    ...panelStyles.cssVars,
  };
  /* The summary row reads its border and background from variables of its own. */
  const summaryCssVars = buildCssVars({
    '--fdpb-summary-border': colors?.summaryBorder,
    '--fdpb-summary-bg': colors?.summaryBackground,
  });

  const [searchQuery, setSearchQuery] = useState('');

  const destinationSegments = useMemo(() => {
    const root = roots.find(
      (candidate) => candidate.key === destination.rootKey,
    );
    return [root?.label ?? destination.rootKey, ...destination.path];
  }, [roots, destination]);

  const headingClass = mergeClasses(headingClassName, HEADING_CLASS);

  const isInline = layout === FolderDestinationLayout.Inline;
  const pickerDestination = isInline ? destination : pendingDestination;
  const handlePickerDestinationChange = (
    next: FolderDestination | undefined,
  ) => {
    /* An inline pick is the destination; clearing a selection keeps the previous one. */
    if (isInline) {
      if (next) onDestinationChange(next);
    } else {
      onPendingDestinationChange(next);
    }
  };

  const pickerSearch = (
    <>
      <div role="search">
        <Search
          value={searchQuery}
          onChange={(value) => setSearchQuery(value ?? '')}
          placeholder={searchPlaceholder}
          clearLabel={clearSearchAriaLabel}
          aria-label={searchPlaceholder}
        />
      </div>
      <LiveRegion politeness={LiveRegionPoliteness.Assertive}>
        {foldersError && (
          <div className="flex flex-wrap items-center gap-2">
            <ErrorText text={foldersError} />
            {onRetryFolders && (
              <LinkButton label={retryLabel} onClick={onRetryFolders} />
            )}
          </div>
        )}
      </LiveRegion>
    </>
  );

  const pickerTree = (
    <>
      <FolderDestinationTree
        roots={roots}
        destination={pickerDestination}
        onDestinationChange={handlePickerDestinationChange}
        onCreateDestinationFolder={onCreateFolder}
        onCreateFolderError={onCreateFolderError}
        searchQuery={searchQuery}
        collapsibleRoots={collapsibleRoots}
        disabled={isSubmitting}
        noResultsLabel={folderEmptyStateLabel}
        createFolderLabel={createFolderLabel}
        cancelCreatingFolderLabel={cancelCreatingFolderLabel}
        addSiblingFolderLabel={addSiblingFolderLabel}
        addChildFolderLabel={addChildFolderLabel}
        emptyFolderNameError={createFolderEmptyNameError}
        invalidFolderNameError={createFolderInvalidNameError}
        duplicateFolderNameError={createFolderDuplicateNameError}
        sameAsParentFolderNameError={createFolderSameAsParentNameError}
        styles={folderTreeStyles}
      />
      {renderFolderViewFooter?.(pickerDestination)}
    </>
  );

  const folderPicker = (
    <>
      {pickerSearch}
      {pickerTree}
    </>
  );

  if (view === FolderDestinationView.ChangeFolder) {
    return (
      <div className="flex flex-col gap-3" style={cssVars}>
        {folderPicker}
      </div>
    );
  }

  return (
    <div
      className={mergeClasses(
        'flex flex-col gap-5',
        isInline && 'min-h-0 flex-1',
      )}
      style={cssVars}
    >
      <div
        style={summaryCssVars}
        className={mergeClasses(
          'flex items-center justify-between gap-3 rounded-xl border p-3',
          SUMMARY_CLASS,
        )}
      >
        {item.summary ??
          (item.iconKind != null ? (
            <FileName
              name={item.title}
              type={
                item.iconKind === FolderDestinationItemIcon.Folder
                  ? DialItemType.Folder
                  : DialItemType.File
              }
              iconSize={24}
              nameClassName={headingClass}
            />
          ) : (
            <span className={mergeClasses('truncate', headingClass)}>
              {item.title}
            </span>
          ))}
      </div>

      {isInline ? (
        <section className="flex min-h-0 flex-1 flex-col gap-3">
          <h2 className={headingClass}>{destinationHeading}</h2>
          {pickerSearch}
          {/* Only the folder hierarchy scrolls; the item, heading and search stay put. */}
          <div
            className={mergeClasses(
              'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto',
              TREE_SCROLL_CLASS,
            )}
          >
            {pickerTree}
          </div>
        </section>
      ) : (
        <section className="flex flex-col gap-2">
          <h2 className={headingClass}>{destinationHeading}</h2>
          <div className="flex min-w-0 items-center gap-2">
            {/* The folder icon matches the file manager's; the whole path is one truncating name. */}
            <div
              role="group"
              aria-label={destinationAriaLabel}
              className="min-w-0 flex-1"
            >
              <FolderName
                name={destinationSegments.join(' / ')}
                nameClassName={mergeClasses(
                  destinationClassName,
                  DESTINATION_CLASS,
                )}
              />
            </div>
            <GhostButton
              ref={changeFolderButtonRef}
              size={ElementSize.Small}
              label={changeFolderLabel}
              iconBefore={
                <IconFolder
                  size={DIAL_ICON_SIZE.SM}
                  stroke={DIAL_KIT_ICON_STROKE}
                  aria-hidden
                />
              }
              disabled={isSubmitting}
              onClick={onChangeFolderClick}
            />
          </div>
        </section>
      )}

      {mainSections}

      <LiveRegion politeness={LiveRegionPoliteness.Assertive}>
        {submitError && <ErrorText text={submitError} />}
      </LiveRegion>
    </div>
  );
};
