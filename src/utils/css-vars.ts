import type { CSSProperties } from 'react';

/** Builds a `CSSProperties` object from CSS custom property names to values, omitting entries that are `undefined` or an empty string. */
export const buildCssVars = (
  vars: Record<string, string | number | undefined>,
): CSSProperties => {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (value !== undefined && value !== '') {
      result[key] = String(value);
    }
  }
  return result as CSSProperties;
};
