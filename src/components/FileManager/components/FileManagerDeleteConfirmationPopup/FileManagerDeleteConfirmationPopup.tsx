import { type FC, type ReactNode } from 'react';
import {
  ConfirmationPopup,
  ConfirmationPopupVariant,
  DangerButton,
  GhostButton,
} from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';
import { FILE_MANAGER_ICON_PROPS } from '@/constants/icon';
import type { DialFile } from '@/models/file';

export interface FileManagerDeleteConfirmationPopupProps {
  open: boolean;
  itemsToDelete: DialFile[];
  onClose: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  closeLabel?: string;
  titleRenderer?: (fileNames: string[], items: DialFile[]) => ReactNode;
  contentRenderer?: (fileNames: string[], items: DialFile[]) => ReactNode;
}

/**
 * Confirmation popup for deleting files in FileManager.
 * Shows a list of files to be deleted with customizable title and content,
 * a close control in the header, a text Cancel, and a danger Delete with a
 * leading trash icon.
 *
 * @param open - Controls visibility of the popup
 * @param itemsToDelete - Array of files to be deleted
 * @param onClose - Callback when popup is closed
 * @param onConfirm - Callback when delete is confirmed
 * @param [cancelLabel='Cancel'] - Label for cancel button
 * @param [confirmLabel='Delete'] - Label for confirm button
 * @param [closeLabel='Close dialog'] - Accessible name of the header close control
 * @param [titleRenderer] - Custom title renderer; receives the names and the items, so it can tell a folder from a file by `nodeType`
 * @param [contentRenderer] - Custom content renderer; receives the names and the items
 */
export const FileManagerDeleteConfirmationPopup: FC<
  FileManagerDeleteConfirmationPopupProps
> = ({
  open,
  itemsToDelete,
  onClose,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Delete',
  closeLabel = 'Close dialog',
  titleRenderer,
  contentRenderer,
}) => {
  const fileNames = itemsToDelete.map((item) => item.name);

  const defaultTitle = 'Confirm Deleting Items';
  const title = titleRenderer?.(fileNames, itemsToDelete) || defaultTitle;

  const defaultContent = (
    <div className="px-6 py-3 dial-small-text">
      <p className="text-secondary mb-3">
        {itemsToDelete.length === 1 ? (
          <>
            Do you want to delete file or folder{' '}
            <span className="text-primary break-all">
              "{itemsToDelete[0].name}"
            </span>
            ?
          </>
        ) : (
          <>
            Do you want to delete the following{' '}
            <span className="text-primary">{itemsToDelete.length}</span> items?
          </>
        )}
      </p>
      {itemsToDelete.length > 1 && (
        <>
          {itemsToDelete.length <= 10 ? (
            <ul className="space-y-1 text-primary list-none">
              {itemsToDelete.map((item) => (
                <li key={item.path} className="truncate">
                  {item.name}
                </li>
              ))}
            </ul>
          ) : (
            <>
              <ul className="space-y-1 text-primary list-none mb-2">
                {itemsToDelete.slice(0, 10).map((item) => (
                  <li key={item.path} className="truncate">
                    {item.name}
                  </li>
                ))}
              </ul>
              <p className="text-secondary italic">
                ... and {itemsToDelete.length - 10} more
              </p>
            </>
          )}
        </>
      )}
    </div>
  );

  const content = contentRenderer?.(fileNames, itemsToDelete) || defaultContent;

  /*
   * The kit's own footer pairs a solid neutral Cancel with an icon-less
   * confirm and drops the header close control. The delete design wants a
   * text Cancel, a danger Delete led by a trash icon, and the close control,
   * so the footer is supplied here — which also keeps the kit's X.
   */
  const footer = (
    <div className="flex justify-end gap-2 px-6 py-4 border-t border-tertiary">
      <GhostButton label={cancelLabel} onClick={onClose} />
      <DangerButton
        label={confirmLabel}
        iconBefore={<IconTrashX {...FILE_MANAGER_ICON_PROPS} aria-hidden />}
        onClick={onConfirm}
      />
    </div>
  );

  return (
    <ConfirmationPopup
      open={open}
      header={title}
      ariaLabel={typeof title === 'string' ? title : defaultTitle}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      variant={ConfirmationPopupVariant.Danger}
      footer={footer}
      closeAriaLabel={closeLabel}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      {content}
    </ConfirmationPopup>
  );
};
