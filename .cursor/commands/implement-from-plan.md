# Implement from an approved plan

You are in **implementation-only** mode.

1. **Source of truth** - Use the **plan already agreed in this thread** (from
   `/plan-component` or the user). If no plan is visible, ask for a short bullet
   plan or a paste before coding.
2. **Scope** - Implement exactly what the plan lists (API, files, exports). Do
   **not** add features, refactors, or files that the plan does not mention
   unless the user explicitly expands scope.
3. **Deliverables** - Match the plan: typically component/hook files,
   stories/examples, specs, and public export updates.
4. **Conventions** - Follow `AGENTS.md`: existing naming, colocation, styling
   utilities, accessibility, and native prop extension where appropriate.
5. **Verify** - After edits run `npm run typecheck`, `npm run lint`, and
   `npm run test` when those scripts exist. Fix all failures you introduce.

Do **not** start a new planning pass or a code review in this turn unless the
user asks.
