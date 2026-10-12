import { type FC, type ReactNode, useEffect, useId, useRef } from 'react';

import { DIAL_ICON_SIZE, FolderName, mergeClasses } from '@epam/ai-dial-ui-kit';
import { IconChevronDown } from '@tabler/icons-react';

import { FILE_MANAGER_ICON_STROKE } from '@/constants/icon';
import {
  compactNavigationChevronClassName,
  compactNavigationClassName,
  compactNavigationPanelClassName,
  compactNavigationTriggerClassName,
} from './constants';

export interface DialFileManagerCompactNavigationProps {
  /** Name of the folder currently shown in the grid. */
  label: string;
  /** Whether the panel with the sections and the folders tree is open. */
  isOpen: boolean;
  /** Fired with the next open state when the trigger is pressed. */
  onOpenChange: (isOpen: boolean) => void;
  /** Content of the open panel: the section chips and the folders tree. */
  children: ReactNode;
  /** Additional classes for the card. */
  className?: string;
}

/**
 * DialFileManagerCompactNavigation
 *
 * The compact view's stand-in for the folders panel: a card naming the current
 * folder that opens into the section chips and the folders tree. The open
 * state is owned by the parent, which closes the card once a folder is picked.
 * Focus left inside the panel when it closes returns to the trigger.
 *
 * @example
 * ```tsx
 * <DialFileManagerCompactNavigation
 *   label="My files"
 *   isOpen={isOpen}
 *   onOpenChange={setIsOpen}
 * >
 *   <DialFoldersTree items={items} onItemClick={handlePick} />
 * </DialFileManagerCompactNavigation>
 * ```
 *
 * @param label - Name of the folder currently shown in the grid
 * @param isOpen - Whether the panel with the sections and the folders tree is open
 * @param onOpenChange - Fired with the next open state when the trigger is pressed
 * @param children - Content of the open panel
 * @param [className] - Additional classes for the card
 */
export const DialFileManagerCompactNavigation: FC<
  DialFileManagerCompactNavigationProps
> = ({ label, isOpen, onOpenChange, children, className }) => {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(isOpen);

  useEffect(() => {
    // The panel unmounts on close, which drops focus held inside it to the body.
    if (
      wasOpenRef.current &&
      !isOpen &&
      document.activeElement === document.body
    ) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  return (
    <div
      className={mergeClasses(
        compactNavigationClassName,
        { 'min-h-0 flex-1': isOpen },
        className,
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        className={compactNavigationTriggerClassName}
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        onClick={() => onOpenChange(!isOpen)}
      >
        <FolderName
          name={label}
          iconSize={DIAL_ICON_SIZE.LG}
          className="min-w-0 flex-1"
          hideTooltip
        />
        <span
          className={mergeClasses(compactNavigationChevronClassName, {
            'rotate-180': isOpen,
          })}
          aria-hidden="true"
        >
          <IconChevronDown
            stroke={FILE_MANAGER_ICON_STROKE}
            size={DIAL_ICON_SIZE.SM}
          />
        </span>
      </button>

      {isOpen && (
        <div id={panelId} className={compactNavigationPanelClassName}>
          {children}
        </div>
      )}
    </div>
  );
};
