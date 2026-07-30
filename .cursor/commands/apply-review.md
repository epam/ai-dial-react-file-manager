# Apply review feedback (fixes only)

You are in **fix-only** mode.

1. **Input** - Use the **prioritized review** from this thread (from
   `/review-changes` or pasted comments). If there is no numbered or clear list,
   ask the user to paste the must-fix items.
2. **Scope** - Address **only** the listed issues (must-fix first, then
   nice-to-have if the user asked). Do **not** introduce unrelated cleanups,
   renames, or "while we're here" edits.
3. **Traceability** - For each review item, either fix it or reply with a short
   reason it is out of scope / will not fix, with user confirmation if
   debatable.
4. **Regression** - Prefer minimal diffs; keep public API stable unless the
   review explicitly requires a breaking change.
5. **Verify** - After fixes run `npm run typecheck`, `npm run lint`, and
   `npm run test` when those scripts exist.

Do **not** perform a full new review in this turn unless the user asks.
