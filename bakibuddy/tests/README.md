# Testing BakiBuddy

Run checks from the application directory with a supported Node version. The automated suite currently contains **192 tests**.

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
```

## Automated coverage

| Area | Coverage |
| --- | --- |
| Money and dates | Integer-sen arithmetic, supported ranges, calendar boundaries, and timezone handling |
| Storage | Migrations, preservation, rollback, concurrent writes, balance reconciliation, and transaction semantics |
| Budgets | Income cycles, unpaid commitments, reserves, caps, conditional forecasts, and linked payments |
| Analytics | Date/account filters, buckets, category allocation, comparisons, and exact totals |
| PDF imports | Fictional ordinary/encrypted documents, extraction, validation, review, duplicates, and atomic saves |
| Image scanning | Receipt/Activity parsing, uncertain fields, points/QR exclusion, reviewed selection, and source locks |
| Privacy | Export allowlists and formulas, integrity checks, stale confirmations, deletion, and rollback |
| Assistant | Local facts, output contracts, consent, timeouts, server bounds, setup, and credential isolation |
| OCR lifecycle | Explicit loading, cleanup, readiness, and timeout paths; separate from real OCR integration |

SQL tests use Node SQLite against the actual repository. Fictional documents and images are described in [fixture provenance](fixtures/README.md).

## Browser integration

Export the web build, then start the isolation-header preview server:

```sh
pnpm exec expo export --platform web
pnpm preview
```

In a separate PowerShell terminal, set the target and run relevant suites:

```powershell
$env:BAKIBUDDY_URL = 'http://localhost:8082'
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
pnpm test:import:web
pnpm test:scan:web
pnpm test:assistant:web
pnpm test:privacy:web
```

The suites use separate temporary profiles, fictional records, and browser-controlled clocks where required. They exercise actual controls, persistence, offline already-loaded operations, imports/OCR, reviewed saves, and cancellation. They do not use an ordinary phone or browser ledger.

Chrome is the default. To use installed Playwright Chromium, set `BAKIBUDDY_BROWSER=chromium` after installing the corresponding browser. Generated profiles, results, and screenshots remain in ignored test-output folders.

Rebuild the local readers with `pnpm build:pdf` or `pnpm build:ocr` when their sources or bundled dependencies change. Committed generated readers allow ordinary startup without a separate build step.

## Physical-device checks

Browser screenshots are supplemental React Native Web evidence. Verify native SQLite restart, file/image pickers, share sheets, safe areas, Back gestures, keyboard/date entry, text scaling, VoiceOver/TalkBack, reduced motion, and memory/performance on actual devices.

Use only disposable ledgers for destructive testing. Distinguish source checks, bundle compilation, browser execution, and physical-device observations in test reports.

See [development](../../docs/DEVELOPMENT.md) and [security](../../docs/SECURITY.md) for platform setup and known limitations.
