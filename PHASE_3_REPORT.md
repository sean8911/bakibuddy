# Phase 3 development report

## 1. Phase completed

**Phase 3 — Smart budget engine.** Authorized by the user's “continue phase 3” on 26 October 2026. Implementation and automated verification are complete. Independent review inspected source and 53 supplied web captures, found one stale documentation issue, and scored that fix resolved. User review and real Android/iPhone acceptance remain pending. App version: **0.3.0**. Phase 4 has not started.

## 2. Features implemented

- Weekly and monthly income cycles, custom dates and irregular-income review dates. Repeating cycles roll automatically; custom/irregular cycles expire and require an updated date. Monthly dates clamp in short months without drifting from the original payday.
- Local savings reserves and an optional total cycle spending cap. A blank cap means unlimited by cap; zero allows no extra spending.
- One-time, weekly and monthly bills/expenses and expected income, with amount, account, category and first due date. Plans never create actual transactions or a bank payment.
- Exact available funds and daily allowances, with visible deductions, rounding remainder, zero-funds and shortfall states. Home and Budget share the same calculation.
- Conditional end-of-cycle forecasts, overdue-income exclusion, chronological payment shortfalls and payment-account funding warnings.
- Explicit payment reconciliation: record a real transaction and its link atomically, or link an existing matching transaction. Unlink with confirmation, protect linked financial fields, and restore pending occurrences after a transaction is deleted.
- Pending versus linked occurrence lists, schedule editing/confirmed deletion, budget editing/confirmed removal, and clear empty/error states.
- Additive SQLite version 2 upgrade, retaining version 1 accounts and transactions. Budgets, schedules and links persist locally without new dependencies, login, cloud processing or fixture seeding.

## 3. Files created or modified

| Area | Important files |
|---|---|
| Financial model | `bakibuddy/src/types/budget.ts`, `types/finance.ts` |
| Deterministic engine | `src/budget/calendar.ts`, `validation.ts`, `engine.ts`, `useBudget.ts` |
| Storage and state | `src/storage/repository.ts`, `ledger.ts`, `src/state/FinanceProvider.tsx` |
| Budget UI | `src/app/(tabs)/budget.tsx`, `src/components/BudgetSummary.tsx`, `src/app/budget-plan.tsx` |
| Schedule/payment UI | `src/app/planned-items.tsx`, `planned/[id].tsx`, `planned-payment.tsx` |
| Existing UI integration | Home, Settings, transaction editor, root Stack and native/web DateField |
| Automated tests | `tests/budget.test.mjs`, `budget-repository.test.mjs`, expanded `repository.test.mjs`, `scripts/check-budget-web.mjs` |
| Configuration/docs | `package.json`, `app.json`, `AGENTS.md`, `PRODUCT.md`, `ROADMAP.md`, `PROGRESS.md`, `README.md`, `BUDGET_RULES.md`, `DESIGN_COLLABORATION.md`, `.impeccable/surfaces/phase-3.md`, `tests/README.md` |

Paths beginning `src/` or `tests/` in this table are under `bakibuddy/`. Existing source tokens are unchanged. No production financial screen imports historical demo fixtures.

## 4. Technical decisions

The existing React Native + Expo SDK 57 + TypeScript + Expo Router stack, reusable StyleSheet components, Context and private SQLite database are retained. No new runtime dependency was needed. The money engine is pure TypeScript, separate from screens and database access, and can be exercised against fixed dates.

All calculations use **integer sen**, with BigInt accumulation and safe-range checks. An allowance uses recorded funds after unpaid bills and savings, constrained by the optional cap after gross recorded expenses and pending bills. Expected income contributes only to a separate conditional forecast until received. Transfers count as neither income nor spending; refunds restore funds but do not reset gross expenses for the cap.

Cycles include today and exclude the end date; bills/income on payday belong to the next cycle. Unpaid overdue bills remain reserved. Expected income overdue before today is disclosed and excluded from forecasts. Bills precede expected income on the same date when checking possible timing shortfalls. Allowances are combined-account estimates; separate account warnings identify possible funding transfers.

