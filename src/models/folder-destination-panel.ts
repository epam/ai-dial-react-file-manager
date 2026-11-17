import type { CSSProperties, ReactNode, Ref, RefObject } from 'react';
import type {
  FolderDestinationItemIcon,
  FolderDestinationLayout,
  FolderDestinationView,
} from '@/types/folder-destination-panel';
import type {
  FolderDestination,
  FolderDestinationRoot,
} from './folder-destination';
import type { FolderDestinationTreeStyles } from './folder-destination-tree';

/** The item the panel acts on, shown in its summary row. */
export interface FolderDestinationItem {
  /** Display name shown in the summary row. */
  title: string;
  /** Icon shown beside the title in the title-only row; used only when `summary` is not set. Omit for no icon. */
  iconKind?: FolderDestinationItemIcon;
  /** Content of the summary row instead of the title-only row, e.g. an entity header with icon, type and version that the host renders. The panel supplies the bordered row around it. */
  summary?: ReactNode;
}

/** The panel's primary button, rendered in the footer of the main view. */
export interface FolderDestinationAction {
  /** Button label, e.g. `'Copy'`, `'Move'` or `'Publish'`. */
  label: string;
  /** Icon shown before the label; replaced by a spinner while `FolderDestinationPanelBaseProps.isSubmitting` is `true`. Omit for no icon. */
  icon?: ReactNode;
  /** Button label while `FolderDestinationPanelBaseProps.isSubmitting` is `true`. Defaults to `label`. */
  busyLabel?: string;
  /** Called when the user activates the button. */
  onClick: () => void;
  /** Whether the button is disabled. Defaults to `false`. */
  isDisabled?: boolean;
}

/** Text overrides for the body of the folder destination panel. */
export interface FolderDestinationPanelContentLabels {
  /** Heading of the destination section. Defaults to `'Destination folder'`. */
  destinationHeading?: string;
  /** Label of the action that opens the folder tree. Defaults to `'Change'`. */
  changeFolderLabel?: string;
  /** Accessible name of the destination path. Defaults to `'Destination folder'`. */
  destinationAriaLabel?: string;
  /** Placeholder and accessible name of the folder search. Defaults to `'Search folders'`. */
  searchPlaceholder?: string;
  /** Accessible name of the search clear button. Defaults to `'Clear search'`. */
  clearSearchAriaLabel?: string;
  /** Message shown when a folder search matches nothing; `{query}` is replaced. */
  folderEmptyStateLabel?: string;
  /** Label of the trailing folder-creation button. Defaults to `'Create new folder'`. */
  createFolderLabel?: string;
  /** Label of the action that cancels folder creation. Defaults to `'Cancel'`. */
  cancelCreatingFolderLabel?: string;
  /** Label of the context-menu action that creates a sibling folder. Defaults to `'Add sibling'`. */
  addSiblingFolderLabel?: string;
  /** Label of the context-menu action that creates a child folder. Defaults to `'Add child'`. */
  addChildFolderLabel?: string;
  /** Inline error for an empty new folder name. */
  createFolderEmptyNameError?: string;
  /** Inline error for a new folder name with forbidden characters. */
  createFolderInvalidNameError?: string;
  /** Inline error for a new folder name that duplicates a sibling. */
  createFolderDuplicateNameError?: string;
  /** Inline error for a new folder named like its parent folder. */
  createFolderSameAsParentNameError?: string;
  /** Non-blocking notice for a new folder name starting with a dot, which hides the folder. */
  createFolderHiddenNameWarning?: string;
  /** Label of the action that retries a failed folder listing. Defaults to `'Retry'`. */
  retryLabel?: string;
}

/** Style overrides for the body of the folder destination panel. */
export interface FolderDestinationPanelContentStyles {
  /** Style overrides forwarded to the folder tree. */
  folderTree?: FolderDestinationTreeStyles;
  /** Additional CSS custom properties applied to the body root. */
  cssVars?: CSSProperties;
}

