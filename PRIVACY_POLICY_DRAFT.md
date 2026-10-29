# BakiBuddy development privacy notice

Updated 28 October 2026. Applies to version 0.8.0. This draft describes implemented behavior; it is not a claim of legal compliance or a published policy. Publisher identity/contact details, distribution-specific backup settings and store disclosures must be completed before release.

## Local information

BakiBuddy stores account names/opening balances, transaction names/amounts/dates/categories/notes, budget settings, schedules, payment links and hashed duplicate markers in SQLite. Basic use has no BakiBuddy account or bank connection. The app starts empty. Browser data belongs to its exact site address and profile and is separate from phone data.

Selected PDF contents/passwords and receipt/screenshot images/OCR text are processed locally during import/review. They are not stored as source documents in the ledger. Reviewed transaction fields and source identities are saved only after explicit confirmation. App-owned picker cache copies are removed when processing finishes where possible; originals remain in Files/Photos. Interrupted processes/OS caching and JavaScript garbage collection are not secure erasure.

## Optional AI

Local answers require no provider request. Every optional Groq operation first previews the data and asks for approval. Question interpretation sends a question and selected period. Insight selection also sends displayed verified facts, which may include financial totals. Category suggestions send up to five merchant names and temporary labels. No image/document upload is added. API keys stay in the companion's private environment file; the phone uses a separate token held in memory during that screen session. Leaving/backgrounding the screen clears the connection and unapplied cloud output.

The companion keeps exact request results in memory for at most two minutes, clears them on restart and does not log bodies or secrets. Groq's reliability/abuse logging and legal retention exceptions are described in [its current data policy](https://console.groq.com/docs/your-data); Data Controls may change retention. Cancelling an already-sent request cannot reverse processing. Local deletion cannot erase provider records. Provider billing/limits are governed by the user's Groq plan.

## Export and removal

After reviewing scope, users can request an unencrypted JSON reference archive or transaction CSV and select a destination. Sharing applications and cloud drives apply their own policies. Exporting does not alter the ledger, and this version has no archive restore. Temporary native export files are cleaned after sharing where possible; a crash/filesystem failure may retain them until later cleanup or OS eviction.

After separate review, acknowledgement and typed confirmation, Delete local records removes the financial ledger and import/image duplicate markers atomically. It leaves original documents/photos, exports, device backups, other devices and external provider data untouched. Logical deletion is not guaranteed forensic erasure. The app does not silently reset corrupt or unsupported databases.

## Protection and permissions

The current Expo Go ledger has no app-managed encryption. Operating-system sandbox/device protections apply, but there is no encrypted-database or backup-encryption promise. Protect the device with a passcode. [Expo documents that SQLCipher is unavailable in Expo Go](https://docs.expo.dev/versions/latest/sdk/sqlite/#sqlcipher); an encrypted native migration requires a separately planned/tested custom binary and key management.

BakiBuddy uses system file/image pickers and, for exports, the system share sheet. No app feature uses camera, microphone, contacts, location or notifications. Permissions/capabilities exposed by Expo Go itself are governed by the host app. No analytics/advertising SDK or automatic cloud sync was added. Expo development tooling, operating systems and selected sharing destinations have their own privacy terms.

## Before release

Complete publisher contact and jurisdictional review, native platform permission/backup disclosures, store privacy forms and a retention/support process before distribution. These are release requirements, not implemented remote services. No public release has been authorized.
