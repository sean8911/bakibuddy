# BakiBuddy engineering instructions

## Read first

At the start of every later phase, read this file, ROADMAP.md, PROGRESS.md, and README.md before editing code. The Expo app lives in `bakibuddy/`.

## Goal and stack

Build an understandable, professional personal finance app for Malaysian students and young adults. One React Native + Expo + TypeScript + Expo Router codebase supports Android and iOS. Use StyleSheet, reusable tokens, and Expo-compatible icons. Keep dependencies small. Check Expo compatibility before installation. No backend or state library unless a later approved phase requires it.

The current baseline is Expo SDK 58 / React Native 0.88 / React 19.3, upgraded to match Expo Go on the user's physical iPhone. Keep web routes eager (`asyncRoutes.web: false`) to preserve the verified already-loaded offline workflow.

## Phase approval policy

Phase 8 is authorized by the user's explicit “now continue phase 8” on 28 October 2026. Implement the roadmap's security and QA scope: local-data/encryption review, safe export/deletion, error/database recovery, accessibility/offline/performance checks, malformed-input/dependency review and a privacy-policy draft. Preserve the existing ledger and per-operation cloud consent. Notifications remain unscoped. Phase 7 is implemented and the user reported one successful live Groq request on their iPhone; earlier native finish review remains recapture and the broader native checklist is open. Never automatically advance phases. Bug fixes, passing tests, and UI feedback do not approve another phase. Wait for explicit human approval before Phase 9. Finish incomplete approved work first. End phase reports with `PHASE X COMPLETE — WAITING FOR USER REVIEW.` Never deploy, publish, push to a remote, or submit a store build without permission.

## Code conventions

For authorized UI/UX work, follow DESIGN_COLLABORATION.md and the user-scope `$design-trio` coordinator. Design with Intent frames the experience; UI/UX Pro Max advises on the detected React Native stack and system; Impeccable owns visual implementation and finish review. Preserve the existing PRODUCT.md, DESIGN.md and source tokens. Installing skills never approves a later phase or a redesign.

- Strict TypeScript; avoid `any` and unnecessary abstractions.
- Routes belong in `bakibuddy/src/app/`; reusable UI in components; tokens in theme; fixtures in data; types and pure utilities in their own folders.
- Keep UI separate from financial logic. Use meaningful names and explain only non-obvious logic.
- Preserve safe areas, native navigation/back behavior, readable scalable text, and accessible control labels. Use touch targets of at least 48 logical pixels.
- Demo data must be obvious on every financial screen. Future actions must be explicitly disabled or identified as unavailable.

## Money and privacy

- Use integer sen, never floating-point currency arithmetic. MYR and Asia/Kuala_Lumpur are defaults.
- Distinguish expenses, income, refunds, and transfers. Transfers between tracked accounts never count as income or spending.
- Financial arithmetic belongs in deterministic, tested code. AI may interpret questions or select verified insight/category identifiers; never render model-invented figures or records. Review every category change before a category-only atomic write. API keys belong only in the companion server's ignored environment file; cloud requests require explicit operation-specific consent.
- Local storage by default; no login for basic use; never embed secrets. Never transmit user financial data to external AI without explicit consent.
- Validate imports and amounts, review OCR results, detect duplicates before saving. Do not assume a public TNG API or request credentials.
- Phase 2 uses real, initially empty Expo SQLite storage with migrations, accounts/opening balances, transaction CRUD, search/filtering and validation. Never seed demo fixtures into the real ledger or mix them into financial totals. Phase 3 adds deterministic budget forecasts, income cycles, bills, savings reserves and spending limits. Phase 4 adds read-only financial analytics and charts derived from stored records. Phase 5 adds the verified text-based TNG PDF layout, local password handling, reviewed import and atomic source-reference deduplication in schema 3. See IMPORT_RULES.md before changing it. Never store the supplied PDF/password or copy real source rows into fixtures. Phase 6 adds bounded local image OCR, mandatory reviewed selection, atomic saves and source locks in schema 4; see SCANNING_RULES.md. Never silently repair OCR digits, invent dates, count points/balances, or treat a QR code as payment proof. Phase 7 adds the local-first assistant and optional consented cloud operations; read ASSISTANT_RULES.md before changing them. Distribution remains unapproved.
- Phase 8 adds reviewed plaintext JSON/CSV reference exports, typed/acknowledged atomic local deletion, database integrity checks, privacy information and OCR/performance hardening. Read DATA_CONTROLS_RULES.md and SECURITY_REVIEW.md before changing those boundaries. Never test destructive operations on the user's ordinary ledger or imply archive restore, app-managed encryption, forensic erasure or a clean dependency audit. The user reported iPhone share-sheet opening, deletion cancellation and OCR candidates in 0.8.0; broader device/capture acceptance remains manual. Keep generated dist/test-results trees excluded from Metro's module map and preserve eager web routes.

## Verification and documentation

Run typecheck, lint, relevant automated tests, Expo dependency compatibility, and runtime checks for each phase. Never claim unexecuted checks passed. Separate web browser evidence, native bundle validation, and physical-device testing. Real Android/iOS safe areas, gestures, font scaling, and device runtime still need device verification.

Update ROADMAP.md, PROGRESS.md, and README.md after each approved phase. Report changes, decisions, executed checks, exact run commands, manual device checklist, limitations, and the next approval gate.
