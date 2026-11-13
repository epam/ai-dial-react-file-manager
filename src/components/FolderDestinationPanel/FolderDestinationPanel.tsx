import {
  DIAL_ICON_SIZE,
  GhostButton,
  mergeClasses,
  NeutralButton,
  PrimaryButton,
  SideDrawer,
  Spinner,
} from '@epam/ai-dial-ui-kit';
import { type FC, useEffect, useRef, useState } from 'react';
import { buildCssVars } from '@/utils/css-vars';
import type { FolderDestination } from '@/models/folder-destination';
import type { FolderDestinationPanelProps } from '@/models/folder-destination-panel';
import {
  FolderDestinationLayout,
  FolderDestinationView,
} from '@/types/folder-destination-panel';
import { FolderDestinationPanelBody } from './FolderDestinationPanelBody';

/*
 * The panel is the UI kit's `SideDrawer`, which paints its backdrop, panel,
 * header rule and text with single-class utilities, so the overrides are
 * important utilities that read the `--fdp-*` variables and fall back to the
 * theme tokens of `styles/theme.scss`, referenced with `--theme()` so the values live in one place.
 */
const BACKDROP_CLASS =
  'bg-[color:var(--fdp-backdrop-bg,--theme(--background-color-backdrop))]!';
const PANEL_CLASS =
  'bg-[color:var(--fdp-panel-bg,--theme(--background-color-layer-raised))]! border-s-[color:var(--fdp-panel-border,--theme(--border-color-secondary))]!';
const DIVIDER_CLASS =
  'border-b! border-b-[color:var(--fdp-divider-border,--theme(--border-color-tertiary))]!';
const FOOTER_CLASS =
  'border-[color:var(--fdp-divider-border,--theme(--border-color-tertiary))]';
const CONTENT_CLASS =
  '[scrollbar-width:thin] [scrollbar-color:var(--fdp-scrollbar-thumb,--theme(--border-color-secondary))_transparent]';
const TITLE_CLASS =
  'text-[color:var(--fdp-title-text,--theme(--text-color-primary))]!';

