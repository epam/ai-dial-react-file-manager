# Contributing to AI DIAL React File Manager

Thank you for your interest in contributing to AI DIAL React File Manager.

## Prerequisites

- Node.js 22.2 or newer
- npm 10.7 or newer

## Development workflow

The `development` branch is the integration branch. Create a focused feature
branch from it and open a pull request back to `development`.

```bash
git checkout development
git pull origin development
git checkout -b your-feature-name
npm ci
```

Run Storybook for local visual development:

```bash
npm run storybook
```

## Component and API guidelines

- Follow the existing `Dial*` naming used by exported components.
- Keep component, story, and test files colocated with the existing structure.
- Add public exports to `src/index.ts` and export consumer-facing types.
- Use the existing Tailwind tokens and utilities; avoid inline styles and
  hardcoded design values.
- Preserve accessibility, keyboard interaction, selection behavior, and async
  error states.
- Avoid breaking public APIs. Document an approved breaking change in
  `CHANGELOG.md` and provide migration guidance.

## Verification

Before opening a pull request, run:

```bash
npm run typecheck
npm run lint
npm run format
npm run test
npm run build
```

Update or add tests and Storybook stories for behavior or visual changes. Keep
the repository-wide test coverage at or above 70%.

## Pull requests

- Use a [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/)
  style pull request title.
- Link the related issue when one exists.
- Keep the change focused and describe API or UI impact.
- Confirm that no confidential information, credentials, or private endpoints
  are included.
- Address review feedback and keep all required checks passing.

Publishing is performed only by project maintainers through the release
process. Contributors should not publish package versions manually.

For the wider AI DIAL contribution policy, see the
[AI DIAL contributing documentation](https://github.com/epam/ai-dial/blob/main/CONTRIBUTING.md).
