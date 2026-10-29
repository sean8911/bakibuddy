# Phase 5 development report

## 1. Phase completed

**Phase 5 — Touch ’n Go statement import**, authorized by “now continue phase 5” on 27 October 2026. Version **0.5.0** implements the supplied original PDF layout. Implementation, automated checks and design-document comparison are complete; the independent source/web finish review returned **ship** after its requested landscape evidence replacement. Native-phone acceptance remains manual. Phase 6 has not started.

## 2. Features implemented

- Import TNG on Home and a Settings entry open a local file workflow. Create/select the matching eWallet account and use an opening balance from before the imported history.
- Select an original text-based landscape TNG PDF, including encrypted statements. Enter its document-opening password locally when needed; it is never persisted.
- Parse wrapped references/type labels, continuation pages, dates, status, description and exact amounts. Keep wallet balance separate. Count and exclude the GO+ appendix and unsuccessful wallet rows.
- Preview ten rows per page, select/exclude records, edit name/amount/date/category/type, and filter all/selected/needs-classification rows. Suggested payments start in Other; nothing starts selected.
- Require manual classification of reloads, incoming money and wallet transfers. Transfers between your tracked accounts move both balances without new income/spending; refunds stay separate.
- Lock imported references, detect conflicting/repeated source references, and flag possible matches to manual records. Only a deliberate separate-payment acknowledgement can override a possible match; source-key duplicates stay locked.
- Show separate exact confirmation totals, then save all selected records and receipts atomically. No preview/cancellation writes; save failure preserves review. Successful import updates history, balances, budget and analytics.
- Handle missing/wrong passwords, invalid/oversized/unsupported files, unresolved selected rows and extraction timeout. Cancel active reading; backgrounding interrupts it and clears password input.

## 3. Files created or modified

Paths under `bakibuddy/` unless stated otherwise:

| Area | Important files |
|---|---|
| UI | `src/app/import-tng.tsx`, `src/components/ImportRowEditor.tsx`, Home/Settings/root routes, account editor, shared `FormFields.tsx` secure entry |
| Parsing/review | `src/importing/types.ts`, `pdf-text.ts`, `tng-parser.ts`, `review.ts`, `pick-pdf.ts` |
| Local reader | `PdfReader.tsx`, `PdfReader.web.tsx`, `pdf-bridge.ts`, generated `pdf-runtime.ts`, `scripts/pdf-entry.ts`, `pdf-worker.d.ts`, `build-pdf-runtime.mjs`, `third-party/PDFJS-LICENSE` |
| Storage | `src/storage/repository.ts`, `ledger.ts`, `src/types/finance.ts` |
| Tests | `tests/import.test.mjs`, two fictional PDF fixtures/provenance, `scripts/check-import-web.mjs`, retained migration fixture and tests README |
| Configuration | `package.json`, `app.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` |
| Root records | `IMPORT_RULES.md`, `PHASE_5_RESEARCH.md`, `AGENTS.md`, `PRODUCT.md`, `ROADMAP.md`, `PROGRESS.md`, `README.md`, `DESIGN_COLLABORATION.md`, Phase 5 surface brief; design comparison recorded after finish review |

The real PDF/JPEG, personal source rows and document password are not repository fixtures. The source statement has not been imported into your ordinary ledger.

## 4. Technical decisions

The original source contains 29 pages, **225 successful wallet rows** and **47 GO+ appendix rows**. All 225 date/amount/wallet-balance triples matched an independent extraction, and all 224 consecutive wallet balance changes agreed with type direction. The parser supports that verified layout rather than guessing unprovided CSV/statement variants. Unicode/whitespace normalization does not fabricate merchant information.

The initial implementation used Expo SDK 57 with SDK-compatible DocumentPicker 57.0.3, FileSystem 57.0.7 and WebView 13.16.1. The iPhone compatibility follow-up below upgrades that baseline to SDK 58 while preserving Expo Router, StyleSheet and the established Daily Planner design. PDF.js 6.4.299 runs entirely inside a local sandboxed iframe/native WebView with network disabled by CSP; it is not sent to a converter or AI service. The runtime is generated once with esbuild 0.28.2 and included in source. The packaged esbuild binary works without approving dependency postinstall scripts. `pnpm build:pdf` regenerates it after parser/runtime dependency changes.

