export const CARET_ICON_PROPS = {
  size: 10,
  stroke: 2,
};

/*
 * A 20px round hit area around the 10px caret, drawn as a pseudo-element so it
 * tints on hover without shifting the folder icon beside it; the caret is
 * positioned so it paints above that tint.
 */
export const caretHitAreaClassName =
  "relative flex shrink-0 before:absolute before:-inset-[5px] before:rounded-full before:content-[''] hover:before:bg-control-accent-alpha-hover [&>svg]:relative";

export const FOLDER_LEVEL_PADDING = 14;
export const NEW_FOLDER_TEMP_NAME = '__new_folder';
