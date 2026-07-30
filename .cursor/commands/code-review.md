# /code-review

Cross-harness slash command. Runs the **code-reviewer** agent for
`@epam/ai-dial-react-file-manager`.

**Source of truth:** `agents/code-reviewer.md` in the repo root. Read it now
and follow it verbatim. Do not invent additional rules - if something is not in
that file or in `AGENTS.md` / `.cursor/rules/`, do not enforce it.

## Steps in this turn

1. Read `agents/code-reviewer.md` (the rubric, output format, and "must not do"
   list are defined there).
2. Identify the review scope:
   - If the user mentioned specific files or a PR, use those.
   - Otherwise, use `git status --porcelain` + `git diff --stat` against the
     first available remote base (`origin/development`, `origin/main`, or
     `origin/master`), falling back to `HEAD` / working tree when no remote
     tracking exists.
3. Read the changed files end-to-end before commenting.
4. Produce the three-section report (`### Summary` / `### Must-fix` /
   `### Nice-to-have`) exactly as specified in `agents/code-reviewer.md`.
5. End with the handoff hint: `/apply-review` for fixes, or
   `npm run review:check` for the automated checklist.

This command is **review-only**. Do not edit files. If the user wants fixes,
they will call `/apply-review` next.