Schema **3** adds two small import tables while preserving existing accounts, transactions, plans and settlements. Stable hashed wallet/source identities prevent repeat imports even after a transaction is edited. A source fingerprint blocks changed-data conflicts. Raw wallet IDs, PDF bytes, passwords and original source references are not persisted. This metadata is not ledger encryption; the app's broader security/backup work remains Phase 8.

Import uses the existing serial repository queue and a single SQLite transaction. It validates references, accounts, directions, all row inputs, potential duplicates, balance ranges and budget calculations before commit. Any error rolls back the entire batch and import metadata. The financial code uses integer sen/BigInt; AI performs no calculations and invents no records.

## 5. Test results

Executed on 27 October 2026, Windows, Node 24.22.1 / pnpm 11.25.0:

| Check | Executed result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed after explicitly keeping esbuild postinstall disabled. |
| `pnpm build:pdf` | Passed; local PDF runtime and license generated. |
| `pnpm typecheck` / `pnpm lint` | Passed. |
| `pnpm test` | **108 passed**: 27 import tests plus 81 retained checks. |
| Import parser/SQL | Fictional plain/AES PDFs, password errors, wrapped columns, GO+ exclusion, malformed/unsupported data, limits, classification, transfers/refunds, exact totals, edited source identity, weak/strong duplicates, source conflicts, schema preservation/rollback, SQL failure/retry, overflow, concurrency and deletion semantics. |
| Original sample, read-only | 225/225 independent date/amount/balance matches; 224/224 direction/balance transitions; 225 unique full references; 47 GO+ rows excluded. |
| `pnpm check:expo` / `pnpm peers check` | SDK-compatible, no peer issues. |
| Expo Doctor | **21/21 passed** using `pnpm --package=npm --package=expo-doctor dlx expo-doctor`. |
| `pnpm exec expo export --platform all` | Passed: Android/iOS Hermes bundles, 20 web routes and SQLite browser worker/WASM. Metro recovered from an older incompatible cache by recrawling. No APK/IPA build or native runtime claim. |
| `pnpm test:import:web` | **27 passed**, errors `[]`, external requests `[]`; actual file picker/sandboxed reader, password recovery, no-write cancellation, classification/editing/selection, duplicates, confirmation totals, persistence and reimport after process restart. |
| Existing production-browser regressions | **45 ledger, 52 budget, 33 analytics checks passed** against the Phase 5 export in separate profiles. |
| Rendered evidence | 47 current captures at 320/390/430/1440px plus 568×320 landscape, covering empty/error/editor/review/confirmation/success/duplicate states. Fonts and two animation frames settle before capture. Independent review requested one landscape error recapture, then returned **ship** after a full review of the corrected packet. No material fixes within sampled source/web-preview scope; parser/repository internals were not independently re-audited by the visual reviewer. |
| iPhone continuation preparation | User selected iPhone; Metro LAN server and session QR prepared. The existing browser import route returned HTTP 200 and opened in a fresh read-only Chrome smoke check without uncaught page errors. No ledger records created; prior full suites not rerun because app code did not change. |
| Physical Android/iOS | Not executed. iPhone acceptance awaits user-operated matching Expo CLI/Expo Go sign-in and actual phone observations. No device/emulator was available to the agent. |

Evidence is under ignored `bakibuddy/test-results/phase5/` and `.impeccable/review/phase5/`. Tests use fictional PDFs and owned temporary profiles, leaving your ordinary browser/native data alone. Early harness failures were corrected for existing empty-state/account labels and by waiting for manual saves to finish before navigating; no false pass was recorded. A browser-paint artifact was recaptured before independent review.

The independent documenter compared the finished UI against the existing system and updated only descriptive DESIGN.md prose. Its normative frontmatter, sidecar and source tokens remain byte-identical. Preexisting sidecar narrative/availability/evidence drift was reported and left unchanged. Review and documentation records name their exact source/web scope; neither certifies native runtime or independently re-audits parser/SQL logic.

