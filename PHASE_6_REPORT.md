# Phase 6 development report

## 1. Phase status

**Phase 6 — Receipt and screenshot OCR**, authorized by “continue phase 6” on 27 October 2026. Version **0.6.0** implementation, automated verification, supplemental source/web fixes and design-document comparison are complete and awaiting user review. The user reports candidate extraction working on the physical iPhone. The formal native finish review remains **recapture**, pending device screenshots and remaining iPhone/Android acceptance; no native UI approval is claimed. Phase 7 is not authorized.

## 2. Features implemented

- Scan receipt on Home and Scan receipt or screenshot in Settings open the local image workflow.
- Choose one JPEG/PNG from Photos and select receipt/payment detail or TNG Activity layout. No camera or microphone permission is requested.
- Read printed Latin text/MYR amounts using a bundled local OCR worker. The original supplied Activity screenshot produced five candidates; one amount was misrecognized and is left for correction. No original personal image/rows were copied into fixtures or the ordinary ledger.
- Keep source image expansion and selectable recognized text available while checking names, full dates and amounts. Flag uncertain text/missing fields; never silently replace OCR letters with plausible digits.
- Split Activity lists into dated rows; exclude reward points and navigation. Receipt mode separates a full total from items, cash/change, subtotals, balances and other misleading numbers. Ambiguous totals/years remain empty.
- Start every candidate excluded/unreviewed. Correct each included row, choose its type/category and check every field against the image. Reloads/own-account transfers need explicit direction and another tracked account.
- Lock already-saved image rows; warn about matching date/amount/shared-account records across PDF imports, manual entries and overlapping images. A real separate payment needs acknowledgement.
- Confirm each selected row/account and separate expense/income/refund/transfer totals before one atomic save. Cancellation, unsupported/blank results, retries and offline already-loaded reading do not create records.
- Clear transient image/text/review on leaving/backgrounding. No source image or raw recognized text is saved to SQLite.

## 3. Important files

- `bakibuddy/src/app/scan-receipt.tsx`: selection/read/review/confirmation/success and cancellation lifecycle.
- `bakibuddy/src/components/ScanRowEditor.tsx`: corrections, uncertainty, transfer ownership, duplicate acknowledgement and checked review.
- `bakibuddy/src/scanning/`: bounded candidate parser, pure review/duplicate helpers, picker, typed reader bridge and native/web readers.
- `bakibuddy/src/storage/repository.ts`, `storage/ledger.ts`, `types/finance.ts`: schema 4, source-receipt loading and serialized atomic saves.
- Home, Settings and root layout: scanner entry/navigation. Native DateField now permits an empty date until the user chooses one. Existing amount/validation rules are reused.
- `scripts/build-ocr-runtime.mjs`, `scripts/ocr-runtime.js`, `assets/ocr/`: generated offline reader/model/license notice. Tesseract/model dependencies are build-time only.
- `tests/scan.test.mjs`, four fictional PNG fixtures, `scripts/make-scan-fixtures.py`, `scripts/check-scan-web.mjs`: deterministic parser/SQL and actual OCR/browser verification. Older migration tests now remove the schema-4 table when constructing genuine v1/v2 fixtures; their preservation assertions remain.
- `SCANNING_RULES.md`, `PHASE_6_PLAN.md`, `.impeccable/surfaces/phase-6.md`: financial/privacy/experience contract and existing-world extension.

## 4. Technical decisions

Keep Expo SDK 58 / React Native 0.88 / React 19.3. SDK-compatible ImagePicker **58.0.10** supplies the system chooser and Expo Asset **58.0.18** supplies the bundled reader. App config blocks camera/microphone permissions for this feature; custom usage strings take effect in a future app build, while Expo Go uses its host permissions.

