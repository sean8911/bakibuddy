# BakiBuddy checks

Current version 0.8.0: **192 automated tests pass**. Run `pnpm test:privacy:web` for fourteen real browser data-control checks, `node scripts/check-ledger-performance.mjs` for the fictional 10,000-record host benchmark, and the retained browser scripts using `BAKIBUDDY_URL=http://localhost:8082`.

`privacy.test.mjs` adds eleven export/integrity/actual-SQL deletion checks, including all-table rollback, content-stale/concurrent consent, formula-safe CSV and exact sen. `ocr-runtime.test.mjs` adds six explicit lifecycle mock tests; these do not replace actual OCR. The post-fix real OCR suite passes 21 checks and the saved startup probe passes twenty mixed reads, including offline use. Earlier failing diagnostic evidence is retained separately. Full results and native/tooling limits are in PHASE_8_REPORT.md.

## Historical checks

Run `pnpm test` from `bakibuddy/` using a supported Node line (tested 24.22.1). The suite has 131 passing tests: 23 Phase 6 scan checks plus 108 retained PDF-import/analytics/budget/ledger/utility/fixture checks. Actual SQL runs through the repository against Node SQLite, including upgrade rollback, payment reconciliation, concurrent submissions and exact financial formulas. Expo SQLite’s web implementation is exercised separately through browser integration; native-phone acceptance beyond the user's reported iPhone candidate extraction remains manual.

## Browser integration

1. `pnpm exec expo export --platform all`
2. In a separate terminal: `pnpm preview` (localhost:8082, with COOP/COEP and WASM support).
3. `$env:BAKIBUDDY_URL='http://localhost:8082'` then `pnpm test:web`, `pnpm test:budget:web`, `pnpm test:analytics:web`, `pnpm test:import:web` and `pnpm test:scan:web`.

Alternatively test the development server from `pnpm web` on 8081. The final recorded matrix uses a production export. The script defaults to installed Chrome; set `BAKIBUDDY_BROWSER=chromium` after `pnpm exec playwright install chromium` if Chrome is unavailable.

The test creates an isolated temporary browser profile under ignored `test-results/phase2/`, inserts test accounts/records, closes/reopens the browser to verify persistence, exercises an already-loaded offline write, and checks CRUD, duplicates, invalid inputs, filters and route layouts at 320/390/430/1440px plus landscape. Screenshots include middle/bottom scroll positions at 390px. Test profile cleanup verifies the owned path before recursive removal. Your normal browser/native ledger is untouched.

Browser screenshots are supplemental React Native Web evidence, not Android/iOS captures. Physical devices are still required for native SQLite restart, gestures, keyboard/date selection, safe areas, Dynamic Type and VoiceOver/TalkBack verification.

## Phase 5 import checks

`tests/import.test.mjs` reads fictional two-page ordinary/AES-encrypted PDFs through PDF.js and the exact operator-run extractor. It checks wrapped references/types, continuation pages, password errors, date/amount/balance columns, table requirements/limits, statuses, unresolved classification, transfer direction, separate refunds, editing/source identity, manual/source duplicates, schema 2→3 preservation/rollback, SQL failure rollback/retry, overflow, concurrent submissions and receipt deletion semantics. The v1 simulation in the retained budget test now removes schema 3 tables before simulating an actual old database. See `fixtures/README.md` for provenance and the fictional password.

`pnpm test:import:web` uses fictional fixtures and an isolated Chrome profile with a fixed 27 October 2026 scenario. It exercises the actual file selector, local sandboxed PDF runtime, password recovery, no-write cancellation, editable/classified selections, duplicate acknowledgement, exact confirmation, atomic save, both account balances and process-restart deduplication. It rejects invalid/oversized files and checks for page/console errors and external network requests. The 27 checks passed, with 47 current captures at 320/390/430/1440px plus 568×320 landscape. Captures wait for fonts and two animation frames after scrolling. Source-native WebView/picker/backgrounding and physical accessibility remain manual.

Rebuild the bundled local browser/WebView runtime with `pnpm build:pdf` after changing `scripts/pdf-entry.ts`, `src/importing/pdf-text.ts`, shared extraction limits or PDF.js. The generated string is committed so ordinary installs/start do not need a build step. esbuild's packaged platform binary was verified without enabling dependency postinstall scripts; `pnpm-workspace.yaml` retains `esbuild: false` and `unrs-resolver: false`.

