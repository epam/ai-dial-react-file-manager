import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCompactNavigation } from '@/components/FileManager/hooks/use-compact-navigation';

describe('Dial UI Kit :: FileManager :: useCompactNavigation', () => {
  it('starts closed', () => {
    const { result } = renderHook(() => useCompactNavigation(true));
    expect(result.current.isCompactNavigationShown).toBe(false);
  });

  it('opens and closes the card in the compact view', () => {
    const { result } = renderHook(() => useCompactNavigation(true));

    act(() => {
      result.current.setIsCompactNavigationOpen(true);
    });
    expect(result.current.isCompactNavigationShown).toBe(true);

    act(() => {
      result.current.closeCompactNavigation();
    });
    expect(result.current.isCompactNavigationShown).toBe(false);
  });

  it('never reports the card shown outside the compact view', () => {
    const { result } = renderHook(() => useCompactNavigation(false));

    act(() => {
      result.current.setIsCompactNavigationOpen(true);
    });
    expect(result.current.isCompactNavigationShown).toBe(false);
  });
});
