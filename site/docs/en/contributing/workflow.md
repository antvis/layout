# Contribution Workflow

## Prerequisites

- Node.js `>= 18.12`
- npm `>= 9` (or a version matching the lockfile)

## Install dependencies

```bash
git clone https://github.com/antvis/layout.git
npm i
```

## Local development

Common workflows grouped by target:

- **Core layout library (repo root)**
  - Start dev server: `npm run dev`
  - Build: `npm run build`
  - Test: `npm test`
- **Docs site (`site`)**
  - Start: `npm --prefix site run dev`
  - Build: `npm --prefix site run build`
- **Full checks (recommended before a PR)**
  - Build: `npm run build`
  - Test: `npm test`

## Pre-submit checklist

- Keep changes minimal and focused (one PR, one purpose)
- Add tests when behavior changes (`__tests__`)
- Keep docs/examples consistent with code (update when adding layouts/params)

## Versions and change logs (optional)

This repo uses Changesets for release notes (`.changeset/`). To add a changeset:

```bash
npx changeset
```

New or updated changesets are aggregated into the changelog on release.

## Open a PR

```bash
git checkout -b feat/your-branch
git add .
git commit -m "feat(layout): ..."
git push origin feat/your-branch
```

Commit messages should follow the Angular convention (see `CONTRIBUTING.md` in the repo root).
