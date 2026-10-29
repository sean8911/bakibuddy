# Data controls contract — Phase 8

Version 0.8.0 extends Settings with Privacy & data. The user's approval authorizes implementation and isolated fictional-data verification, not deletion of their real records. Schema remains 4.

## Export

No automatic export, network upload, telemetry or provider call is added. Review a format before choosing a destination. JSON format `bakibuddy-reference`, version 1, includes allowlisted account inputs, exact transaction inputs, budget settings/items/settlements, hashed PDF wallet/receipt identities and image-source identities. Financial values remain integer sen; currency MYR, dates Asia/Kuala_Lumpur and an explicit UTC export timestamp are included. Derived balances/totals, arbitrary object properties, source documents/images, document passwords and connection credentials are excluded. This is a reference archive; there is no archive restore/import implementation.

CSV includes all transactions and their account/transfer identities, descriptions, exact sen and decimal MYR amounts. It excludes opening balances, budgets and source markers. All cells are quoted with doubled internal quotes; potentially executable text prefixes, including leading whitespace/control characters and fullwidth formula characters, receive an apostrophe. JSON retains original text. CSV spreadsheet re-save/reopen behavior varies; this is mitigation, not an Excel security guarantee. Conversion to decimal MYR uses integer/BigInt arithmetic.

Exports are plaintext and limited to 20 MB and 100,000 entries per collection. Nonfinite, fractional or unsafe numbers are refused. Browser export requests a Blob download with a revoked temporary URL; it cannot attest that the browser saved a file. Native export uses SDK-compatible Expo Sharing and a dedicated cache directory, attempts cleanup after the share sheet closes and clears previous owned exports before a new export. Process termination or filesystem errors may leave cache files until a later cleanup/OS eviction. User-chosen destinations and their retention/upload behavior are outside the app's control.

## Deletion

Review affected data and current counts, explicitly acknowledge the consequence and type uppercase DELETE. The final button is separate from review and remains disabled until all conditions pass. Cancel/back/navigation do not write. Backgrounding clears an idle review. Busy controls prevent repeated actions; financial storage never depends on UI checks alone.

Leaving/backgrounding before final confirmation does not delete anything. Once an explicitly confirmed atomic write has started, it may finish even if the screen is left; navigation is not an undo operation.

`deleteAllLocalRecords` runs through the existing serialized `BEGIN IMMEDIATE` write. Compare the full reviewed snapshot revision inside that transaction, then remove settlements, image receipts, PDF receipts/wallet mappings, transactions, schedules, budget settings and accounts. Read/validate the empty snapshot before commit. Preserve categories and schema so a new empty ledger works normally. Any stale consent, SQL failure or conflicting queued write aborts/rolls back the batch. Export creation is read-only. The ordinary/native ledger is never a test fixture.

This is logical SQLite deletion. It is not forensic erasure and does not remove original PDFs/photos, export copies, operating-system backups, other devices, companion caches or provider records. Source locks disappear with the ledger, permitting deliberate future reimport. No cloud deletion or provider account management is implemented.

## Recovery

Opening/migrating storage runs SQLite quick-check and foreign-key validation. Failure presents recovery without resetting records. The shared connection's rejected opening promise can be retried. Existing financial writes remain parameterized, exact and atomic. Raw SQLite diagnostics are not shown as financial facts. Read errors must never trigger destructive recovery or reseeding.

Review the remaining actual-device checks in the Phase 8 report before native acceptance. Distribution and Phase 9 require separate approval.
