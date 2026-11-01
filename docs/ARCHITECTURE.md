# Architecture

BakiBuddy is a local-first React Native application with a small, optional Node.js AI companion. The app starts with an empty ledger and requires no hosted database for basic use.

## Module boundaries

Paths below are relative to the application directory.

| Module | Responsibility |
| --- | --- |
| [Routes](../bakibuddy/src/app/) and [components](../bakibuddy/src/components/) | Navigation, forms, reviewed confirmations, and presentation |
| [Finance context](../bakibuddy/src/state/FinanceProvider.tsx) | Application snapshots, loading/error state, and access to repository operations |
| [Storage](../bakibuddy/src/storage/) | SQLite initialization, migrations, validation, derived balances, and serialized writes |
| [Budget engine](../bakibuddy/src/budget/) | Income cycles, commitments, reserves, spending limits, and conditional forecasts |
| [Analytics](../bakibuddy/src/analytics/) | Exact totals, date buckets, category shares, comparisons, and chart inputs |
| [PDF imports](../bakibuddy/src/importing/) | Local extraction, supported-layout parsing, row review, and source deduplication |
| [Scanning](../bakibuddy/src/scanning/) | Bounded local image recognition, candidate validation, and reviewed selection |
| [Assistant](../bakibuddy/src/assistant/) | Deterministic answers, verified fact identifiers, and cloud contracts |
| [Privacy](../bakibuddy/src/privacy/) | Reference export generation, sharing, and in-app notices |
| [Companion](../bakibuddy/server/) | Server-only provider access and bounded Groq requests |

## Financial model

- Money is represented as integer sen. Calculation code checks supported numeric ranges instead of relying on floating-point currency arithmetic.
- Expenses, income, refunds, and transfers are distinct transaction kinds. Transfers between tracked accounts do not become income or spending.
- Opening balances represent the account before the recorded history. Importing transactions already included in an opening balance would count them twice.
- Budgets combine recorded balances, unpaid commitments, reserves, and optional spending caps. Expected income remains conditional until recorded.
- Analytics read stored records without changing the ledger. Charts receive calculated values; chart geometry is not a source of financial arithmetic.

The executable contracts live in the [money utilities](../bakibuddy/src/utils/money.ts), [ledger derivation](../bakibuddy/src/storage/ledger.ts), [budget engine](../bakibuddy/src/budget/engine.ts), and [analytics engine](../bakibuddy/src/analytics/engine.ts), with regression coverage in [tests](../bakibuddy/tests/).

## Persistence and recovery

Expo SQLite uses versioned migrations, foreign keys, parameterized queries, and atomic repository operations. The current schema version is **4**.

Database integrity and foreign-key checks run during opening. Unsupported or corrupt storage is refused without silently deleting records or inserting demonstration data. Writes that fail roll back their transaction.

Bulk deletion additionally compares the reviewed content revision inside the serialized write. Cancellation performs no deletion. Reference exports are read-only copies and cannot currently be restored through the app.

## Local document processing

The PDF reader bundles PDF.js; the image reader bundles Tesseract.js and its English recognition resources. Native screens use WebView bridges, while the web build uses iframe bridges. Processing runs locally with bounded file sizes, image dimensions, work duration, and bridge messages.

Supported TNG imports use the verified text-based eWallet layout. OCR supports documented printed-Latin/MYR receipt, payment-detail, and Activity-list images. Arbitrary bank statements, scanned PDFs, and QR-only payment proof are outside the supported flow.

Candidate rows require comparison and correction before selection. Source locks and possible-duplicate checks run before an explicit atomic save. Uncertain digits and dates are never silently invented; points and balances are not transaction amounts.

Regenerate committed reader bundles with `pnpm build:pdf` or `pnpm build:ocr` after changing their sources. Generated reader files are marked as generated in GitHub; their maintained sources and license notices remain included.

## Assistant trust boundary

Local answers use deterministic facts. Optional cloud operations preview the fields they will send and require operation-specific confirmation.

The app sends approved requests to the private companion; only the companion holds the Groq provider key. Model output is constrained to allowed intents, fact identifiers, or categories and is validated before use. It cannot invent authoritative totals or silently save category changes.

See [privacy](PRIVACY.md) for transmitted data and session lifetime, and [security](SECURITY.md) for deployment limitations.

## Platform behavior

Android and iOS share the Expo application. Web is a supplemental preview with storage scoped to the exact browser profile and origin; it does not share a native ledger.

SQLite web requires WASM and cross-origin isolation headers. The included preview server supplies these headers. Web routes remain eager to preserve the verified already-loaded offline workflow. A fresh Expo Go launch still requires the development bundle to be reachable.
