---
name: release-notes
description: Use when the user asks to enhance, refine, polish, or "look at" the release notes for a tag of @epam/ai-dial-react-file-manager — typically a freshly cut release. Reads the CI-generated notes off the GitHub release, classifies and rewrites each bullet in this project's editorial voice, and saves a draft to `.claude/release-notes/`. Also identifies whether CHANGELOG.md needs updating for breaking changes. Never edits GitHub directly.
allowed-tools: Read Grep Glob Bash(gh release view:*) Bash(gh release list:*) Bash(gh pr view:*) Bash(gh pr list:*) Bash(gh pr diff:*) Bash(git log:*) Bash(git show:*) Bash(git diff:*) Bash(git tag:*) Bash(git rev-parse:*) Bash(date:*) Write(.claude/release-notes/*)
argument-hint: '[tag]'
arguments: tag
model: opus
effort: xhigh
context: fork
agent: general-purpose
---

# @epam/ai-dial-react-file-manager — release-notes enhancer

This repo's release CI (the shared `epam/ai-dial-ci` `node_release.yml` workflow, same one used by `ai-dial-ui-kit`) publishes a GitHub release for every tag with bullets that are the raw PR titles. Those bullets carry noise — conventional-commit prefixes (`feat:`, `fix:`, `chore:`), issue refs, a `## Tests` section with zero consumer impact, and a `## Other` bucket that mixes real dependency upgrades with pure tooling/CI churn. This skill reproduces the human editorial pass that turns those raw notes into something a consumer of the package would actually want to read.

You are running in a forked, isolated context. Read and research freely — only the final summary you return reaches the main conversation. All file writes happen in this fork; the draft lands at `.claude/release-notes/<tag>-draft.md`.

## When to use

- "Enhance the release notes for `0.1.0`"
- "Look at the latest release notes and refine them"
- "The CI just published `<tag>`, make it readable"
- "Polish the release notes for the current tag"

Do **not** trigger on requests like "what changed in `0.1.0`?" — that is a recall question, not a notes-editing task.

## Inputs

`tag` = `$tag` — the GitHub release tag to enhance (e.g. `0.1.0`). If empty, pick the most recent tag from `gh release list --limit 5` and confirm with the user before editing.

**This package has not yet cut a stable release** (`package.json` version is `0.0.0`, `gh release list` currently returns nothing). If there is no prior release to anchor style against, skip step 1.3 below and fall back to the rewrite rules in §5 directly — don't block on finding a predecessor.

## Workflow

### 1. Resolve target and reference styles

1. `gh release view <tag> --json body,name,tagName` — capture the raw CI notes.
2. `gh release list --limit 10` — locate the previous release, if any.
3. If a previous release exists: `gh release view <prev-tag> --json body` — use it as a style anchor, matching terseness (one line per bullet). If none exists, this is the first release — rely on §5 rules and the conventions in `CONTRIBUTING.md` (Conventional Commit PR titles, `Dial*` component naming) instead.
4. `git log <prev-tag>..<tag> --oneline` (or `git log <tag> --oneline` if there is no prior tag) — full commit list for the range, to spot commits the CI dropped.

### 2. Pull source context for each bullet

For every bullet in the raw notes:

1. Parse out the trailing `(#<PR>)` (this repo's PR titles are typically flat Conventional Commits — `feat: add ButtonDropdown (#13)` — without the per-component scope prefixes ai-dial-ui-kit uses, and issue numbers are rare so far).
2. `gh pr view <PR> --json title,body,labels` — read the PR body for the _why_; the title alone is often just the commit subject.
3. For bullets without a PR number, find the commit with `git log <range> --oneline | grep -i <keywords>` and `git show <hash>` — fold into a related entry rather than leaving standalone.

**Dependency-bump PRs:** This repo mixes UI-kit/peer-dependency bumps (`chore: bump @epam/ai-dial-ui-kit to 0.13.0-dev.51`) with routine dev-dependency bumps (`chore: bump fast-uri from 3.1.2 to 3.1.5`). Treat peer-dependency bumps to `@epam/ai-dial-ui-kit` as consumer-relevant when they carry renamed/adopted components (check the PR body for "adopt renamed" or similar); treat routine dev-only bumps as noise unless they're security fixes.

### 3. Check CHANGELOG.md for breaking changes

Before writing the draft, read `CHANGELOG.md`. This project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with `### Added` / `### Changed` / `### Fixed` / `### Removed` subsections under each version heading — there is no separate migration-guides directory in this repo (unlike `ai-dial-ui-kit`); `CONTRIBUTING.md` just requires "an approved breaking change in `CHANGELOG.md`" with migration guidance inline.

- If the raw release notes contain a change that removes/renames a public export from `src/index.ts` or alters `DialFileManagerProps`/other public prop shapes, confirm it's called out in `CHANGELOG.md` under the matching version with enough guidance for a consumer to migrate.
- If such a breaking change appears in the raw release notes but **not** in `CHANGELOG.md`, note this in the editorial file as an open question — the user needs to add the CHANGELOG entry before the release is complete.

### 4. Classify each bullet

The raw CI's `## Features` / `## Fixes` / `## Tests` / `## Other` partition is unreliable. Reclassify by actual consumer impact:

| Where CI put it                               | Where it belongs | Rule                                          |
| ---------------------------------------------- | ----------------- | ---------------------------------------------- |
| `Other` starting with `feat:`                 | `Features`        | A feat that lost its slot.                     |
| `Other` starting with `fix:`                  | `Fixes`            | Same, for fix.                                 |
| `Tests` — any entry                           | **Drop**           | Zero consumer impact.                          |
| Multiple PRs on the same component/feature    | one folded entry  | Cite PR numbers in parens.                     |
| `Other` for a security dep bump (CVE)         | `Fixes`            | Security items are consumer-relevant.          |
| `Other` for `@epam/ai-dial-ui-kit` peer bump  | `Features`/`Fixes`| Only if it changes consumer-visible behavior.  |

**Drop these entirely** — no consumer-visible effect:

- All `## Tests` entries (added/updated unit tests, coverage work, Storybook story additions that only cover existing behavior).
- Agent/tooling scaffolding (`chore: add code-reviewer agent`, hook additions, CI template bumps).
- CI-only changes (workflow renames, `Upgrade CI template version`, Storybook GH Pages deploy setup).
- Routine dev-dependency bumps that aren't security-relevant (lint tooling, test runners, build plugins) unless the user wants a full dependency ledger.
- Pure internal refactors, renames, test-only changes, `Merge remote-tracking` commits.

**Keep in `Other`** — items consumers or maintainers care about:

- Security-adjacent dependency bumps (CVE fixes, e.g. the `fast-uri`/`postcss` style bumps if flagged as security).
- Peer dependency changes to `@epam/ai-dial-ui-kit` or React that affect what consumers must install.
- Significant dev tooling that affects contributors (e.g. new Storybook capability, new required Node/npm version).

**Flag as `[Breaking]`** — items that require consumer code changes:

- Renamed/removed exports from `src/index.ts`, changed `DialFileManagerProps` (or other public prop) shapes, altered grid/toolbar/popup option contracts, removed hooks.
- Include migration guidance inline (there is no `migration-guides/` folder in this repo): `(#<PR>) — migrate by <one-line instruction>`.

If unsure whether to keep a bullet: _would someone consuming `@epam/ai-dial-react-file-manager` reading these notes care?_ If no, drop it.

### 5. Rewrite each kept bullet

Raw form: `feat: description (#NNN)` or `fix: description (#NNN)`. Rewrite to:

```
* <Active-voice description of what changed> — <brief why-it-matters> (#<PR>)
```

Rules in order of importance:

1. **One line per bullet.** No multi-paragraph descriptions.
2. **Drop the conventional prefix** (`feat:`, `fix:`, `chore:`, `refactor:`). Replace with prose.
3. **Use a `—` em-dash for the "why" clause**, not a hyphen or colon.
4. **Backticks for code identifiers**: exported component names (`` `DialFileManager` ``, `` `DialFoldersTree` ``), prop names (`` `onItemClick` ``), hook names (`` `useFileManagerContext` ``), type names.
5. **Preserve PR refs at the end** in `(#<PR>)` form. For grouped entries list all PRs: `(#8, #10, #13)`.
6. **Prefix with `[Breaking]`** for breaking changes; state the migration inline.
7. **Flag regressions explicitly**: `(regression fix)` for items restoring previously-working behavior.
8. **Quote CVE IDs verbatim** for security upgrades.
9. **For new exported components/hooks**, lead with the name in backticks: `` `DialButtonDropdown` added — ... ``.

#### Example transformations (this project's patterns)

```
# New component, active voice:
- * feat: add ButtonDropdown (#13)
+ * `DialButtonDropdown` added — combines a primary action button with a menu of secondary actions (#13)

# Grouping a fix that immediately follows a feature:
- * feat: add new Buttons and Notifications (#11)
- * fix: fix button action size (#16)
+ * `DialButton` action variants and notification components added, including a follow-up sizing fix (#11, #16)

# Dropping the conventional prefix, em-dashing the why:
- * fix: fix sorting by name is case sensitive (#18)
+ * Folder/file sorting by name is now case-insensitive (#18)

# UI-kit peer bump that changes exported component names:
- * chore: adopt renamed UI Kit components (ai-dial-ui-kit 0.13.0-dev.42) (#14)
+ * Adopted renamed `@epam/ai-dial-ui-kit` components (0.13.0-dev.42) — no consumer-visible change beyond the peer dependency bump (#14)

# Breaking change with inline migration note:
- * feat: rename `FileTreeOptions.onSelect` to `onSelectionChange` (#NNN)
+ * [Breaking] `FileTreeOptions.onSelect` renamed to `onSelectionChange` (#NNN) — update prop name; signature is unchanged

# Dropping noise from Tests:
- * chore: add unit tests for FileManagerTooltip, useFileMetadata, useGridActionsColumn (#3)  ← drop entirely

# Dropping CI/tooling noise:
- * feat: add GitHub Actions workflow for deploying Storybook to GitHub Pages (#8)  ← drop (contributor tooling, not package behavior)
- * fix: bump actions/checkout from 6.0.3 to 7.0.1 (#1)  ← drop (CI-only)

# Dropping routine dev-dependency bumps:
- * chore: bump shell-quote and concurrently (#4)  ← drop
```

### 6. Save the draft (and optional editorial companion)

Write:

- **`.claude/release-notes/<tag>-draft.md`** — the final notes, ready to paste into the GitHub release body. No preamble or commentary — just headings and bullets.
- **`.claude/release-notes/<tag>-editorial-notes.md`** _(optional, only when useful)_ — non-obvious calls worth surfacing:
  - Grouping decisions (which PRs were folded and why).
  - Items dropped, with one-line reason each.
  - Open questions (missing CHANGELOG entry for a breaking change, ambiguous classification, an unrecognized dependency).

### 7. Verify nothing was pushed to GitHub

This skill **never** runs `gh release edit`, `gh release create`, or any write operation against the repo. Drafts only.

## Output format

The file saved to `.claude/release-notes/<tag>-draft.md` follows this shape exactly (including `---` separators, which match the CI format):

```markdown
## Features

- <one bullet per change or group>

---

## Fixes

- <one bullet per change>

---

## Other

- <only consumer- or maintainer-relevant items>
```

Omit any section that has no entries. Do **not** include a `## Tests` section. Section order: `Features` → `Fixes` → `Other`.

Breaking changes appear at the **top of `Features`** (or `Fixes` if it is only a behavioral correction), prefixed with `[Breaking]`.

## Return to the main conversation

Return a short summary — five lines or fewer:

- The draft path (`.claude/release-notes/<tag>-draft.md`).
- Counts of bullets per section after enhancement and grouping.
- Groupings that happened (e.g. "folded the button-action fix into the Buttons/Notifications feature bullet").
- Reclassifications (e.g. "moved 2 from Other → Features").
- Items dropped (count, with one example).
- Whether any breaking changes were found, and if their CHANGELOG.md entries exist.
- Any open questions (missing migration note, ambiguous item, unrecognized dependency).

Example:

> Drafted `.claude/release-notes/0.1.0-draft.md`. 5 Features (grouped from 7 raw), 3 Fixes, 1 Other. Folded the button-sizing fix into the Buttons/Notifications feature bullet. Reclassified 1 item (Other → Fixes: fast-uri security bump). Dropped 6 items (Tests section, Storybook CI workflow, actions/checkout bump). No breaking changes detected.

## Safety rails

- **Never edit GitHub.** No `gh release edit`, no `gh release create`. Drafts only.
- **Never invent items.** Every kept bullet maps to a PR or a commit hash in the range.
- **Never silently drop a PR reference.** The bullet ends with the canonical `(#<PR>)` refs.
- **Match the terseness of the predecessor's notes** when one exists; otherwise keep bullets to a single line each.

## Maintenance

If you notice a pattern in the raw CI notes that this skill doesn't handle (a new CI section, a recurring rewrite the user keeps requesting, a dependency category that misroutes), surface it in your return summary and offer to update this `SKILL.md`. The user can confirm before any edit lands.