One actual transaction can settle one occurrence, with matching type, full amount and account. This explicit link prevents counting a bill both as a completed expense and a pending obligation. New transactions and links commit or roll back together. Removing a schedule preserves actual transactions; deleting an actual transaction restores its pending occurrence. Linked financial edits require unlinking first. Version 2 adds three tables without resetting old data. The serialized write queue and foreign keys remain in use.

Date labels for planned occurrences include years. Kuala Lumpur calendar dates refresh on foregrounding and within 30 seconds of a day change while the app is active. Formula details and a reconciled worked example are in **BUDGET_RULES.md**.

## 5. Test results

Executed on Windows, 26 October 2026, Node 24.22.1 / pnpm 11.25.0:

| Check | Result |
|---|---|
| `pnpm typecheck` | Passed, strict TypeScript. |
| `pnpm lint` | Passed. |
| `pnpm test` | **62 passed**: 27 new budget/calendar/SQL tests and 35 retained ledger/utility/fixture tests, including expanded on-disk persistence. |
| Actual SQL coverage | Version 1→2 upgrade, simulated upgrade rollback/retry, plan/schedule CRUD, real on-disk close/reopen of plan/items/links, all settlement mutations, duplicate/mismatched links, protected edits, concurrent settlement submissions, account references and forecast-overflow rollback/queue recovery. |
| Formula coverage | Whole-sen division/remainder, zero/negative funds, insufficient balance, cap boundaries, transfers/refunds, recorded versus expected income, overdue/current/end-date bills, expiry, weekly rollover, month-end/leap-year anchors and chronological/account shortfalls. |
| `pnpm check:expo` / `pnpm peers check` | Dependencies match SDK 57; no peer issues. |
| Expo Doctor | **21/21 passed**, invoked with `pnpm --package=npm --package=expo-doctor dlx expo-doctor` on this host. |
| `pnpm exec expo export --platform all` | Android/iOS Hermes and web bundles exported successfully; 19 static web routes. This is not an APK/IPA or a native runtime pass. |
| `pnpm test:budget:web` | **52 passed**, no uncaught page/console errors. Fixed-date scenario in an isolated Chrome profile against the production web export. |
| `pnpm test:web` | **45 ledger regression checks passed** against the same production export, no uncaught page/console errors. |
| Browser persistence/offline | Entire browser-process close/reopen retained the plan, schedules and links; an already-loaded app edited a linked record offline. No fresh offline PWA launch is claimed. |
| Responsive evidence | Eight affected routes at 320/390/430/1440px, middle/bottom scroll captures at 390px, 568×320 landscape form, plus empty/healthy/shortfall/validation states. **53 Phase 3 captures**. |
| Native phone/emulator | Not run: no connected Android/iPhone, Android emulator or macOS iOS simulator available. |

The initial browser run exposed ambiguous same-day/month labels across recurring years; planned labels now include the year. Two early SQL assertions compared SQLite row prototypes rather than values; the storage snapshot now consistently returns ordinary data objects. One browser assertion was corrected to check React Native Web read-only fields using editability rather than the HTML disabled attribute. The complete final suites above passed after those corrections.

The independent review found no material source/render defect at its inspected scope. Its sole finding was stale Phase 2 prose in DESIGN.md. After the documenter updated that prose, the reviewer scored the finding **resolved**, returning **ship for the documentation fix only**; the UI and tests were not rerun in that narrow verdict pass. The documenter confirmed 21 palette colors, 7 spacing values, 4 radii, 6 typography roles and 15 normative component definitions against source, with the frontmatter hash unchanged. Full evidence and scope are recorded in PROGRESS.md. Browser evidence is supplemental to native-phone checks.

## 6. How to run the app

```powershell
cd "C:\Users\USER\Documents\ChatGPT\Budget Calculator\bakibuddy"
pnpm install --frozen-lockfile
pnpm start
```

