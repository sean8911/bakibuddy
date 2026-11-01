# Security considerations

BakiBuddy is a development preview. The controls below describe implemented behavior and recorded checks; they do not establish a penetration-test certification or production release readiness.

## Controls

| Area | Implemented controls |
| --- | --- |
| Financial integrity | Integer-sen calculations, range checks, distinct transaction kinds, and deterministic regression tests |
| Database writes | Parameterized inputs, foreign keys, migrations, serialized transactions, and rollback |
| Recovery | Opening integrity checks; unsupported or corrupt storage is refused without silently resetting the ledger |
| Imports and OCR | Bounded local readers, restricted navigation, explicit human review, source locks, and duplicate checks |
| Export | Allowlisted fields, exact amount serialization, bounded output, and spreadsheet-formula mitigation |
| Deletion | Scope review, acknowledgement, typed confirmation, and an atomic content-revision check |
| Cloud operations | Per-request consent, strict output contracts, body/response/time/concurrency bounds, and no silent retries |
| Credentials | Server-only provider keys, ignored environment files, and temporary in-memory app connection tokens |

## Important limitations

- The Expo Go ledger has no app-managed encryption. External copies, backups, and source documents are outside local deletion.
- JSON/CSV exports are plaintext reference copies. Spreadsheet applications can reinterpret files after editing or re-saving.
- A source identity supports deduplication; it does not authenticate a statement or establish that a payment occurred.
- The Node companion is a private development service. Remote deployment needs HTTPS, production authentication, abuse controls, and operational review. Development LAN HTTP is unencrypted.
- Full native fault recovery, accessibility, gestures, memory, and performance acceptance still require physical-device testing.

## Dependency status

The last recorded lockfile audit, **28 October 2026**, reported **one high and one low advisory**, with zero critical findings. This documentation refresh does not represent a new dependency audit.

| Package | Recorded finding | Reachability and follow-up |
| --- | --- | --- |
| Zod 3.25.76 | High · [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | Installed through Expo CLI for development-plugin schemas. App and companion financial validators do not import it. Reassess against a supported upstream update before release. |
| deepmerge 4.3.1 | Low · [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | Installed through Expo configuration/build tooling, used with trusted project configuration. Reassess before release. |

These dependency paths describe the inspected tooling; they are not proof that every possible native build excludes the packages. No advisory is suppressed to claim a clean audit.

Run a fresh audit from the app directory when reviewing dependency changes:

```sh
pnpm audit
pnpm check:expo
```

## Verification scope

Automated checks cover financial boundaries, migrations, rollback, stale and concurrent confirmations, malformed import/OCR data, export formulas, and companion contracts. Browser suites use isolated profiles and fictional records.

Browser evidence, native bundle compilation, and physical-device behavior are separate forms of verification. Use a disposable ledger for destructive tests; never reset an ordinary ledger to demonstrate recovery.

## Reporting

Do not include credentials, account identifiers, financial records, original documents, or exploit details in issues. Contact [the maintainer](https://github.com/sean8911) to arrange an appropriate private reporting channel for sensitive findings. General reproducible bugs can be reported through [GitHub Issues](https://github.com/sean8911/bakibuddy/issues) with fictional data.