/** Props shared by the body and the drawer of the folder destination panel. */
export interface FolderDestinationPanelBaseProps {
  /** The item the panel acts on. */
  item: FolderDestinationItem;
  /** Top-level destination roots, in display order. */
  roots: FolderDestinationRoot[];
  /** The committed destination shown in the main view. */
  destination: FolderDestination;
  /** Called with the destination the user selected and confirmed in the folder tree. */
  onDestinationChange: (destination: FolderDestination) => void;
  /** Called when a new folder name is confirmed under `rootKey` at `parentPath`. */
  onCreateFolder: (
    rootKey: string,
    parentPath: string[],
    name: string,
  ) => Promise<void>;
  /** Called when `onCreateFolder` rejects; the new folder is then not selected, and the host is responsible for telling the user. Without it a rejection is left unhandled. */
  onCreateFolderError?: (error: unknown) => void;
  /** Reason a folder is unavailable as a destination, or `undefined` when it is usable; forwarded to the folder tree, see `FolderDestinationTreeProps.getDisabledReason`. The reason of the committed `destination` is also announced in the main view. */
  getDisabledReason?: (destination: FolderDestination) => string | undefined;
  /** The host's own check of a new folder name, called with the trimmed name and the folder it would be created under; see `FolderDestinationTreeProps.onValidateFolderName`. */
  onValidateFolderName?: (
    name: string,
    parent: FolderDestination,
  ) => string | null;
  /** Lets the user collapse and expand the root nodes of the folder tree. Defaults to `false`. */
  collapsibleRoots?: boolean;
  /** How the folder picker is presented. Defaults to `FolderDestinationLayout.Steps`. */
  layout?: FolderDestinationLayout;
  /** Sections rendered in the main view below the destination, e.g. a version choice. */
  mainSections?: ReactNode;
  /** Content rendered in the folder view below the tree for the pending destination, e.g. access rules. */
  renderFolderViewFooter?: (
    pendingDestination: FolderDestination | undefined,
  ) => ReactNode;
  /** Whether the action is in flight; every control is disabled meanwhile. Defaults to `false`. */
  isSubmitting?: boolean;
  /** Error from the last action attempt, already translated; announced assertively. */
  submitError?: string;
  /** Error from loading folders, already translated; shown above the tree. */
  foldersError?: string;
  /** Called when the user retries a failed folder listing. */
  onRetryFolders?: () => void;
  /** Text overrides for the body. */
  panelLabels?: FolderDestinationPanelContentLabels;
  /** Style overrides for the body. */
  panelStyles?: FolderDestinationPanelContentStyles;
  /** Typography class of the section headings. Defaults to `'dial-body-semi-text'`. */
  headingClassName?: string;
  /** Typography class of the destination path. Defaults to `'dial-small-semi-text'`. */
  destinationClassName?: string;
}

/** Props of the body of the folder destination panel. */
export interface FolderDestinationPanelBodyProps extends FolderDestinationPanelBaseProps {
  /** Which view to render. */
  view: FolderDestinationView;
  /** Called when the user activates Change in the main view. */
  onChangeFolderClick: () => void;
  /** Ref attached to the Change button, for returning focus after the folder view closes. */
  changeFolderButtonRef?: Ref<HTMLButtonElement>;
  /** Destination selected in the folder view but not yet confirmed. */
  pendingDestination?: FolderDestination;
  /** Called when the user selects or deselects a folder in the folder view. */
  onPendingDestinationChange: (
    destination: FolderDestination | undefined,
  ) => void;
}

/** Text overrides for the drawer of the folder destination panel. */
export interface FolderDestinationPanelLabels {
  /** Main view title and dialog name. Defaults to `'Select destination'`. */
  title?: string;
  /** Folder view title. Defaults to `'Change folder'`. */
  changeFolderTitle?: string;
  /** Accessible name of the close button. Defaults to `'Close'`. */
  closeAriaLabel?: string;
  /** Accessible name of the folder view's back button. Defaults to `'Back'`. */
  backAriaLabel?: string;
  /** Cancel button label. Defaults to `'Cancel'`. */
  cancelLabel?: string;
  /** Select button label in the folder view. Defaults to `'Select'`. */
  selectLabel?: string;
}

/** Props of the folder destination drawer. */
export interface FolderDestinationPanelProps extends FolderDestinationPanelBaseProps {
  /** Whether the panel is open. */
  isOpen: boolean;
  /** Called when the panel asks to close: Close, Cancel in the main view, backdrop, or Escape. */
  onClose: () => void;
  /** The primary button of the main view. */
  action: FolderDestinationAction;
  /** Focus target restored when the panel closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** Called with the folder view's pending destination whenever it changes, including the reset to `destination` on opening and leaving that view. Never called in `FolderDestinationLayout.Inline`, where a pick is reported through `onDestinationChange`. */
  onPendingDestinationChange?: (
    destination: FolderDestination | undefined,
  ) => void;
  /** Text overrides for the drawer. */
  labels?: FolderDestinationPanelLabels;
  /** Typography class of the header title. Defaults to `'dial-body-semi-text'`. */
  titleClassName?: string;
}