Open the QR in matching Expo Go: scan inside Expo Go on Android; use Camera then Expo Go on iPhone. Computer and phone need reachable Wi-Fi. Requirements and the bundled-pnpm fallback are in README.md. Android emulator: `pnpm android`. iOS Simulator: `pnpm ios` on macOS with Xcode; it is unavailable on Windows.

Optional production web preview:

```powershell
pnpm exec expo export --platform all
pnpm preview
```

Default port is 8082. If occupied, set `$env:PORT='8083'` before `pnpm preview`. The preview needs its supplied isolation headers/WASM support. Browser storage belongs to that exact profile and origin/port, separate from native app data.

## 7. Manual phone testing checklist

- Keep your existing app data. Confirm the version 2 upgrade retains accounts, balances and transactions.
- In Budget, set a weekly cycle ending seven days after today, reserve RM100, no cap. With recorded RM1,000 and a RM200 bill before the end, available spending should be RM700 and daily allowance RM100.
- Add RM500 expected income before the end: allowance stays RM100/day; forecast before extra spending becomes RM1,300. Do not record it as received until it arrives.
- Add a total cycle cap of RM500: allowance becomes RM42.85/day with five sen left unallocated. Record/link the RM200 bill: balance becomes RM800 and the same allowance remains.
- Link an existing matching expense instead of creating another. Cancel and confirm unlinking. Confirm a linked amount/type/account change is blocked. Delete the transaction: its bill becomes pending again.
- Try monthly payday/bill anchors on the 29th/30th/31st, a custom date and an irregular-income review date. Check the current cycle and future occurrence labels, including years.
- Try zero/negative balances, reserve greater than funds, a zero spending cap, invalid dates/amounts, overdue income/bills and a bill due before expected income. Check clear warnings and preserved input.
- Rename a schedule, verify linked financial fields are protected, cancel/confirm deletion and confirm actual ledger records remain. Remove a plan and confirm schedules/accounts survive.
- Force-close/reopen and test without a network connection. Expo Go needs its development JavaScript bundle available; SQLite itself is local.
- Check native date picking, numeric keyboard, safe areas, small/large phones, landscape, larger text, VoiceOver/TalkBack, Android Back and iPhone back gestures. Browser checks do not certify these.

Manual amounts are optional test inputs and have never been seeded into a user's ledger.

## 8. Known issues and limits

Native runtime and physical accessibility verification remain pending. The app remains light appearance only. Forecasts depend on all relevant accounts/obligations being recorded and on expected payments actually occurring; no bank connection or deposit guarantee exists.

Full-amount, one-occurrence-to-one-transaction matching is supported; partial payments, splitting one transaction between bills and recurring-series end dates are not. For variable bills, update the full amount before linking, or unlink affected records before changing a settled series. Up to 100 scheduled items are supported; the occurrence list shows overdue items and roughly the next year, with incremental display. Changing/removing a linked schedule explicitly affects its planning history while preserving actual transactions.

No cloud sync, export/backup workflow, encryption guarantee, notifications, analytics, import, OCR, AI or release build was added. Uninstalling/clearing app or browser data can remove records. The existing Impeccable sidecar was flagged as older than DESIGN.md; a separate `document` refresh can reconcile that pre-existing metadata drift without changing the design. An inherited prose description of the unused ProgressIndicator color also differs from its source and was reported for that separate refresh.

## 9. Next phase

**Phase 4 — Financial analytics:** daily/weekly/monthly spending charts, category breakdowns, income versus expenses, date ranges, budget utilization, trends and useful insufficient-data states. A maintained Expo-compatible chart library will be evaluated only when that phase is approved. It has not been implemented.

## 10. Approval status

Waiting for your Phase 3 review and explicit approval before Phase 4. Bug reports will be handled within Phase 3. Nothing has been deployed, published, remotely pushed or submitted to a store.

PHASE 3 COMPLETE — WAITING FOR USER REVIEW.
