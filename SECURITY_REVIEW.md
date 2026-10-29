# Phase 8 security review

Reviewed 28 October 2026 for BakiBuddy 0.8.0. This is a source/testing record, not a penetration-test certificate or release approval. Phase 9/distribution remain unapproved. No real ledger deletion, real financial fixture seeding or agent-initiated cloud upload is authorized by this review.

## Boundaries and findings

| Boundary | Implemented control / evidence | Remaining limit |
|---|---|---|
| Financial accuracy | Integer sen/BigInt, safe ranges, separate transfer/refund semantics; retained money/budget/analytics/import tests. | Records do not prove complete spending history. Human review remains required. |
| SQL writes | Parameterized inputs, foreign keys, serialized atomic writes and rollback; new late-failure and stale/concurrent bulk-deletion tests. | No forensic-erasure guarantee. Process/OS storage behavior needs native testing. |
| Database recovery | Quick-check and foreign-key check before migration commit. Corrupt/orphaned/unsupported storage is refused without resetting or seeding. | Device storage exhaustion and filesystem corruption still require native fault testing. |
| Local encryption | Explicit notice that the Expo Go ledger has no app-managed encryption. OS sandbox/passcode protections apply. | [SQLCipher is unavailable in Expo Go](https://docs.expo.dev/versions/latest/sdk/sqlite/#sqlcipher). A real encrypted migration needs a custom binary, key management, recovery and separate validation; an ignored PRAGMA is not protection. |
| Export | Allowlisted JSON fields; exact integer/decimal amounts; bounded size/count; read-only generation. Real browser downloads verified using fictional records. | Files are plaintext. Restore is unavailable. User-selected destinations can upload/retain copies independently. |
| Spreadsheet input | Every CSV cell quoted, quotes escaped, formula/control/fullwidth prefixes neutralized. JSON preserves original text. | [OWASP documents spreadsheet re-save/reopen caveats](https://community.owasp.org/attacks/CSV_Injection). No universal Excel guarantee. |
| Local deletion | Scope/count review, explicit acknowledgement, typed DELETE, atomic content-revision recheck, no action on cancellation, background clears idle review. | Deletes this ledger's rows/markers; not source files, exports, provider logs, other devices or OS backups. |
| Native export cache | Dedicated app-owned export directory; old temporary exports cleared before a new export; cleanup attempted after sharing. | Crash/filesystem failures can leave temporary copies until later cleanup/OS eviction. Native share-sheet behavior remains manual. |
| TNG / OCR sources | Bounded local readers, network-restricting CSP, fixed navigations, human review, source locks and duplicate checks. Original documents/passwords never become fixtures. | Printed-Latin/MYR/verified-layout scope; source identity is not document authenticity. |
| OCR lifecycle | A repeated-read probe caught a pending Image.decode startup after sixteen successful reads. Event-based image loading now validates dimensions before canvas/worker setup. Terminal messages follow worker disposal, readiness can repeat and errors are bounded. Six lifecycle tests cover those paths. | Final actual-OCR/probe results are recorded separately. This identifies an observed startup blocker, not proof that every historical/native timeout has the same cause. Native memory/performance remain manual. |
| Optional Groq | Separate server-only key and ephemeral phone token, per-operation preview/consent, strict enum/ID output, bounded body/response/time/concurrency/attempts, CORS and no silent retry. | Companion is a private development service, not production authentication/rate limiting. HTTP LAN traffic is unencrypted. Groq policy/plan retention and charges are external. |
| Secrets | Ignored environment file, no values printed/copied into tests, exported bundles checked for configured credentials. | A pasted or photographed secret must be replaced. The phone token is not the provider key. |
| Permissions | BakiBuddy uses selected PDF/image pickers and the export share sheet; camera/microphone disabled in ImagePicker config. No contacts/location/notification feature or analytics/ad SDK added. | Expo Go host capabilities differ from a standalone app. Native manifests/backup/store disclosures need a separately authorized distribution build. |
| Accessibility | Existing 48-unit targets, scalable text, labels/roles, disabled semantics, input hints, safe-area/keyboard wrappers; supplemental browser keyboard/landscape/text stress. | VoiceOver/TalkBack, actual Dynamic Type, safe areas and gestures still require device observations. Light-only appearance remains the approved design. |

## Dependency audit

Saved reports: `bakibuddy/test-results/phase8/audit-before.json` and `audit-after.json`. Initial audit: two high, one low, zero critical. Added one SDK-compatible native dependency, Expo Sharing 58.0.20, included in Expo Go. Build-script permissions remain disabled.

Pinned the compatible `node-forge` patch 1.4.1 through a scoped version override; [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) no longer appears. Do not silently suppress the following residual findings:

- **High: Zod 3.25.76**, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), patched range >=4.6.6. Installed through Expo CLI. The inspected CLI uses Zod for development-plugin schemas; app/companion financial input validation does not import it. The SDK-pinned CLI requests Zod ^3.25.76. A forced major replacement is not treated as a compatible patch; the advisory remains pending a supported upstream change and must be reassessed before release.
- **Low: deepmerge 4.3.1**, [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4), no published patched version in the checked advisory. Installed through Expo config/build tooling, used with trusted project configuration. The application does not merge user financial input with it. Keep project/plugin/config sources trusted and reassess before distribution.

Final audit at this point is **one high, one low, zero critical**, not a clean audit. Recorded dependency paths indicate tooling reachability; they are not a formal proof that every possible application binary excludes those packages. No advisory was ignored to manufacture a passing result.

## Acceptance boundary

See the Phase 8 report for final executed commands/results, actual OCR runs, host performance measurements and native checks. Browser tests use separate temporary profiles and fictional data. No ordinary browser/native ledger is used as a test target. This review does not close the earlier formal native finish-review capture gate or authorize publication.
