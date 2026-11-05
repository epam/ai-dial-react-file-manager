import type { FC, ReactNode } from 'react';
import {
  DialFileManagerItemNameInput,
  type DialFileManagerItemNameInputProps,
} from '@/components/FileManager/components/FileManagerItemNameInput/FileManagerItemNameInput';
import {
  useEditableItem,
  DialItemType,
  FileIcon,
  FileName,
  Highlight,
  BASE_ICON_SIZE,
} from '@epam/ai-dial-ui-kit';
import { getForbiddenSymbolsTooltip } from '../../utils';

export interface DialFileManagerItemNameProps extends DialFileManagerItemNameInputProps {
  name: string;
  type: DialItemType;
  elementId: string;
  editing?: boolean;
  loading?: boolean;
  creating?: boolean;
  shared?: boolean;
  /** Replaces the type icon in the read-only name; the editing input keeps its own. */
  icon?: ReactNode;
  details?: ReactNode;
  sharedIndicatorTooltip?: ReactNode;
  fileExtension?: string;
  validate?: (value: string) => string | null;
  onSave?: (value: string) => void;
  onCancel?: () => void;
  onCreateFolderSave?: (value: string) => void;
  onCreateFolderCancel?: () => void;
  hideTooltip?: boolean;
  forbiddenSymbolsRegExp?: RegExp;
  forbiddenSymbolsTooltip?: ReactNode;
  /** Search query whose first case-insensitive match is highlighted in the read-only name. */
  searchQuery?: string;
  /** Screen-reader text announcing the shared state while `searchQuery` is set. Defaults to `'Shared'`. */
  sharedLabel?: string;
}

/**
 * A component that renders a file or folder name with optional edit mode.
 *
 * When `editing` is `false`, it displays a read-only name via `FileName`,
 * which draws the folder or file-type icon by `type`.
 *
 * When `editing` is `true`, it renders an editable input using `DialItemNameInput`,
 * driven by validation and change logic from the `useEditableItem` hook.
 *
 * @example
 * ```tsx
 * import { DialFileManagerItemName } from '@epam/ai-dial-react-file-manager';
 * import { DialItemType } from '@epam/ai-dial-ui-kit';
 *
 * function Example() {
 *   return (
 *     <DialFileManagerItemName
 *       name="Project"
 *       type={DialItemType.Folder}
 *       elementId="folder-123"
 *       editing={true}
 *       validate={(value) => (value.trim() ? null : 'Name cannot be empty')}
 *       onSave={(newName) => console.log('Saved:', newName)}
 *       onCancel={() => console.log('Canceled')}
 *     />
 *   );
 * }
 * ```
 *
 * @param props - Component props.
 * @returns Rendered file or folder name element (editable or static).
 */
export const DialFileManagerItemName: FC<DialFileManagerItemNameProps> = ({
  name,
  type,
  elementId,
  editing = false,
  loading = false,
  creating = false,
  shared = false,
  icon,
  iconSize = BASE_ICON_SIZE,
  validate,
  onSave,
  fileExtension,
  onCancel,
  onCreateFolderCancel,
  onCreateFolderSave,
  inputContainerClassName,
  sharedIndicatorClassName,
  sharedIndicatorTooltip,
  hideTooltip = false,
  forbiddenSymbolsRegExp,
  forbiddenSymbolsTooltip,
  details,
  searchQuery,
  sharedLabel = 'Shared',
}) => {
  const { value, invalid, invalidMessage, onChange, inputRef } =
    useEditableItem({
      value: name,
      isEditing: editing,
      isCreating: creating,
      isLoading: loading,
      onValidate: validate,
      onCancel,
      onSave,
      onCreateFolderCancel,
      onCreateFolderSave,
    });

  if (!editing && !creating) {
    const tooltipContent = getForbiddenSymbolsTooltip(
      {
        name,
        isFolder: type === DialItemType.Folder,
      },
      forbiddenSymbolsRegExp,
      forbiddenSymbolsTooltip,
    );
    const hasRestrictedSymbolsInName = !!tooltipContent;

    /*
     * `FileName` takes no query, so a search result keeps its icon and swaps
     * the name for `Highlight`, which truncates with a tooltip the same way.
     * A name with forbidden symbols keeps `FileName` for its warning tooltip.
     */
    if (searchQuery?.trim() && !details && !hasRestrictedSymbolsInName) {
      return (
        <div className="flex w-full min-w-0 max-w-[428px] items-center gap-2">
          {icon != null && !loading ? (
            <span
              aria-hidden
              className="flex shrink-0 items-center justify-center"
            >
              {icon}
            </span>
          ) : (
            <FileIcon
              name={name}
              type={type}
              fileExtension={fileExtension}
              shared={shared}
              loading={loading}
              size={iconSize}
              sharedIndicatorClassName={sharedIndicatorClassName}
              sharedIndicatorTooltip={sharedIndicatorTooltip}
              decorative={!loading}
            />
          )}
          <div className="flex min-w-0 flex-1">
            <Highlight
              text={name}
              query={searchQuery}
              maxLines={1}
              className="dial-small-paragraph-text text-primary"
            />
            {shared && <span className="sr-only">{sharedLabel}</span>}
          </div>
        </div>
      );
    }

    return (
      <FileName
        className="max-w-[428px]"
        name={name}
        type={type}
        fileExtension={fileExtension}
        details={details}
        loading={loading}
        shared={shared}
        icon={icon}
        iconSize={iconSize}
        sharedIndicatorClassName={sharedIndicatorClassName}
        sharedIndicatorTooltip={sharedIndicatorTooltip}
        hideTooltip={hideTooltip}
        isInvalidName={hasRestrictedSymbolsInName}
        tooltipContent={tooltipContent}
      />
    );
  }

  return (
    <DialFileManagerItemNameInput
      type={type}
      name={value}
      elementId={elementId}
      inputInvalid={invalid}
      inputInvalidMessage={invalidMessage}
      inputRef={inputRef}
      onChange={onChange}
      iconSize={iconSize}
      fileExtension={fileExtension}
      inputContainerClassName={inputContainerClassName}
      sharedIndicatorTooltip={sharedIndicatorTooltip}
      sharedIndicatorClassName={sharedIndicatorClassName}
    />
  );
};
