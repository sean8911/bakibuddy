# Development guide

Run application commands from the nested `bakibuddy/` directory. Node 24.x (24.3+) and pnpm 11.25.0 are recommended; `package.json` defines the supported engine ranges.

## Phone setup

```sh
cd bakibuddy
pnpm install --frozen-lockfile
pnpm start
```

Use Expo Go compatible with SDK 58 on a reachable local network. Android scans from Expo Go; iPhone uses Camera to open the `exp://` QR. Sign in to the same Expo account on computer/phone when Expo Go requires it; this is unrelated to BakiBuddy app authentication.

| Symptom | Check |
| --- | --- |
| No usable data found | Install/open Expo Go before scanning. |
| Incompatible SDK | Match Expo Go to the SDK 58 baseline and reload the current project. |
| Stuck on Opening project | Keep Metro running; use its current QR; check Wi-Fi, VPN and firewall isolation. |
| pnpm not found | Install `pnpm@11.25.0` with npm, then reopen the terminal. |
| No package.json | Change into the app directory, not the repository root. |
| iOS Simulator on Windows | Use a physical iPhone, or macOS/Xcode for the Simulator. |

## Local browser preview

SQLite web needs WASM and cross-origin isolation. Stop Metro before a static export to avoid sharing its generated-file cache.

```sh
pnpm exec expo export --platform web
pnpm preview
```

Open `http://localhost:8082`. The included server sets COOP/COEP headers. Storage belongs to that exact browser profile/origin and is separate from native storage. A generic server without those headers will not work. Concurrent web tabs may contend for SQLite; close the other test tab and retry/reload without clearing data.

For a separate disposable preview origin in PowerShell:

```powershell
$env:PORT = '8085'
pnpm preview
```

This is a local preview, not a published site or production PWA. The already-loaded web workflow has offline evidence; Expo Go still needs its development bundle available when opening the app.

## Optional cloud setup

Local budgeting and bounded assistant answers need no key/service.

```sh
pnpm ai:setup
# Edit server/.env locally.
pnpm ai:server
```

Setup creates the ignored environment file and a random `AI_SERVER_TOKEN`. Add your `GROQ_API_KEY`; the default Groq-hosted model is `openai/gpt-oss-20b`. Existing settings are preserved. Restart after changes.

For phone development on trusted private Wi-Fi, explicitly set `AI_HOST=0.0.0.0` and `AI_ALLOW_LAN_HTTP=true`. Configure `http://<your-computer-ip>:8787` and the separate server token in the app. `localhost` on the phone means the phone. This development HTTP path is unencrypted; do not expose the companion publicly.

In **Set up cloud**, configure a session, ask locally/load categories, then review exact fields before **Send this request**. Connection setup sends nothing. Clear/leave/background clears temporary credentials and unapplied suggestions. Cancellation after sending cannot reverse provider processing. Errors retain local answers. Provider terms/retention are linked in the consent flow; unlimited free use and zero retention are not promised. See [privacy and data handling](PRIVACY.md).

## Imports, OCR and data controls

- **TNG PDF:** use the supported text-based eWallet layout and destination account; enter the local document password only when needed. Check dates/classification/duplicates and separate totals before confirmation. Scanned PDFs, arbitrary bank layouts, physical-card statements and CSV are unsupported. Imported history must not already be included in the opening balance.
- **Images:** choose receipt/payment detail or TNG Activity list, then JPEG/PNG up to 10 MB/12 megapixels. Compare candidates, correct fields, mark reviewed and explicitly include each row. Printed-Latin/MYR layouts only. Missing years/digits need human correction; QR codes, points and balances do not prove payment.
- **Exports:** reviewed JSON/CSV are plaintext reference copies; restore is unavailable. Verify the chosen destination/file yourself.
- **Deletion:** scope review, acknowledgement and typed `DELETE` precede an atomic content-revision check. Cancel changes nothing. External copies/backups/source files are outside deletion; logical deletion is not secure erasure. Use disposable ledgers for destructive tests.

Schema 4 and integrity/foreign-key checks preserve records without silent resets. See the [architecture guide](ARCHITECTURE.md), [privacy notice](PRIVACY.md), and [security considerations](SECURITY.md).

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
pnpm peers check
pnpm dlx expo-doctor
pnpm exec expo export --platform all
```

If standalone npm is absent, use `pnpm --package=npm --package=expo-doctor dlx expo-doctor`. A failed missing-executable invocation is not a pass.

Browser suites require a compatible Chrome installation, the isolation-header server and fictional data. They create temporary profiles. Their default URL is `http://localhost:8083`; set `BAKIBUDDY_URL` to the isolated origin being tested.

```sh
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
pnpm test:import:web
pnpm test:scan:web
pnpm test:assistant:web
pnpm test:privacy:web
```

OCR checks include the actual bundled reader and separate lifecycle tests. Desktop results do not establish device memory/frame rate. The [security documentation](SECURITY.md#dependency-status) records the last dependency audit and remaining tooling advisories.

## Native acceptance

Check persistence/exact balances, transfer/refund semantics, small/large screens, landscape, safe areas, native Back/edge-swipe, keyboards/date pickers, system text scaling, VoiceOver/TalkBack and reduced motion. Verify import/OCR review/cancel/duplicates and a small deliberate save; test exports and deletion only on disposable records. Test welcome Skip/Replay/guest; email sign-in is unavailable.

Separate browser evidence, bundle compilation, user-reported smoke checks and independently observed device behavior. Standalone builds, signing, launcher/splash assets, and store metadata still require release preparation.
