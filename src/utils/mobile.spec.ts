import { afterEach, describe, expect, it } from 'vitest';
import { ScreenType } from '@/types/screen';
import { getScreenType, isMediumScreen, isSmallScreen } from './mobile';

const originalInnerWidth = window.innerWidth;

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
};

describe('mobile utilities', () => {
  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it.each([
    { width: 500, medium: true, small: true },
    { width: 900, medium: true, small: false },
    { width: 1400, medium: false, small: false },
  ])('detects breakpoints at $width px', ({ width, medium, small }) => {
    setInnerWidth(width);

    expect(isMediumScreen()).toBe(medium);
    expect(isSmallScreen()).toBe(small);
  });

  it.each([
    { width: 500, expected: ScreenType.Mobile },
    { width: 800, expected: ScreenType.Tablet },
    { width: 1200, expected: ScreenType.Desktop },
  ])('returns $expected for a $width px viewport', ({ width, expected }) => {
    setInnerWidth(width);

    expect(getScreenType()).toBe(expected);
  });
});