Native Vision/ML Kit bridges would require a custom build unavailable in Expo Go. Tesseract.js itself cannot run in Hermes because React Native lacks its required WebAssembly environment; it runs inside the existing WebView instead. See [Expo native-code limitations](https://docs.expo.dev/workflow/customizing/) and [Tesseract framework support](https://github.com/naptha/tesseract.js/blob/master/docs/faq.md). Native WebView/WASM behavior still needs a real device test.

Tesseract.js/core **7.0.0** and the English **4.0.0_best_int** model are bundled into a separate **9.35 MB** HTML asset. The JS entry does not inline that asset. A single portable LSTM core avoids downloading alternate SIMD variants; this trades performance for bounded size and broad WebAssembly compatibility. The worker and model use local blob/data URLs; CSP prohibits HTTP(S) OCR connections. No external API, backend, login, CDN model fetch or AI was added. See [Tesseract local deployment options](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md). The optional donation postinstall is explicitly disabled in pnpm's build policy.

Limits are 10 MB/12 megapixels, 500 text lines/50,000 characters, 50 rows and 120 seconds. Images resize within the isolated reader to a 2,400-pixel long side, with at most 2× enlargement. Recognition heuristics create warnings; they are not accuracy guarantees. Missing years are not replaced with today. Receipt numeric dates use Malaysian day/month/year; conflicting or foreign-currency totals need correction. QR codes never prove payment.

Schema **4** adds only `scan_receipts(source_key, transaction_id)`. A versioned SHA-256 source key uses picker image bytes and row index, independent of edits/account changes. Editing preserves the lock; deleting a transaction cascades it and permits deliberate re-scanning. Different encodings/crops need the broader possible-duplicate warning; edited dates/amounts can still evade that heuristic. Serialized saves validate accounts, dates, exact sen, reviewed status, keys/IDs and duplicates again, then commit records/receipts together after balance/budget checks. No OCR total becomes authoritative. Existing TNG import identities and all financial records survive migration.

Design Trio retained the Daily Planner tokens and existing import composition. Intent/fortify supplied uncertainty/correction and recovery requirements; UI/UX Pro Max supplied focused React Native accessibility/dimension advice, checked against RN 0.88. Its additional cache-library suggestion was unnecessary for one private transient preview. Impeccable owns the rendered review and documentation comparison; no new world, comp, palette, detector or release workflow was introduced.

## 5. Executed checks

Executed on Windows, Node **24.22.1**, pnpm **11.25.0**. Tests use fictional, isolated ledgers.

| Check | Actual result |
|---|---|
| Frozen-lockfile install | Passed. Optional dependency build scripts remain disabled. |
| TypeScript / ESLint | Passed. |
| Unit/real-SQL tests | **131 passed**: 23 new scan tests plus 108 retained. |
| Parser/financial boundaries | Full totals vs items/cash/change, currencies, invalid OCR digits, missing/invalid/cross-year dates, merged lines, points/QR exclusion, size/geometry bounds, initial exclusion, review/type/transfer checks and exact separate totals. |
| Real SQLite | v3→4 preservation and migration rollback/retry, source identity after edits/deletes, SQL/overflow rollback, concurrent confirmations, invalid accounts/fields and broad duplicate revalidation. Existing v1/v2 migrations still pass. |
| Expo / peers | Matching SDK dependencies; no peer issues. |
| Expo Doctor | **20/20 passed**. |
| Android/iOS/web export | Hermes bundles and **21 static web routes** passed, including the separate reader asset. These are not APK/IPA or runtime tests. |
| Retained browser suites | **45 ledger, 52 budget, 33 analytics and 27 PDF import** checks passed. |
| Scan browser | **21 checks passed**, including source expansion, actual OCR, source correction, mixed expense/refund/transfer save, balance reconciliation, restart, strong/possible duplicates, offline execution, blank recovery, cancellation, disabled zero-selection continuation and account labels for all money kinds/both transfer directions; errors `[]`, external requests `[]`. The initial repeat-image test incorrectly waited for a review button intentionally hidden by its source lock; its wait now observes the resulting candidate state. No lock was weakened. |
| Original screenshot probe | Actual browser OCR found five dated candidates and four valid amounts; one malformed amount needs correction. Source/recognized text remained transient. No ordinary ledger writes. |
| Native runtime | The user explicitly reported **“It shows candidate rows”** after reopening version 0.6.0 on the physical iPhone and running the supplied screenshot in TNG Activity mode. This is reported picker/OCR functionality, not agent-observed capture evidence or confirmation of native saves, exact fields, memory, accessibility or Android behavior. |

Evidence is under ignored `bakibuddy/test-results/phase6/` and `.impeccable/review/phase6/`: **102 current captures** at top/middle/bottom, including widths 320/375/390/430/1440 and 568×320 landscape, plus 17 contact sheets. The parent inspected every initial valid 96-capture sheet and selected originals, then the updated narrow continuation/refund confirmation and new income/outgoing-transfer originals after the fix batch. Early screenshots retained a prior scroll position; the capture harness now explicitly records top/middle/bottom and the full suite passed again. All captures are supplemental web evidence.

The independent native finish reviewer returned **recapture** for absent iPhone/Android state captures and stopped at its evidence gate; `finish-review.md` preserves that result. A separate supplemental source/web audit inspected all initial 16 valid sheets and ten originals, found two P2 issues, and resumed after one usage-limit interruption. The fixes disable zero-selection continuation, place its reason/validation beside the action, and use neutral Account wording for nontransfers. Its final scoring pass returned **ship for those two scored fixes only**, both resolved; `supplemental-web-review.md` and `supplemental-verdict.md` preserve the audit and score. This does not replace native review or certify every source path.

The independent documenter compared the final source and refreshed evidence, updated only DESIGN.md descriptive prose, and confirmed the normative frontmatter, `.impeccable/design.json` and source tokens remained byte-identical. Pre-existing sidecar narrative drift was reported and left untouched. `document-comparison.md` records its evidence and hashes. No detector ran because this is React Native, and no comp/new-world gate applied.

Final Metro handoff: `exp://LAN_HOST:8081` serves SDK `58.0.0`, version `0.6.0`, runtime `exposdk:58.0.0`. The updated iOS development bundle returned HTTP 200 (**9,410,316 bytes**). The server remains running; this delivery check is separate from the user's reported phone OCR and the open native review.

## 6. How to run

```powershell
cd "C:\Users\USER\Documents\ChatGPT\Budget Calculator\bakibuddy"
pnpm install --frozen-lockfile
pnpm exec expo start --go --lan --port 8081 --max-workers 2
```

Keep Metro running; fully close/reopen the project in SDK 58 Expo Go after updating so schema 4 initializes. Preserve app data. On iPhone use the same Expo account in CLI/Expo Go if prompted and a reachable local network, then scan the current QR. First development use needs Metro to supply the reader asset; no image is uploaded for OCR.

```powershell
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
pnpm peers check
pnpm --package=npm --package=expo-doctor dlx expo-doctor
pnpm exec expo export --platform all --max-workers 2
pnpm preview
# In another terminal, from the same directory:
$env:BAKIBUDDY_URL='http://localhost:8082'
pnpm test:scan:web
pnpm test:import:web
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
```

`pnpm build:ocr` regenerates the local asset after engine/runtime/model changes. The fictional PNGs are committed fixtures; `python scripts/make-scan-fixtures.py` regenerates them with Pillow/Arial on Windows. Python is not required to run the app or existing fixtures. Browser/native ledgers are separate.

## 7. Manual phone checklist

- Reopen the project without clearing app data. Verify existing accounts, transactions, budget plans, payment links and TNG import locks remain.
- Open Scan receipt, select an account/layout, choose a saved Photos image and try reading/cancelling first. Confirm history remains unchanged. Picker cancellation/permission denial must recover without a phantom image/record.
- Read the supplied TNG Activity screenshot using its layout. Compare all five rows; correct the unclear amount/name and confirm full dates. Points must not appear as transactions. Classify transfers based on your actual account ownership.
- Try a clearly printed MYR receipt: confirm the paid total rather than subtotal, cash/change or items. Test missing year, conflicting totals, blank/blurred/oversized images and unsupported formats; correct or discard uncertain results.
- Check expanded image, recognized text, keyboards, full-date entry, type/category choices, transfer direction/other account and review acknowledgement. Save only a deliberately reviewed small selection.
- Verify both balances, separate income/expenses/refunds, Budget/Insights and any planned-payment links. Restart and select the same image again; saved rows must remain locked. A re-encoded/cropped overlap should prompt possible-duplicate review when financial fields match.
- Test a local image with networking unavailable after the reader asset is cached. Native Expo Go still needs its host JS/assets available; this differs from a packaged offline app.
- Cancel active reading; background/reopen during reading/review and confirm transient scan data clears with no extra records. Test a large supported image on a modest device for responsiveness/memory/timeouts.
- On Android and iPhone verify portrait/landscape, large system text, safe areas, native Back/swipe/predictive gestures, touch targets, VoiceOver/TalkBack, focus and permission wording. No browser screenshot certifies these.

## 8. Known limitations

Only printed Latin/MYR examples and the supplied TNG Activity layout were investigated. Handwriting/non-Latin OCR, arbitrary bank layouts, scanned PDFs, camera capture, automatic rotation/cropping, cloud OCR and receipt-image storage are unavailable. Browser OCR success does not prove native WKWebView/Android WebView WASM support, memory or performance. Recognition can omit rows or misread a field; every save requires user review. Long/complex images should be cropped externally or replaced by the verified TNG PDF export.

Source keys detect exact image-row repeats, not every transformed copy. The broader duplicate heuristic can produce false positives and miss corrected dates/amounts. Two-digit Activity period years use 2000–2099 and need review; older/ambiguous dates require manual entry. Images/text are transient, but JavaScript/WebView garbage collection is not cryptographic erasure. No backup/export, storage-encryption guarantee or cloud sync was added.

The earlier Phase 5 private-analysis cleanup limitation remains documented in PHASE_5_REPORT.md; this phase did not retry blocked deletion or modify original Downloads files. No personal screenshot was added to fixtures.

## 9. Next phase

**Phase 7 — AI financial assistant** would add categorization/explanations tied to verified deterministic calculations, explicit cloud consent, secure server access, errors/timeouts and a non-AI fallback. It has not started and requires separate explicit approval.

## 10. Approval status

Phase 6 is complete at its implemented/automated/supplemental source-web scope and awaits user review. The formal native finish review remains **recapture** for missing device evidence; remaining native acceptance is manual. No deployment, publishing, remote push, store build or Phase 7 work is authorized. Phase 7 needs separate explicit human approval.

PHASE 6 COMPLETE — WAITING FOR USER REVIEW.
