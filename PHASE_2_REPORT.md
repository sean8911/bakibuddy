# BakiBuddy Phase 2 development report

## 1. Phase completed

Phase 2 implements the local database and transaction tracker. The user authorized it with “continue phase 2”. Phase 3 remains unapproved. Physical Android/iPhone testing remains part of user acceptance.

## 2. Features implemented

- Persistent Expo SQLite storage, versioned schema and atomic migrations.
- Empty first-use ledger; no sample transactions are inserted or mixed into real balances.
- Bank, eWallet, cash and other accounts with opening balances; account editing and confirmed deletion of empty accounts.
- Income, expense, refund and transfer create/edit/delete, with title, description, amount, date, category and account selection.
- Two-account transfers that affect both balances without increasing income or spending. Refunds remain separate.
- Search plus combined type/account/category filtering; empty history and no-results recovery.
- Exact money parsing and range checks, required-field/date/account validation, duplicate-ID protection, matching-record review and explicit separate-payment confirmation.
- Real Home/history data, account management in Settings, and honest later-phase Budget/Insights states.
- Shared accessible form controls, native/web date selection, keyboard avoidance, error/retry feedback and consistent styling.

## 3. Important file changes

| Files | Purpose |
|---|---|
| `bakibuddy/src/storage/repository.ts` | Schema/migrations, parameterized SQL, serialized atomic mutations and safe account deletion |
| `bakibuddy/src/storage/ledger.ts` | Exact balances, income/expense/refund summaries and history filtering |
| `bakibuddy/src/storage/openDatabase.ts` | Expo SQLite connection/adapter |
| `bakibuddy/src/state/FinanceProvider.tsx` | Shared snapshots, loading/errors and guarded writes |
| `bakibuddy/src/app/account/[id].tsx`, `accounts.tsx` | Account setup and management |
| `bakibuddy/src/app/transaction/[id].tsx` | Add/edit/delete record flow |
| `bakibuddy/src/app/(tabs)/` | Five screens connected to current Phase 2 behavior |
| `bakibuddy/src/components/` | Reused cards/rows plus form fields, date fields, delete confirmation and local-data disclosure |
| `bakibuddy/src/utils/validation.ts`, `dates.ts`, `types/finance.ts` | Money/date validation and typed ledger data |
| `bakibuddy/tests/repository.test.mjs` | Actual SQLite, financial and persistence tests |
| `bakibuddy/scripts/check-web.mjs` | Isolated browser integration and layout verification |
| `bakibuddy/metro.config.cjs`, `scripts/serve-web.mjs` | WASM and isolation headers for local SQLite web preview |
| Project docs | Updated authorization, architecture, status, design workflow and review instructions |

Historical Phase 1 fixtures remain only for old tests. Production screens/storage do not import them.

## 4. Technical decisions

Kept the existing Expo SDK 57/React Native/TypeScript/Expo Router codebase and design identity. Installed SDK-compatible SQLite 57.0.4, Crypto 57.0.4 and community date picker 9.1.0. Native storage uses the app's private SQLite location; browser preview uses Expo SQLite's WASM implementation with its required server headers. No backend, login or AI service was introduced.

Account balances are derived from opening balances and current records, rather than a mutable stored balance column. Money is integer sen, with BigInt accumulation and safe-integer checks before committing. Transfers and refunds have explicit semantics. Every write and migration rolls back on failure. The schema protects account references and refuses unknown newer versions without resetting data.

React Context manages the shared snapshot and mutation state. Search/filtering is deterministic local code. Dates are calendar days in Asia/Kuala_Lumpur, and future records are rejected until planned-money features are approved. Budget forecasts and analytics were not implemented.

## 5. Executed test results

