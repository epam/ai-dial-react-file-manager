import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useIsMobileScreen } from './use-is-mobile-screen';

const originalInnerWidth = window.innerWidth;

const setInnerWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
  });
};

describe('useIsMobileScreen', () => {
  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  it('updates the mobile state when the window is resized', () => {
    setInnerWidth(500);
    const { result } = renderHook(() => useIsMobileScreen());
    expect(result.current).toBe(true);

    act(() => {
      setInnerWidth(900);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current).toBe(false);
  });
});
