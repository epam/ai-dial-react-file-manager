# Add or align stories/examples + tests

For the component(s) or behavior in scope:

1. **Stories/examples** - Default plus variants: loading, empty, error,
   disabled, selected, long filenames, permission states.
2. **Vitest** - User interactions (click, type, keyboard, selection,
   upload/download triggers) via Testing Library; assert visible outcomes and
   callbacks.
3. **Coverage** - Aim to cover branches you added; follow existing spec style
   in this repository.
4. **Exports** - If the component or hook is public, confirm package exports
   match the import path consumers would use.

After edits, run `npm run typecheck`, `npm run lint`, and `npm run test` when
those scripts exist. Stories/examples and specs must typecheck too.
