# Phase 6 — receipt and screenshot OCR

Authorized by the user's “continue phase 6” on 27 October 2026. Preserve SDK 58, the Daily Planner design, existing money rules, TNG PDF import and stored records. Phase 7 and distribution remain outside scope.

## Experience contract

Choose a receipt/payment screenshot, read locally, compare candidate fields with the image, correct each included row, check duplicates, review separate totals, then confirm an atomic save. Nothing starts selected. Every selected row needs explicit review; no accuracy percentage is presented as a guarantee. Missing/ambiguous dates and amounts stay empty. Transfers never become new income automatically. QR codes and reward points do not establish payments.

Extend the existing import/review composition with the same FormScreen, inputs, choice controls, rows, dividers and tokens. Home and Settings expose Scan receipt or screenshot. Show bounded progress, cancel, readable failure/retry, blank/unsupported recovery, per-row uncertainty, duplicate locks, confirmation and success. Keep a source-image preview and recognized text available during review. Do not retain images or raw OCR text in the ledger.

## Technical investigation

Native Vision/ML Kit bridges require a custom build unavailable in Expo Go. Evaluate a bundled Tesseract.js WebAssembly worker inside the existing WebView (web iframe for supplemental tests). Hermes itself cannot run Tesseract; the WebView is the execution environment. Bundle engine/model/worker locally with network blocked. Verify actual OCR before claiming this approach works. Native WebView acceptance remains a phone check.

Use Expo's SDK-compatible image picker, one image per scan, bounded bytes/pixels/rows/time and one worker. Support printed Latin text and MYR amounts initially. Parse the supplied TNG Activity layout and conventional single-total receipts/payment details conservatively. Expose corrections rather than guessing unsupported layouts.

Atomic saves must enforce exact integer-sen validation, current accounts, source-image row identity, manual/PDF/overlapping-image duplicate review, concurrent submission protection and rollback. Keep source hashes only; preserve all earlier ledger/budget/import data through a tested migration if required.

## Design Trio decisions

Intent/fortify: correction and cancellation precede saving, meaningful uncertainty instead of invented confidence, interrupted scans discard transient image/text, and failure never changes the ledger. Existing project context and the supplied screenshot provide the brief; no user research is claimed.

UI/UX Pro Max's focused React Native search returned accessible labels, bounded image dimensions and an expo-image suggestion. Accept labels and dimensions. Retain React Native Image for one transient preview: a cache library would add little value and persistent image caching is undesirable here. Its database refers to RN 0.86; validate advice against the actual RN 0.88 APIs.

Impeccable: extend the incumbent Operate surface without a new visual world or token change. The original brief authorizes sensible implementation defaults; no additional design interview is needed for this scoped extension. Inspect actual supplemental web states, then use the required fresh finish review and documentation comparison. Native tests stay explicitly separate.

## Acceptance evidence

Run parser/validation and real-SQL tests for dates, exact amounts, ambiguous totals, multi-row lists, points/balances, missing fields, duplicate sources/edits, rollback, concurrent saves and migration preservation. Run real OCR in a browser with synthetic receipt/activity images and blocked external requests; inspect the original screenshot locally without copying personal rows into fixtures. Exercise select/read/cancel/edit/confirm/repeat/offline/restart and representative small/large/landscape layouts. Run TypeScript, lint, Expo/peer/Doctor and Android/iOS/web bundle validation. Record physical iPhone/Android OCR, memory, picker, backgrounding, scaling and screen-reader checks as manual unless actually observed.
