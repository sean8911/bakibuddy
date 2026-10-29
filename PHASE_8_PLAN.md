# Phase 8 — Security and QA

Authorized by “now continue phase 8”, 28 October 2026. Target version 0.8.0; preserve SDK 58, integer-sen finance, schema 4 and existing user records. Phase 9 and distribution remain unapproved.

## Work

- Extend Settings with Privacy & data. Export a complete, versioned JSON reference archive or a spreadsheet-safe transaction CSV only after showing their contents and plaintext sensitivity. Native uses the system share sheet; web downloads locally. No upload, automatic backup or restore feature.
- Offer a separate review for deleting all local financial records. Name every affected collection, require explicit acknowledgement and typing DELETE, reject stale confirmation inside a serialized atomic database transaction, and keep cancellation harmless. Never erase the user's real data during agent testing. Deletion is logical removal, not a secure-erasure or external-copy guarantee.
- Review SQLite recovery and failure paths; retain data rather than silently resetting on errors. Add rollback, stale/concurrent deletion, export exactness and malformed-input regression tests on fictional databases.
- Diagnose the intermittent actual OCR regression, including worker lifecycle and repeated-image startup. Keep real OCR, exact financial assertions and current timeout limits.
- Audit dependencies and permissions, fix compatible advisories, document residual reachability and Expo Go encryption limitations. Keep provider secrets outside mobile/export files and cloud consent unchanged. Draft a factual privacy notice without claiming legal compliance.
- Verify typecheck/lint, unit and actual-SQL tests, dependency compatibility/Doctor, exports and isolated browser flows including offline, errors, keyboard, small screens and larger text. Separate source/web/bundle evidence from physical iPhone/Android checks.

## Design contract

Intent/fortify/articulate: make export scope, local deletion boundaries, cancellation and failure recovery explicit. UI/UX Pro Max: reuse semantic labels/roles and 48-unit controls on the actual RN 0.88 stack; its local dataset's RN 0.86 version note is advisory. Impeccable: extend the established Settings/form composition, preserve all tokens, inspect renders and request an independent scoped finish review. No new visual identity, raster asset or concept round is needed for this specified Settings extension.

## Acceptance and limits

No known critical financial accuracy, data-loss or security issue in executed checks. A residual advisory is not silently suppressed. SQLCipher requires a custom native binary and is unavailable in Expo Go; do not add a fake encryption pragma or promise encrypted storage. Actual native sharing, safe areas, accessibility and deletion testing require user/device observations. The user approves each real deletion within the app. No notification permission, cloud deployment, store build or publication is included.
