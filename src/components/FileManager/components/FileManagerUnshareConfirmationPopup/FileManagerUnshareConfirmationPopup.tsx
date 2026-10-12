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

const MAX_LISTED_ITEMS = 10;

export interface FileManagerUnshareConfirmationPopupProps {
  open: boolean;
  itemsToUnshare: DialFile[];
  onClose: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  closeLabel?: string;
  titleRenderer?: (fileNames: string[], items: DialFile[]) => ReactNode;
  contentRenderer?: (fileNames: string[], items: DialFile[]) => ReactNode;
}

/**
 * Confirmation popup for unsharing shared-with-me items in FileManager.
 * Mirrors the delete confirmation: header close control, a text Cancel and
 * a danger Unshare led by a trash icon.
 *
 * @param open - Controls visibility of the popup
 * @param itemsToUnshare - Items to be unshared
 * @param onClose - Callback when popup is closed
 * @param onConfirm - Callback when unshare is confirmed
 * @param [cancelLabel='Cancel'] - Label for cancel button
 * @param [confirmLabel='Unshare'] - Label for confirm button
 * @param [closeLabel='Close dialog'] - Accessible name of the header close control
 * @param [titleRenderer] - Custom title renderer; receives the names and the items
 * @param [contentRenderer] - Custom content renderer; receives the names and the items
 */
export const FileManagerUnshareConfirmationPopup: FC<
  FileManagerUnshareConfirmationPopupProps
> = ({
  open,
  itemsToUnshare,
  onClose,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Unshare',
  closeLabel = 'Close dialog',
  titleRenderer,
  contentRenderer,
}) => {
  const fileNames = itemsToUnshare.map((item) => item.name);
  const listedItems = itemsToUnshare.slice(0, MAX_LISTED_ITEMS);
  const restCount = itemsToUnshare.length - listedItems.length;

  const defaultTitle = 'Confirm Unsharing Items';
  const title = titleRenderer?.(fileNames, itemsToUnshare) || defaultTitle;

  const defaultContent = (
    <div className="px-6 py-3 dial-small-text">
      <p className="text-secondary mb-3">
        {itemsToUnshare.length === 1 ? (
          <>
            Do you want to unshare{' '}
            <span className="text-primary break-all">
              "{itemsToUnshare[0]?.name}"
            </span>
            ?
          </>
        ) : (
          <>
            Do you want to unshare the following{' '}
            <span className="text-primary">{itemsToUnshare.length}</span> items?
          </>
        )}
      </p>
      {itemsToUnshare.length > 1 && (
        <>
          <ul className="space-y-1 text-primary list-none mb-2">
            {listedItems.map((item) => (
              <li key={item.path} className="truncate">
                {item.name}
              </li>
            ))}
          </ul>
          {restCount > 0 && (
            <p className="text-secondary italic">... and {restCount} more</p>
          )}
        </>
      )}
    </div>
  );

  const content =
    contentRenderer?.(fileNames, itemsToUnshare) || defaultContent;

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
