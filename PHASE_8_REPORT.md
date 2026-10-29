# Phase 8 — Security and QA

Authorized by **“now continue phase 8”**, 28 October 2026. Version **0.8.0**, Expo SDK 58 / React Native 0.88 / React 19.3, SQLite schema 4. Implementation and executed source/web checks are complete; remaining device/release limits are explicit. Phase 9 requires separate approval. No distribution, deployment, publishing or remote push was performed.

## Changes

Settings now opens **Privacy & data controls** with current ledger counts, reviewed JSON/CSV export, a privacy notice and a separate local-deletion flow. JSON is an allowlisted reference archive of account/opening-balance and transaction inputs, budget settings/schedules/payment links and hashed duplicate markers. CSV contains transactions and both transfer account identities, exact sen/decimal MYR and quoted/formula-mitigated text. Neither contains source documents/images, document passwords, connection credentials or derived financial totals. Exports are plaintext, limited to 20 MB and explicitly have no archive restore feature.

Native exports use SDK-compatible Expo Sharing 58.0.20 and an app-owned temporary cache directory; browser exports request a local Blob download. Both outcomes avoid claiming that a user saved a file. Destination apps may upload or retain copies independently. Cleanup is attempted after native sharing, with crash/filesystem exceptions documented.

Deletion requires consequence/count review, a separate acknowledgement and exact uppercase DELETE. The repository compares the reviewed full-content revision inside a serialized atomic write, deletes child/financial/source tables and validates the empty ledger before committing. Categories/schema remain for a fresh start. Stale/concurrent consent and late SQL failures reject/roll back the batch. Cancelling/leaving an idle review does not delete anything; an already-confirmed atomic write may finish after navigation. This is logical local deletion, not forensic erasure or removal of external copies/backups/provider logs.

Database opening/migration now checks SQLite quick-check and foreign-key integrity. Errors preserve the database and show recovery instead of resetting/reseeding. Inputs expose existing hints/disabled semantics; existing labels, scalable text, safe-area wrappers, 48-unit targets, colors and design tokens remain.

## OCR diagnosis and correction

Two unchanged baseline real-OCR suites passed all 21 checks each, confirming the original issue was intermittent. A later run passed 21, then its repeat timed out on the blank-image step after 17 checks. Those results are preserved, not relabeled as passes.

Added phase-only instrumentation without raw recognized text or financial payloads. A mixed-image startup probe then reproduced a stall at **Image.decode** on read 17 after sixteen successes; the overall 120-second timer correctly recovered. Saved evidence: `bakibuddy/test-results/phase8/ocr-startup-before-load-fix.json` and matching failure image.

The reader now installs image load/error handlers before assigning its source and checks dimensions before canvas/worker setup. It also terminates the worker/releases its object URL before sending a terminal message that causes document unmount, handles worker errors, and can repeat readiness after document load. The size/row/text limits, 120-second timeout, mandatory review, source locks, exact-money assertions and offline/no-external-request requirements remain.

Six isolated lifecycle tests cover delayed disposal, failure, repeated starts, trusted readiness, invalid image loads and oversized dimensions. After the load-event correction, the full real-OCR suite passes **21 checks**, with no page errors/external requests, and **20 additional mixed receipt/Activity/blank reads pass**, including offline reads. This corrects an observed startup blocker; it does not guarantee that every historical/native timeout has the same cause or that a weak phone will meet host timings.

## Verification

