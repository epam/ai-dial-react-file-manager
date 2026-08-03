# AI agents — AI DIAL React File Manager

This file is read by Cursor, Codex, and other agent harnesses alongside project context. It defines how AI assistants should work in this repository.

## Product

- **What**: `@epam/ai-dial-react-file-manager` — React + TypeScript package for AI DIAL file management interfaces.
- **Build**: React/TypeScript package; follow the scripts and build tooling defined in `package.json`.
- **Docs & dev**: Prefer Storybook/examples and Vitest/Testing Library tests when they exist in the repository.

## Agent principles

1. **Read before edit** — Open related files (component, hooks, types, stories, specs, exports) before changing behavior or API.
2. **Minimal diffs** — Solve the task only; no unrelated refactors or reformatting of untouched code.
3. **Verify** — After substantive TypeScript/React changes: run `npm run typecheck`, `npm run lint`, and `npm run test` when those scripts exist.
4. **Security** — Do not commit secrets; do not paste real tokens into chat; treat `.env` and keys as sensitive.
5. **Delegation mindset** — For large features, split: plan → implement component/logic → stories/examples → tests → exports; ask the user if scope is unclear.

## Component work checklist

- **Naming**: Follow existing exported component naming in this package; use AI DIAL naming consistently for public APIs.
- **Files**: Prefer colocating `Component.tsx`, `Component.stories.tsx`, and `Component.spec.tsx` under the existing component directory pattern.
- **API**: Extend native HTML/React props where appropriate; export prop types when consumers need them.
- **Styles**: Use the repository's existing styling system and utilities; keep accessibility, labels, roles, and keyboard behavior in mind.
- **Exports**: Add public exports to the package entry point used by the repository.

## When to add or update

| Change                      | Also do                                      |
| --------------------------- | -------------------------------------------- |
| New public component        | Story/example, spec, public export           |
| Visual / interaction change | Update stories/examples; adjust or add tests |
| Peer dependency surface     | Document in README or story descriptions     |

## Commands reference

| Script              | Use                                            |
| ------------------- | ---------------------------------------------- |
| `npm run typecheck` | Full TypeScript check; does not replace ESLint |
| `npm run lint`      | ESLint                                         |
| `npm run test`      | Unit/component tests                           |
| `npm run build`     | Package build                                  |
| `npm run storybook` | Local docs and visual QA, if configured        |

If a script is not present in `package.json`, do not invent it; use the closest existing script and mention what could not be run.

## Architecture details

- Check `tsconfig.json` for path aliases before importing.
- Keep file-manager behavior predictable for large file lists, async loading, selection, drag-and-drop, upload/download flows, and error states.
- Keep public exports stable; avoid breaking existing consumers.

## Development Rules

- **No breaking changes** to existing public APIs unless explicitly requested.
- **Always run `typecheck`** after changing `.ts`/`.tsx` files when the script exists; ESLint does not catch all TypeScript errors.
- Tests: prefer roles over tags/text/testId; test visible behavior, callbacks, keyboard interaction, selection state, and async/error flows.
- Branching: use the repository's integration branch when it exists; otherwise default review diffs to `origin/main`, `origin/master`, or the working tree.
- Pre-commit hooks may enforce lint/format/tests; do not skip them unless the user explicitly asks.

## Cursor-specific assets

- **`.cursor/rules/`** — Always-on and file-scoped rules.
- **`.cursor/commands/`** — Slash-style prompts, including a **plan → implement → review → fix** pipeline:

| Command               | Role                                           |
| --------------------- | ---------------------------------------------- |
| `plan-component`      | Plan only; no code until approved              |
| `implement-from-plan` | Code only; follow the agreed plan              |
| `review-changes`      | Review only; no edits (alias of `code-review`) |
| `code-review`         | Review only; no edits (cross-harness command)  |
| `apply-review`        | Fixes only; address listed feedback            |
| `feature-pipeline`    | Run all four phases in order in one thread     |
| `story-and-test`      | Align stories/examples + Vitest for scope      |

## Cross-harness code-review agent

A single `code-reviewer` agent works the same in **Cursor**, **Claude Code**, and **Codex**. The rubric, output format, and constraints live in one file; each harness ships a thin wrapper.

| Surface     | Where to invoke                                                                     |
| ----------- | ----------------------------------------------------------------------------------- |
| Source      | `agents/code-reviewer.md` — single source of truth, read this first                 |
| Cursor      | `/code-review` (or alias `/review-changes`) — `.cursor/commands/code-review.md`     |
| Claude Code | `/code-review` slash command + `code-reviewer` subagent (`.claude/agents/`)         |
| Codex CLI   | `/code-review` prompt — copy `.codex/prompts/code-review.md` to `~/.codex/prompts/` |
| Automated   | `npm run review:check` — local diff-based checklist, no AI required                 |

The agent is **review-only**: it never edits files. To apply must-fix items, run `/apply-review` (Cursor) or re-prompt with "apply must-fix items".
