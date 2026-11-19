# Playwright Flake Lab

A runnable pilot for diagnosing **tests that pass alone but fail in parallel**. It uses a local, in-memory HTTP fixture and two real Playwright workers; no account, token, external service, or private data is required. This is a reproduction fixture, not a deployed GitHub App.

## Run locally

Requires Node.js 22 or newer. Install the pinned dependencies and Chromium:

```sh
npm ci
npx playwright install --only-shell chromium
```

| Command | Expected result | What it shows |
| --- | --- | --- |
| `npm run demo:solo` | 1 passed, 1 skipped | The reader passes without the cleanup worker. |
| `npm run demo:flake` | 1 failed, 1 passed; nonzero exit | Cleanup deletes the shared record; the reader reloads and gets HTTP 404 instead of 200. |
| `npm test` | 2 passed | The same two workers pass with isolated test data. |

The two workers signal when the reader has loaded its record and when cleanup has finished. That makes the failing order repeatable instead of relying on sleeps or luck. Both modes use the same tests: the shared fixture uses one fixed record ID, while the isolated fixture gives each test its own record key.

## Why this case matters

A whole-suite retry can hide a cross-worker race, and rerunning the failing test alone misses the cleanup entirely. The useful repro keeps the **pair of tests and their parallel execution**, not just the name of the failing test. A future GitHub App can use this fixture to validate that a PR comment explains the failure and links to a small, repeatable command before piloting the workflow on real CI failures.

The fixture listens only on localhost. Traces, screenshots, and videos are disabled by default, and no generated artifacts are needed to understand the failure.