## 6. How to run the app

```powershell
cd "C:\Users\USER\Documents\ChatGPT\Budget Calculator\bakibuddy"
pnpm install --frozen-lockfile
pnpm start
```

Scan the terminal QR using matching SDK 58 Expo Go: Android inside Expo Go, iPhone with Camera then Expo Go. Keep computer/phone on a reachable local network. If an existing PowerShell still cannot find pnpm, refresh its PATH using README.md's verified commands. iOS Simulator requires macOS/Xcode; Windows can use a configured Android emulator.

Current Expo Go on a physical iPhone requires the computer's Expo CLI and the phone's Expo Go to be signed in to the same Expo account. The continuation check found the computer not signed in. In a separate PowerShell window, from the app directory, run `pnpm exec expo login` yourself, then sign in to that same account in Expo Go. Leave Metro running and scan its current QR. If the account changes, restart Metro. This development-host sign-in is separate from BakiBuddy, whose basic local ledger requires no app login. See [Expo's official iPhone sign-in guidance](https://docs.expo.dev/troubleshooting/expo-go-sign-in-required/).

Local production web preview:

```powershell
pnpm exec expo export --platform all
pnpm preview
```

This serves localhost:8082 with SQLite's required headers. In a separate terminal, from the same folder:

```powershell
$env:BAKIBUDDY_URL='http://localhost:8082'
pnpm test:import:web
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
```

Browser and native records are separate. Nothing was deployed, published, pushed or submitted to a store.

## 7. Manual testing checklist

- On iPhone, sign in to the same Expo account in Expo CLI and Expo Go, scan the running server's QR with Camera and confirm BakiBuddy opens. First read/review the statement and cancel without saving; check that history is unchanged before a selected test import.
- Keep existing app data. Verify schema 2→3 preserves all accounts, transactions, plans and payment links after upgrading/restarting.
- Open Import TNG on both Android and iPhone; use Files/Downloads to choose the original PDF. Verify native picker cancellation, cloud-file download, file-size rejection and picker-cache cleanup without removing the original.
- Try no/wrong/correct document password. Confirm obscured entry, readable error, file retained for retry and password cleared afterward. Check keyboard dismissal and screen-reader labels.
- Cancel reading; background/reopen during reading; leave/back from preview. Confirm no records were saved and no password survives. Test a full 29-page export's responsiveness and memory on a modest phone.
- Check statement period/masked wallet, all 225 main rows and 47 excluded GO+ rows against the original. Review references, descriptions, amounts and dates, including wrapped values and continuation pages.
- Select only a few known payments first. Correct one name, amount, date and category; exclude an uncertain row. Check classification and required second account for transfers. Never call your own bank reload new income.
- Back out of confirmation, then confirm a small reviewed batch. Check both account balances, separate income/expenses/refunds, budget/insights and link any applicable planned occurrence to its actual record.
- Close/reopen and reselect an overlapping statement. Imported references must remain locked; possible manual duplicates need a separate-payment decision. A genuinely different second payment must remain possible.
- Test portrait/landscape, small/large text, safe areas, hardware/swipe/predictive back, touch targets, VoiceOver/TalkBack and offline reading of an already-local file. Native behavior is not certified by browser captures.

## 8. Known issues and limits

No known failing financial checks remain in executed tests. Physical-device acceptance is outstanding, especially the WebView/Files bridge and password/background behavior. Only the verified eight-column landscape text-PDF layout is supported. CSVs, other statement variants, scans, screenshots and OCR are unavailable. Imports are capped at 5 MB/100 pages/2,000 wallet candidates. GO+ appendix entries are deliberately excluded; main-wallet GO+ cash movements still need user classification.

Possible-duplicate matching cannot catch every manually renamed or date-shifted record; source references provide stronger repeat-file protection. Imported records do not automatically settle scheduled bills. The opening balance must precede selected history; the statement balance never replaces it. No backup/export, encryption guarantee, cloud sync, AI service or TNG account connection has been introduced.

Automatic approval review rejected cleanup of the private analysis folder, including a narrower attempt restricted to its 34 known files, with “blocked by policy.” Extracted text/images remain outside the repository at `C:/Users/USER/AppData/Local/Temp/bakibuddy-phase5-orvqe6yu` and need manual deletion. No password was stored there. The original PDF and JPEG remain in Downloads. This tool cleanup limitation is separate from the application's import and native cache handling.

## 9. Next phase

**Phase 6 — Receipt and screenshot OCR** would evaluate on-device extraction, uncertain merchant/date/amount fields, manual correction, duplicate review and confirmed save. The supplied Activity screenshot is reference material for that later work. Phase 6 is **not implemented or approved**.

## 10. iPhone SDK 58 compatibility follow-up — 27 October 2026

The supplied phone screenshot showed that installed Expo Go supports SDK 58 while the running project still used SDK 57. Upgraded the Phase 5 project to Expo 58.0.19, React Native 0.88.0, React 19.3.0 and matching native packages. DocumentPicker is now 58.0.4, FileSystem 58.0.11 and WebView 14.0.1. Updated the React Native tab-ref type and WebView generic without changing their runtime behavior. No SQLite migration, design-token change or financial-logic change was made.

SDK 58's default async web routing initially broke the existing offline navigation check. The supported `expo-router` option `asyncRoutes: { web: false }` restores eager route availability. The ledger and budget harnesses also now wait for navigation completion before following/capturing saved routes. All existing financial assertions remain. See [Expo's SDK 58 migration guidance](https://docs.expo.dev/router/migrate/sdk-57-to-58/) and [upgrade walkthrough](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/).

Executed from `bakibuddy/`:

| Check | SDK 58 result |
|---|---|
| `pnpm install --frozen-lockfile` | Passed with Node 24.22.1 / pnpm 11.25.0. |
| `pnpm typecheck` / `pnpm lint` | Passed. |
| `pnpm test` | 108 tests passed. |
| `pnpm check:expo` / `pnpm peers check` | Compatible dependencies; no peer issues. |
| `pnpm --package=npm --package=expo-doctor dlx expo-doctor` | 20/20 checks passed; the current Doctor has 20 checks. |
| `pnpm exec expo export --platform all` | Android/iOS Hermes bundles and web export passed on SDK 58. |
| `pnpm exec expo export --platform web` | Repeated after the web-only route setting: 20 static routes passed. |
| Four browser scripts with `BAKIBUDDY_URL=http://localhost:8082` | 45 ledger, 52 budget, 33 analytics and 27 import checks passed, with no browser errors. Offline create/edit checks are included. |
| iOS manifest from Metro | HTTP 200, SDK `58.0.0`, runtime `exposdk:58.0.0`; this establishes SDK compatibility metadata, not native runtime acceptance. |
| iOS development bundle from Metro | After recovering an unreadable file-map cache through Metro's automatic full crawl, 1,584 modules compiled and the bundle request returned HTTP 200 (9,243,098 bytes). The earlier startup attempts timed out; the successful request verifies delivery only. |

The manifest/source snapshot before upgrading is `C:/Users/USER/.codex/backups/bakibuddy-sdk57-before58-20261027-165242`. It excludes generated output, dependencies and private financial documents. SDK 58 browser evidence is under the existing ignored `test-results/phase2/` through `phase5/` folders; the earlier independent finish review remains historical SDK 57 evidence.

Metro's current local address is `exp://LAN_HOST:8081`, started with `pnpm exec expo start --go --lan --port 8081 --max-workers 2`. A temporary localhost-only profiling inspector used during startup diagnosis was stopped; the normal server runs without it. After the fix and QR retry instructions, the user replied “its good,” recorded as positive user-reported iPhone launch feedback. No specific PDF import result or full native checklist was reported. No agent-observed physical-device test, APK/IPA build, release or Phase 6 approval is claimed.

## 11. Approval status

Phase 5 is complete at its executed implementation/automated/source-web review scope and is awaiting your review. Its phone checklist and private-analysis cleanup remain manual. Phase 6 requires your separate explicit approval. No deployment, remote push, publishing or store submission is authorized.

PHASE 5 COMPLETE — WAITING FOR USER REVIEW.
