# Contributing Guide

Thanks for your interest in contributing to **@antv/layout**! Issues and pull requests are welcome.

## Development

Install dependencies:

```bash
npm install
```

Build the library:

```bash
npm run build
```

Start the dev server:

```bash
npm run dev
```

### Documentation site

The docs live in `site/` and are built with Rspress.

```bash
npm --prefix site install
npm --prefix site run dev
```

## Tests

Run unit tests with Jest:

```bash
npm test
```

To collect coverage:

```bash
npm run test:coverage
```

## Filing issues

- Check existing issues before creating a new one.
- Provide a clear title, reproduction steps, and environment details.

## Submitting pull requests

If you have write access, create a branch and open a PR. Otherwise, fork the repo and open a PR from your fork.

```bash
git checkout -b branch-name
npm test
git add .
git commit -m "fix(layout): describe your change"
git push origin branch-name
```

Please include:

1. The problem or feature request (link an issue if possible).
2. Why the change is needed.
3. Test coverage or verification steps.
4. Any compatibility notes or migration hints.

## Commit message format

Follow the Angular commit message format:

```plain
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

Types:

- feat: new feature
- fix: bug fix
- docs: documentation
- style: formatting only
- refactor: refactor without behavior change
- perf: performance improvement
- test: tests
- chore: tooling or maintenance
- deps: dependency updates

Breaking changes must be described in the footer with `BREAKING CHANGE:`.
