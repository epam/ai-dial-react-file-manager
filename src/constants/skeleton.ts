import { SkeletonTone } from '@epam/ai-dial-ui-kit';

/** Alternating bar tone for the row at `index`: dark, light, dark, … */
export const getSkeletonTone = (index: number): SkeletonTone =>
  index % 2 === 0 ? SkeletonTone.Sunken : SkeletonTone.Base;