## Phase 3 evidence

`pnpm test:budget:web` uses an isolated Chrome profile and a fixed 26 October 2026 Kuala Lumpur scenario. It checks setup/validation, bills, expected income, caps, actual payment links/unlink/edit/delete, plan removal, process restart and an already-loaded offline edit. All 52 checks passed. Eight affected routes at 320/390/430/1440px plus middle/bottom and landscape/state captures produced 53 PNGs under ignored `test-results/phase3/`. The ledger regression suite separately passed all 45 browser checks. These remain React Native Web previews, not native phone verification.

## Phase 4 analytics checks

The analytics test suite covers inclusive date ranges, presets, Monday/calendar buckets, exact category-share allocation, independent transaction kinds, account filters, equal-length comparisons, missing baselines, whole-sen averages, large-value ranges and all budget-cap states. Actual SQL verifies edits/deletes immediately affect analytics and analysis creates no writes.

`pnpm test:analytics:web` creates an isolated profile with a fixed 27 October 2026 KL scenario, records its own transactions through the app, and checks filters, dates, chart groups/exact values, edits/deletion, persistence and cap states. It captures small/large web previews and checks horizontal bounds; actual final counts and native limitations are recorded in PHASE_4_REPORT.md. Your ordinary browser/native ledger is not modified.
# Phase 6 scan coverage

`scan.test.mjs` adds 23 parser/review/actual-SQL tests to the retained 108. It covers receipt totals vs items/cash/change/foreign currency, Activity rows/year inference, points/QR exclusion, malformed digits, geometry/limits, explicit review, transfer ownership, source identity, broad duplicates, v3→4 preservation/rollback, concurrent submissions and atomic failure/retry/overflow.

`pnpm test:scan:web` runs the real bundled OCR on fictional PNGs in an isolated Chrome profile. It checks source comparison, correction/attestation, exact mixed totals/balances, repeats/overlap, persistence, offline already-loaded processing, blank recovery, cancellation, disabled zero-selection continuation and account-direction wording. Current evidence contains 21 checks and 102 top/middle/bottom captures at 320/375/390/430/1440 and landscape. It asserts no external HTTP(S) requests and no browser errors. It cannot establish native WebView/WASM, permissions, memory, gestures, font scaling or screen-reader behavior.

## Phase 7 assistant coverage

Current Groq follow-up (0.7.1): **175 total automated tests**:131 retained financial/import/OCR +26 assistant +15 provider/server +3 actual setup creation/migration/idempotency checks. The browser suite has **34 passing checks** with synthetic Groq-format responses,144 viewport captures and no recorded page errors/external requests. It additionally verifies provider disclosure, Groq-key rejection in the separate token field and quota recovery. Old provider consent is rejected by server tests before any upstream access. `scripts/check-assistant-secrets.mjs` checks current and legacy configured credentials without printing them. Evidence is under `test-results/phase7-groq/`; no live provider/native acceptance is claimed.

The following counts describe the original 0.7.0 build:

`assistant.test.mjs` adds 26 pure/client/actual-SQL tests and `assistant-server.test.mjs` adds 11 HTTP/provider boundary tests to 131 retained checks (168 total). Financial values come from exact local engines; categories use atomic revision checks and category-only SQL writes. Tests cover wrong/extra fields, invented outputs, unsafe amounts, unsupported advice, current-balance scope, consent/authentication, private/HTTPS origins, errors/refusals/timeouts/abort/cache/attempt limits and metadata preservation.

`pnpm test:assistant:web` runs the real exported app with a separate fictional ledger and an explicitly synthetic upstream provider behind the actual local HTTP server. It never calls OpenAI. 31 checks cover local examples/offline, consent/cancel/payload boundaries, invalid output/error/timeout fallback, pending/in-flight category requests entering confirmation, truthful sent-state cancellation, repeated-merchant payment identities, category persistence and unchanged balances. 141 supplemental top/middle/bottom PNGs cover 320/375/390/430/1440 widths and 568×320 landscape. The synthetic provider is test-only and never replaces the production default. Live model/native networking, keyboard, accessibility and device screenshots remain unverified. `node scripts/check-assistant-secrets.mjs` compares configured local credentials with all export files without printing secret values.

