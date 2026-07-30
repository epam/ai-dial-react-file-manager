import { NotificationVariant } from '@epam/ai-dial-ui-kit';

export const DEFAULT_WARNINGS = {
  hiddenItemWarning: `${NotificationVariant.Warning}__A dot at the start of the name will make the item hidden`,
};

export const DEFAULT_ERRORS = {
  consecutiveDotsError: 'Name cannot contain consecutive dots',
};
