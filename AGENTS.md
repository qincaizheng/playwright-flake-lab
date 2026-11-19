# AGENTS.md

## Scope

This repository is a reproducible Playwright fixture for studying interference between test workers. The intentionally broken shared scenario is diagnostic input; the isolated scenario is the regression gate. This repository does not implement the proposed GitHub App yet.

## Setup and checks

- Use Node.js 22 or newer. Install dependencies with `npm ci` and Chromium with `npx playwright install --only-shell chromium` (use `--with-deps` on a fresh Linux CI runner).
- Run `npm test` for the green two-worker gate and `npm run demo:solo` for the single-test control.
- Run `npm run demo:flake` to validate the broken scenario. It should exit nonzero because the reader gets HTTP 404 after cleanup, not because of a startup or browser error.

## Change rules

- Write or adjust a behavior test first. Keep the same assertions across shared and isolated modes so the record ownership is the difference being tested.
- Coordinate the workers with explicit fixture signals; do not add sleeps or retries to make failures disappear. Keep the fixture local and use synthetic data only.
- Do not commit secrets, browser traces, screenshots, reports, or local dependency directories. Document any new repro command and its expected outcome in the README.