| Check | Executed result |
|---|---|
| Strict TypeScript / ESLint | Passed after final application changes. |
| Unit/actual-SQL/server/setup/lifecycle tests | **192 passed**: 175 retained, 11 privacy/integrity/deletion tests, six OCR lifecycle tests. |
| Privacy production-browser checks | **14 passed**, no page errors/external requests. Actual JSON/CSV downloads, formula text, exact money, export failure, armed cancellation/background clearing, offline deletion, restart and fresh use. |
| Retained browser suites | Ledger **45**, budget **52**, analytics **33**, PDF import **27**, synthetic Groq assistant **34** passed during Phase 8; final global-config regression rerun recorded in the results files. |
| Actual OCR | **21 checks plus 20 additional reads passed after correction**. Earlier passing/failing diagnostic runs remain separately saved. |
| SDK compatibility / peers / frozen lockfile | Passed. Added only SDK-compatible Sharing; no AI SDK/state library or build-script permission was added. |
| Expo Doctor | **20/20 passed**. |
| Android/iOS Hermes + web export | Passed with **24 static routes**. These are bundles, not APK/IPA or native runtime acceptance. |
| Secrets | Configured credentials absent from **103 exported files**; server environment file remains ignored. No secret value is printed in evidence. |
| Contrast | Eight measured text/control pairs exceed 4.5:1; actual ratios are in `test-results/phase8/contrast.json`. No palette change. |
| Dependency audit | node-forge patched to 1.4.1; **one high/one low, zero critical remain**, explicitly documented below. Not a clean audit. |

Browser tests use isolated temporary Chrome profiles and fictional records; only owned profiles are removed. Node SQL/performance checks use fictional in-memory databases. **No real phone or ordinary browser ledger was deleted, reset or seeded.** No agent-initiated Groq financial request was needed. The earlier user-reported successful iPhone Groq request remains separate Phase 7 evidence.

## Performance and development runtime

The reproducible Node-host benchmark uses 10,000 fictional transactions and validates exact totals and archive counts. Analytics initially took about **648–712 ms**. Reusing bucket boundaries once per distinct date reduced it to **12–32 ms** in the saved three-sample run. Local reads were about 26–37 ms, JSON export 12–14 ms and CSV 26–30 ms for an approximately 2.97 MB archive. These are host measurements, not phone performance or frame-rate evidence.

Metro excludes generated `dist/` and `test-results/` trees from its file map while preserving source, assets, dependencies and existing exclusions. A one-time assertion checked Windows/native and slash-normalized paths. This avoids indexing export copies and rapidly changing browser profiles. Existing WASM/HTML asset handling, COOP/COEP headers and eager web routes remain intact. A busy development startup timed out before this exclusion/cache restart; final iOS manifest/bundle delivery is recorded separately from device acceptance.

## Security/privacy decisions and residual risks

See [SECURITY_REVIEW.md](SECURITY_REVIEW.md), [DATA_CONTROLS_RULES.md](DATA_CONTROLS_RULES.md), [SCANNING_RULES.md](SCANNING_RULES.md) and [PRIVACY_POLICY_DRAFT.md](PRIVACY_POLICY_DRAFT.md).

