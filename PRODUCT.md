# BakiBuddy

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Stack

User-selected React Native, Expo, TypeScript, Expo Router, and React Native StyleSheet. One shared Android and iOS codebase. The current baseline is Expo SDK 58, React Native 0.88 and React 19.3; Expo SQLite was introduced in Phase 2.

## Users

Malaysian university students, young adults, and working professionals who want to understand spending and how much is available until their next salary or allowance.

## Product Purpose

Know your balance. Own your future. Provide a clear financial overview, transaction history, budgets, verified analytics and local-first questions with optional consented AI help.

## Operating Context

Phone-first, MYR, Asia/Kuala_Lumpur. Basic functionality requires no login. Touch 'n Go imports use user-selected files and the verified text-based eWallet PDF layout; document passwords are used locally and never persisted.

## Capabilities and Constraints

Phases 2 through 8 are implemented: persistent local SQLite accounts and transactions, opening balances, CRUD, dates/categories, search/filtering, precise financial totals and validation. The real ledger starts empty, with no demo seed. Phase 3 adds deterministic local budget forecasts, income cycles, scheduled bills/income, savings reserves and spending limits. Phase 4 adds actual-record analytics: date ranges, daily/weekly/monthly charts, gross category spending, distinct income/expenses/refunds, descriptive comparisons and current-cycle budget utilization. Phase 5 adds local TNG PDF selection/unlocking, paginated editable preview, inclusion/exclusion, classification, duplicate review and explicit atomic confirmation. It supports the supplied eight-column landscape text layout, excludes GO+ appendix rows, and does not infer that reloads are income. Phase 6 adds bounded local receipt/screenshot OCR, source comparison, mandatory correction/review, duplicate protection and confirmed atomic saves. Phase 7 adds bounded local money questions, verified facts/assumptions and reviewed category-only changes. Optional cloud interpretation/insight selection/category suggestions use per-request data preview/consent and a separate local Node companion with server-side secrets. Model-generated figures or freeform financial claims are never displayed. The user reported one successful live Groq request on their iPhone; the full native checklist remains open. Phase 8 adds reviewed JSON/CSV reference export, guarded atomic local deletion, privacy information, database integrity checks and OCR/performance hardening. Exports are unencrypted, archive restore is unavailable and no app-managed encryption is claimed. Remote push and deployment remain outside scope. Income, expenses, refunds and tracked-account transfers remain distinct.

## Brand Commitments

BakiBuddy; friendly, trustworthy, premium, minimal. Deep navy, emerald/teal, warm off-white, soft gray, restrained warning colors. Avoid a generic dashboard.

## Evidence on Hand

The user’s detailed nine-phase brief, implemented Phase 1–6 source and local automated/browser evidence. The original 29-page encrypted TNG export was opened locally and its 225 wallet rows matched independent date/amount/balance extraction; 47 GO+ appendix rows were excluded. No real rows or document password are included in repository fixtures. The user reported the SDK 58 iPhone launch working. The supplied Activity screenshot was read locally by the Phase 6 OCR probe: five candidates, with one malformed/low-confidence amount requiring correction. No user research or full native OCR/import acceptance is claimed. Historical demo names and amounts are fictional; production storage starts empty.

## Product Principles

Scoped follow-up 0.8.1 adds an optional Settings-accessible animated welcome/login preview, authorized on 29 October 2026. It uses BakiBuddy's existing wallet mark and emerald/mint palette, finite Skip/Replay motion and working guest navigation. Email/password entry and sign-in remain unavailable; no authentication, cloud account/sync service, startup gate or data migration was added. The ordinary Home entry and local ledger remain available. Source/web checks are separate from the still-open native capture and accessibility gate; distribution remains unapproved.

- Deterministic money calculations using integer sen.
- Local data by default, no embedded secrets, explicit consent before external AI processing.
- Clear distinction between income, spending, refunds, and transfers.
- Never advance a phase without the user’s explicit approval.

## Accessibility & Inclusion

Readable text, labeled controls, generous targets, scalable text, safe-area support, common small and large Android/iPhone layouts. Phase 1 device verification must be reported honestly.

## Implementation Assumptions

English interface and light theme remain established defaults. The Phase 1 fictional October scenario is retained only as historical test fixtures; the real ledger uses the user’s entered records and current Kuala Lumpur dates. Phase 8 is explicitly approved. Receipt/payment image scanning remains local printed-Latin/MYR recognition with mandatory correction/review, source-hash and possible-duplicate checks, and atomic confirmation in schema 4. The user selected Groq for optional cloud assistance on 28 October 2026. Version 0.7.1 uses Groq-hosted openai/gpt-oss-20b, strict output and server-only keys; local configuration/live verification is separate. Phase 8 was authorized by “now continue phase 8” on 28 October 2026. Version 0.8.0 preserves SDK 58 and schema 4. Phase 9 remains unapproved.