/** End-edge slide-in panel for choosing a destination folder for an item, with a summary view and a folder view. */
export const FolderDestinationPanel: FC<FolderDestinationPanelProps> = ({
  isOpen,
  onClose,
  action,
  returnFocusRef,
  labels = {},
  colors,
  titleClassName = 'dial-body-semi-text',
  destination,
  onDestinationChange,
  isSubmitting = false,
  layout = FolderDestinationLayout.Steps,
  onPendingDestinationChange,
  ...bodyProps
}) => {
  const {
    title = 'Select destination',
    changeFolderTitle = 'Change folder',
    closeAriaLabel = 'Close',
    backAriaLabel = 'Back',
    cancelLabel = 'Cancel',
    selectLabel = 'Select',
  } = labels;
  const cssVars = buildCssVars({
    '--fdp-backdrop-bg': colors?.backdropBackground,
    '--fdp-panel-bg': colors?.panelBackground,
    '--fdp-panel-border': colors?.panelBorder,
    '--fdp-divider-border': colors?.dividerBorder,
    '--fdp-scrollbar-thumb': colors?.scrollbarThumb,
    '--fdp-title-text': colors?.titleText,
  });

  const [view, setView] = useState(FolderDestinationView.Main);
  const [pendingDestination, setPendingDestination] = useState<
    FolderDestination | undefined
  >(destination);
  const titleRef = useRef<HTMLSpanElement>(null);
  const changeFolderButtonRef = useRef<HTMLButtonElement>(null);

  // Every opening starts on the main view.
  useEffect(() => {
    if (isOpen) setView(FolderDestinationView.Main);
  }, [isOpen]);

  /*
   * Switching views moves focus to the new view's heading, and leaving the
   * folder view hands it back to the Change button that opened it.
   */
  const previousViewRef = useRef(view);
  useEffect(() => {
    if (previousViewRef.current === view) return;
    previousViewRef.current = view;
    if (view === FolderDestinationView.ChangeFolder) {
      titleRef.current?.focus({ preventScroll: true });
    } else {
      changeFolderButtonRef.current?.focus({ preventScroll: true });
    }
  }, [view]);

  /* The kit returns focus to whatever had it before opening; a host target takes over when given. */
  const wasOpenRef = useRef(isOpen);
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    wasOpenRef.current = isOpen;
    if (wasOpen && !isOpen && returnFocusRef?.current?.isConnected) {
      returnFocusRef.current.focus({ preventScroll: true });
    }
  }, [isOpen, returnFocusRef]);

  /* An inline layout has the folder picker in its main view, so it never leaves it. */
  const isChangingFolder =
    layout === FolderDestinationLayout.Steps &&
    view === FolderDestinationView.ChangeFolder;

  const handlePendingDestinationChange = (
    next: FolderDestination | undefined,
  ) => {
    setPendingDestination(next);
    onPendingDestinationChange?.(next);
  };
  const handleChangeFolderClick = () => {
    handlePendingDestinationChange(destination);
    setView(FolderDestinationView.ChangeFolder);
  };
  /* Leaving without Select discards the pending folder, so the host hears the committed one again. */
  const handleBackToMain = () => {
    onPendingDestinationChange?.(destination);
    setView(FolderDestinationView.Main);
  };
  const handleSelect = () => {
    if (pendingDestination) onDestinationChange(pendingDestination);
    setView(FolderDestinationView.Main);
  };

  /* The title goes in as a node so the dialog keeps the main title as its name in both views. */
  return (
    <SideDrawer
      open={isOpen}
      onClose={onClose}
      header={
        <span
          ref={titleRef}
          tabIndex={-1}
          className={mergeClasses(
            'block truncate outline-none',
            titleClassName,
            TITLE_CLASS,
          )}
        >
          {isChangingFolder ? changeFolderTitle : title}
        </span>
      }
      ariaLabel={title}
      onBack={isChangingFolder ? handleBackToMain : undefined}
      backAriaLabel={backAriaLabel}
      backDisabled={isSubmitting}
      closeAriaLabel={closeAriaLabel}
      closeDisabled={isSubmitting}
      style={cssVars}
      overlayStyle={cssVars}
      className={mergeClasses(
        PANEL_CLASS,
        'tablet:w-[540px]! tablet:max-w-[calc(100%-32px)]!',
      )}
      overlayClassName={BACKDROP_CLASS}
      headerClassName={mergeClasses('px-[22px]', DIVIDER_CLASS)}
      bodyClassName="flex flex-col overflow-hidden"
    >
      <div
        className={mergeClasses(
          'flex min-h-0 flex-1 flex-col p-[22px]',
          /* An inline body scrolls only its folder tree, so the panel itself must not. */
          layout === FolderDestinationLayout.Steps && 'overflow-y-auto',
          CONTENT_CLASS,
        )}
      >
        <FolderDestinationPanelBody
          {...bodyProps}
          layout={layout}
          view={isChangingFolder ? view : FolderDestinationView.Main}
          destination={destination}
          onDestinationChange={onDestinationChange}
          isSubmitting={isSubmitting}
          onChangeFolderClick={handleChangeFolderClick}
          changeFolderButtonRef={changeFolderButtonRef}
          pendingDestination={pendingDestination}
          onPendingDestinationChange={handlePendingDestinationChange}
        />
      </div>

      {/* Below the desktop breakpoint the two actions split the row in half. */}
      <div
        className={mergeClasses(
          'flex items-center justify-end gap-2 border-t px-4 py-4 desktop:px-3.5',
          FOOTER_CLASS,
        )}
      >
        <GhostButton
          label={cancelLabel}
          className="mobile:flex-1"
          disabled={isSubmitting}
          onClick={isChangingFolder ? handleBackToMain : onClose}
        />
        {isChangingFolder ? (
          <NeutralButton
            label={selectLabel}
            className="mobile:flex-1"
            disabled={pendingDestination == null}
            onClick={handleSelect}
          />
        ) : (
          <PrimaryButton
            label={
              isSubmitting ? (action.busyLabel ?? action.label) : action.label
            }
            className="mobile:flex-1"
            disabled={action.isDisabled === true || isSubmitting}
            iconBefore={
              isSubmitting ? (
                <span aria-hidden>
                  <Spinner size={DIAL_ICON_SIZE.SM} />
                </span>
              ) : (
                action.icon
              )
            }
            onClick={action.onClick}
          />
        )}
      </div>
    </SideDrawer>
  );
};
