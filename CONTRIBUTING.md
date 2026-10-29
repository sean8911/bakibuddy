# Contributing to BakiBuddy

Start with an issue describing the problem, expected behavior and a small fictional reproduction. Discuss larger changes first; authentication, sync, distribution and financial-rule changes need deliberate scope decisions.

Follow [the README](README.md#quick-start) and [development guide](docs/DEVELOPMENT.md). Run app commands from `bakibuddy/`:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
```

For UI changes, inspect relevant browser/native states and state exactly which devices were tested. Bundle generation does not establish device-runtime acceptance.

## Preserve these boundaries

- Use integer sen. Keep income, expenses, refunds and tracked-account transfers distinct.
- Keep arithmetic outside UI and model responses. Preserve constrained AI contracts and per-operation consent.
- Preserve migrations, source locks, content-revision checks and atomic writes. Never reset a ledger to recover from an error.
- Review imported/OCR rows. Do not silently repair uncertain amounts or invent dates.
- Keep provider keys on the companion server, outside Expo/public variables.
- Reuse the existing stack, components and tokens; preserve labels, text scaling and 48-unit targets.
- Use a separate temporary profile/origin or disposable ledger for tests, especially destructive operations.

## Pull requests

Explain behavior, purpose, relevant checks and remaining limits. Include screenshots with clearly fictional data for meaningful UI changes. Describe any domain-rule or schema change, and keep unrelated upgrades out of the patch.

Never include environment files, keys/tokens, original statements/images, local databases, exports, signing material or browser profiles in commits or issues. Fixtures must be fictional. A project-wide license is not yet selected; do not silently add or replace licensing terms.
