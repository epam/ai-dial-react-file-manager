import type { FC, ReactNode, Ref } from 'react';
import type { DialItemType } from '@epam/ai-dial-ui-kit';
import {
  FileIcon,
  Input,
  Tooltip,
  mergeClasses,
  NotificationVariant,
  editableContainerProps,
} from '@epam/ai-dial-ui-kit';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import {
  IconAlertCircleFilled,
  IconAlertTriangleFilled,
} from '@tabler/icons-react';

export interface DialFileManagerItemNameInputProps {
  type: DialItemType;
  name: string;
  shared?: boolean;
  loading?: boolean;
  elementId: string;
  iconSize?: number;
  iconClassName?: string;
  iconLabel?: string;
  inputInvalid?: boolean;
  inputInvalidMessage?: string;
  inputContainerClassName?: string;
  inputIconAfter?: ReactNode;
  inputRef?: Ref<HTMLInputElement>;
  onChange?: (value?: string) => void;
  sharedIndicatorClassName?: string;
  sharedIndicatorTooltip?: ReactNode;
  fileExtension?: string;
}

/**
 * Combines a file/folder icon with an editable text input.
 *
 * Used for renaming or labeling file/folder entities within the File Manager.
 * Displays:
 * - The item icon (with optional loading/shared state)
 * - An inline text input
 * - A validation tooltip when `inputInvalid` is `true`
 *
 * @example
 * ```tsx
 * <DialFileManagerItemNameInput
 *   type={DialItemType.File}
 *   name="report.pdf"
 *   elementId="file-input-1"
 *   shared
 *   onChange={(value) => console.log('New name:', value)}
 * />
 *
 * <DialFileManagerItemNameInput
 *   type={DialItemType.Folder}
 *   name="Project A"
 *   elementId="folder-input-2"
 *   inputInvalid
 *   inputInvalidMessage="Invalid name"
 * />
 * ```
 *
 * @param {Object} props
 * @param {DialItemType} props.type - The type of item (file or folder).
 * @param {string} props.name - Current name of the entity.
 * @param {string} props.elementId - Unique ID for the input element.
 * @param {boolean} [props.shared=false] - Whether the entity is shared.
 * @param {boolean} [props.loading=false] - Whether the icon is loading.
 * @param {number} [props.iconSize] - Optional size override for the icon.
 * @param {string} [props.iconClassName] - Optional CSS class for the icon.
 * @param {string} [props.iconLabel] - Optional accessible label for the icon.
 * @param {boolean} [props.inputInvalid=false] - Marks the input as invalid.
 * @param {string} [props.inputInvalidMessage] - Tooltip message shown when invalid.
 * @param {ReactNode} [props.inputIconAfter] - Optional icon shown after the input (defaults to an error icon).
 * @param {string} [props.inputContainerClassName] - Additional CSS classes applied to the input container.
 * @param {Ref<HTMLInputElement>} [props.inputRef] - Ref to access the underlying input element.
 * @param {(value: string) => void} [props.onChange] - Callback fired when input value changes.
 * @param {string} [props.sharedIndicatorClassName] - Additional CSS classes for the shared indicator.
 */
export const DialFileManagerItemNameInput: FC<
  DialFileManagerItemNameInputProps
> = ({
  name,
  type,
  elementId,
  loading = false,
  shared = false,
  iconClassName,
  iconLabel,
  iconSize,
  inputInvalid,
  inputInvalidMessage,
  inputContainerClassName,
  inputIconAfter,
  inputRef,
  onChange,
  sharedIndicatorClassName,
  sharedIndicatorTooltip,
  fileExtension,
}) => {
  const getInputIconAfter = () => {
    const isWarning = inputInvalidMessage?.startsWith(
      `${NotificationVariant.Warning}__`,
    );

    if (!inputInvalid && !isWarning) return null;

    const cleanedMessage = inputInvalidMessage?.replace(
      `${NotificationVariant.Warning}__`,
      '',
    );
    return (
      <Tooltip tooltip={cleanedMessage}>
        {inputIconAfter ||
          (!isWarning ? (
            <IconAlertCircleFilled
              {...FILE_MANAGER_ICON_PROPS}
              className="text-error"
              aria-label="alert"
            />
          ) : (
            <IconAlertTriangleFilled
              {...FILE_MANAGER_ICON_PROPS}
              className="text-warning-icon"
              aria-label="warning"
            />
          ))}
      </Tooltip>
    );
  };

  return (
    <div className="flex gap-2 items-center" {...editableContainerProps}>
      <FileIcon
        name={name}
        type={type}
        label={iconLabel}
        className={iconClassName}
        size={iconSize ?? FILE_MANAGER_ICON_PROPS.size}
        loading={loading}
        shared={shared}
        fileExtension={fileExtension}
        sharedIndicatorClassName={sharedIndicatorClassName}
        sharedIndicatorTooltip={sharedIndicatorTooltip}
      />
      <Input
        containerClassName={mergeClasses(
          '!h-5 !py-[1px] !pl-[7px] pr-[7px]',
          inputContainerClassName,
        )}
        id={elementId}
        value={name}
        onChange={onChange}
        invalid={inputInvalid}
        iconAfter={getInputIconAfter()}
        inputRef={inputRef}
      />
    </div>
  );
};
