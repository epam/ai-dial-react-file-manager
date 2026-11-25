import { SkeletonTone } from '@epam/ai-dial-ui-kit';
import { describe, expect, it } from 'vitest';
import { getSkeletonTone } from './skeleton';

describe('getSkeletonTone', () => {
  it('alternates the kit dark and light tones across placeholder rows', () => {
    expect([0, 1, 2, 3, 4, 5].map(getSkeletonTone)).toEqual([
      SkeletonTone.Dark,
      SkeletonTone.Light,
      SkeletonTone.Dark,
      SkeletonTone.Light,
      SkeletonTone.Dark,
      SkeletonTone.Light,
    ]);
  });
});
