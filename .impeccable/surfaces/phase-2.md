# BakiBuddy local ledger

Mode: Operate. Phase 2 approved by “continue phase 2”. Inherit the existing navy/emerald/off-white visual system and native tab navigation; no visual-world replacement.

Intent: start empty, add an account and an explicitly explained opening balance, then add a transaction. Transactions open for editing; deletion requires confirmation. Distinguish income, expense, refund, and transfer in visible and spoken labels. Keep form input after errors. A matching payment prompts review or an explicit separate-save choice.

UI/UX Pro Max: focused local queries returned inline validation, suitable numeric keyboards and React Native KeyboardAvoidingView guidance. Use labeled fields, native date selection, 48-unit targets and inline error feedback. Preserve the actual React Native stack and existing tokens.

Implementation: one SQLite ledger and a simple Context. Home and history show real records only; no fixture seed. Budget/analytics remain honest later-phase states. Date-only financial days use KL time. Account balances and summaries use deterministic integer sen, with exact accumulation and range checks.

Review: check first-run, populated history, form errors, edit/delete, no-result filters, persistence and account transfers at small/large sizes. Browser SQLite requires documented cross-origin isolation headers. Native-device keyboard/insets/accessibility still need physical testing. Finish with independent review and updated design documentation; do not advance to Phase 3.