| Check | Result |
|---|---|
| Strict TypeScript | Passed |
| ESLint / TypeScript / React Hooks | Passed |
| Unit/storage tests | 35 passed: 19 Phase 2 tests plus 16 retained tests |
| Storage evidence | Actual SQLite file close/reopen, interrupted migration rollback/retry, concurrent writes, transfer edits/deletion, duplicate protection and unsafe-total rollback passed |
| Expo dependency and pnpm peer checks | Passed; no compatibility/peer issues |
| Expo Doctor | 21/21 passed |
| Android/iOS Hermes and web/WASM worker exports | Passed locally; no upload, APK/IPA or signed build |
| Browser integration | 45 passed, no uncaught page/console errors |
| Responsive evidence | Eight routes at 320/390/430/1440px without horizontal overflow; middle/bottom views and landscape captured |
| Independent finish review | Ship at source/web-preview scope; all 50 supplied captures inspected, no material fixes identified |
| Design documentation validation | Source tokens/references verified; 20 component renders at 320/600px passed |
| Native device/emulator runtime | Not executed: no connected Android/iPhone or native simulator available |

The browser test used an isolated temporary profile and verified a complete browser-process close/reopen, as well as a one-sen expense while the loaded app was offline. These do not certify native restart behavior or a PWA offline launch. Evidence is under ignored `bakibuddy/test-results/phase2/`; review details are in PROGRESS.md. The documentation agent was interrupted by a usage limit; its saved updates were validated in the parent chat. A retried independent finish review completed successfully.

## 6. How to run

With Node LTS 22.18+ and pnpm 11.25.0:

```powershell
cd "C:\Users\USER\Documents\ChatGPT\Budget Calculator\bakibuddy"
pnpm install --frozen-lockfile
pnpm start
```

Open Expo Go matching SDK 57. Scan the QR with Expo Go on Android or Camera on iPhone, on the same reachable network. `pnpm android` supports a configured Android emulator; `pnpm ios` requires macOS/Xcode for the simulator.

For a local production browser preview:

```powershell
pnpm exec expo export --platform all
pnpm preview
```

The preview serves localhost:8082 with SQLite's required headers. Set `$env:PORT='8083'` first if needed. Browser data is specific to its profile/address/port and is separate from native app data. README.md includes the bundled pnpm fallback for this workspace, development web commands and network troubleshooting.

## 7. Manual phone testing checklist

1. Add bank opening RM1,000.00 and eWallet opening RM0.00. Opening balances must precede the transactions you add.
2. Record bank income RM500.00, expense RM12.50 and refund RM2.50. Transfer RM50.00 from bank to eWallet. Expect bank RM1,440.00, eWallet RM50.00, combined RM1,490.00; income RM500.00, expenses RM12.50, refunds RM2.50.
3. Edit the expense to RM15.00. Combined balance becomes RM1,487.50. Delete the transfer: combined balance stays RM1,487.50 while eWallet returns to zero.
4. Try invalid/blank amounts and titles, different categories/dates, descriptions, duplicate review, deletion cancellation and account-deletion restrictions.
5. Search and combine filters; clear them and verify no-results recovery.
6. Force-close and reopen on Android and iPhone. Check the records and balances persist, then test without networking once the development app bundle is available.
7. Review native keyboard/date picker, small/large phones, landscape, larger text, VoiceOver/TalkBack, system Back/gestures and notch/home-indicator clearance.

These values are an optional test scenario, not an automatic seed. Use disposable test records if appropriate.

## 8. Known issues and limits

No material issue was identified in the executed source/web review. Native device-specific behavior remains unverified. The app is light-only and local-only. There is no cloud sync, export or backup workflow yet; uninstalling or clearing storage can remove records. Encryption review/export/deletion belong to Phase 8, and no encryption guarantee is made. Web SQLite requires the documented headers and a supported browser.

## 9. Next phase

Phase 3 will introduce income cycles, recurring bills/expenses, savings reserves, available spending money, daily allowance, forecasts, shortfalls and deterministic engine tests. No Phase 3 functionality has been implemented.

## 10. Approval status

Waiting for Phase 2 review. Bugs will be fixed within this phase. To authorize the next phase, say **Approve Phase 2. Begin Phase 3.** Nothing has been deployed, published, remotely pushed or submitted to an app store.

PHASE 2 COMPLETE — WAITING FOR USER REVIEW.
