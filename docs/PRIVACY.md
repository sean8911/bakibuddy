# Privacy and data handling

This document describes BakiBuddy **0.8.1** as a development preview. It is technical product documentation, not a completed release privacy policy. Publisher contact, platform disclosures, and jurisdiction-specific review must be completed before distribution.

## Information stored locally

The SQLite ledger stores account names and opening balances, transaction amounts and descriptions, dates, categories, notes, budget settings, schedules, payment links, and hashed duplicate markers.

Basic use has no BakiBuddy account, automatic bank connection, or cloud synchronization. A new ledger starts empty. Browser storage belongs to its exact origin and profile and is separate from phone storage.

## Selected documents and images

PDF extraction, document-password handling, and image OCR run locally. Original PDF contents, passwords, images, and raw OCR text are not saved as source documents in the ledger. Only reviewed transaction fields and source identities are saved after confirmation.

App-owned picker cache copies are removed when processing finishes where possible. Originals remain in Files or Photos. Interrupted processes, operating-system caches, and JavaScript memory collection do not provide secure erasure.

## Optional Groq requests

Local assistant answers require no provider request. Cloud operations first preview the fields they will send:

| Operation | Approved request data |
| --- | --- |
| Question interpretation | Question text and selected period |
| Insight selection | Question context and selected verified facts, which may include financial totals |
| Category suggestions | Up to five merchant names and temporary labels |

The assistant does not upload a document or image to Groq. Provider API keys stay in the companion's ignored environment file. The phone uses a separate access token held in memory during the assistant screen session; leaving or backgrounding the screen clears the connection and unapplied cloud suggestions.

The companion temporarily caches exact request results in memory for up to two minutes and clears them on restart. It does not log request bodies or secrets.

Provider processing, retention, quotas, and billing are governed by the selected Groq account and [Groq's data documentation](https://console.groq.com/docs/your-data). Cancellation after sending cannot undo processing, and local deletion cannot remove provider records.

## Exports and deletion

Reviewed JSON archives and transaction CSV files are **unencrypted reference copies**. Restore is unavailable. The selected sharing application or destination applies its own retention and privacy policies.

Native temporary exports are cleaned after sharing where possible. A crash or filesystem failure can leave copies until later cleanup or operating-system eviction.

Deleting local records requires scope review, acknowledgement, and typed confirmation. An atomic content-revision check protects against deleting data that changed after review. Cancellation leaves the ledger unchanged.

Deletion removes local financial records and duplicate markers. It does not remove original documents, photos, exports, operating-system backups, other devices, or external provider data. Logical deletion is not forensic erasure.

## Protection and permissions

The current Expo Go ledger has **no app-managed encryption**. Operating-system sandbox and device protections apply; no encrypted-database or backup-encryption guarantee is made.

BakiBuddy uses system document/image pickers and the export share sheet. App features do not use camera, microphone, contacts, location, or notifications. Expo Go's host capabilities differ from a standalone app.

No advertising or analytics SDK is included. Expo development tooling, operating systems, and user-selected sharing destinations have their own policies.

For technical controls and limitations, see [security](SECURITY.md).