- No app-managed database encryption was added. [Expo documents SQLCipher as unavailable in Expo Go](https://docs.expo.dev/versions/latest/sdk/sqlite/#sqlcipher); a real encrypted migration requires a custom binary, secure keys/recovery and further validation. No ineffective encryption PRAGMA or guarantee was introduced.
- The high Zod advisory remains in the SDK-pinned Expo CLI's development-plugin validation path; its advertised fixed major is outside the CLI's requested major. The low deepmerge tooling advisory has no published patched version in the checked source. Neither is imported by app/companion financial validation. These are residual tooling risks to reassess before distribution, not suppressed findings or a formal binary reachability proof.
- No camera, microphone, contacts, location, notification or advertising feature was added. System picker/sharing behavior and Expo Go host capabilities differ from a standalone native build. No new notification scope was inferred.
- JSON/CSV copies, OS backups, cache/filesystem exceptions, cloud retention and unencrypted LAN development HTTP are disclosed. The privacy notice is a factual draft; publisher contact/legal/store disclosures remain release work. No legal-compliance claim is made.

## Design Trio and independent review

Intent/fortify/articulate shaped export scope, truthful outcomes, proportional destructive consent, stale confirmation and recovery. UI/UX Pro Max's focused React Native guidance informed roles/labels and device testing; the actual RN 0.88 stack/tokens override its older RN-version annotation. Impeccable extended the established Operate forms and fine-rule composition, without a new world, raster asset or theme.

The packet contains **72 supplemental web PNGs and 12 sheets** at 320/375/390/430/1440, landscape 568×320 and browser text stress. Root inspected all initial 66 via eleven sheets; their final recaptures were byte-identical, and six new CSV originals were inspected individually. The fresh independent reviewer inspected all twelve sheets/eight originals and current UI source, returning **ship for the supplied source/React Native Web scope**, with no material/cosmetic fixes. No detector ran against native StyleSheet code.

Formal native review remains **recapture**, not a build failure or approval. The [active Impeccable skill](C:/Users/USER/.agents/skills/impeccable/SKILL.md) routes finish work through its [new-work reference](C:/Users/USER/.agents/skills/impeccable/reference/new-work.md), which requires captures “on native, one per device class”. Current iPhone/Android Phase 8 state sets are missing. Browser captures cannot satisfy that requirement.

The shipped documenter compared the built controls/source/evidence with the incumbent system and updated only DESIGN.md descriptive prose. Its report preserves native limits and pre-existing sidecar drift. Protected normative frontmatter, sidecar and source-token hashes remain unchanged. Scanner-only follow-up edits and Metro config are outside the data-control finish verdict; final manifest integrity is rechecked without inflating that verdict.

## Reproduce

From `C:\Users\USER\Documents\ChatGPT\Budget Calculator\bakibuddy`:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
pnpm peers check
pnpm --package=npm --package=expo-doctor dlx expo-doctor
pnpm audit --json
pnpm build:ocr
# Stop the project's Metro process before exporting on this host.
pnpm exec expo export --platform all
node scripts/check-assistant-secrets.mjs
node scripts/check-ledger-performance.mjs
pnpm preview
```

In a separate terminal, with the matching preview port:

```powershell
$env:BAKIBUDDY_URL='http://localhost:8082'
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
pnpm test:import:web
pnpm test:assistant:web
pnpm test:privacy:web
$env:SCAN_RESULTS_DIR='test-results/phase8/ocr-after-load-fix'
pnpm test:scan:web
node scripts/check-ocr-startup-web.mjs
```

Start phone development with `pnpm exec expo start --clear --lan --port 8081 --max-workers 2`. Keep the optional companion separate with `pnpm ai:server`. Both require the documented private-network setup; no remote service was deployed.

Final development delivery: `exp://LAN_HOST:8081`, manifest HTTP 200/version 0.8.0/SDK 58.0.0 and iOS development bundle HTTP 200/**9,524,119 bytes** after the generated-output exclusion/cache restart. Initial cold/busy probes failed before the successful final check; no physical-device claim is inferred from bundle delivery.

## User-reported iPhone smoke checks

The user confirmed **“Share sheet opens; deletion cancelled”** after reopening 0.8.0 and following the safe sharing/deletion-review check. They also confirmed **“Candidate rows appear”** after reading the previous TNG Activity screenshot with the revised local loader and cancelling before saving. These are reported functional observations. No exported-file integrity/cache inspection, native destructive deletion, exact-field/save acceptance, Android result, OS text scaling or full native capture verdict is inferred. The formal native review remains recapture.

## Remaining device/release checklist

- On iPhone/Android, reopen 0.8.0, inspect data counts and export reviews. Check the share sheet, cancel first, then optionally save a private copy and open it locally. Do not upload the file into chat. Confirm source records/balances are unchanged.
- Open deletion review and cancel; check idle backgrounding clears the confirmation. Full deletion acceptance must use a disposable fictional native ledger, not the user's ordinary records. Confirm rollback/retry behavior under native storage faults before release.
- Repeat local OCR with receipt/Activity/blank images, cancel before saving, and inspect startup latency/memory on the actual device. Earlier PDF/OCR exact-field/save checks remain separate.
- Capture Settings, controls, export/share/recovery, deletion/empty/success on iPhone and Android; include device/OS/text-scale metadata, large text, keyboard, safe areas, Back/gestures, VoiceOver/TalkBack and offline/restart behavior. Browser text stress does not prove Dynamic Type.
- Reassess tooling advisories, publisher/privacy/store details, backup/encryption strategy and release permissions before separately approved Phase 9 distribution work.

PHASE 8 COMPLETE — WAITING FOR USER REVIEW.
