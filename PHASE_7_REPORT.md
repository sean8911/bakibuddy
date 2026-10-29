# Phase 7 development report

**Current follow-up: version 0.7.1 uses Groq**, authorized by “ok then use Groq” on 28 October 2026. See [PHASE_7_GROQ_UPDATE.md](PHASE_7_GROQ_UPDATE.md) for current setup and verification. The original 0.7.0/OpenAI implementation and review evidence below is historical; it does not establish live Groq or native acceptance.

## 1. Scope and authorization

**Phase 7 — AI financial assistant**, authorized by “now phase 7” on 27 October 2026. Version **0.7.0**, Expo SDK 58 / RN 0.88 / React 19.3. Implementation, automated verification, supplemental source/web fixes and independent documentation comparison are complete; awaiting user review. Formal native review returned **recapture** for missing native screenshots. Live OpenAI verification needs a locally configured key and was not executed. No Phase 8 or distribution authorization.

## 2. Implemented experience

Home and Settings open **Ask about your money**. Local interpretation answers the five requested examples: today’s individual-payment allowance, weekly spending changes, chosen savings reserve, category spending and a conditional scheduled balance forecast. Additional recorded overview/spending and default/explicit periods work locally. Every answer shows its question, scope, verified facts and assumptions. Empty/inactive/unsupported/malformed inputs have recovery; no fictional ledger seed or invented savings recommendation.

**Review expense categories** shows expenses in Other, five at a time. Local consistent-name history and conservative name hints provide unselected suggestions. The user can edit each category, include rows, inspect confirmation, go back and explicitly save. Cloud suggestions use the same review process and never save automatically.

Optional cloud setup stores only a companion origin and separate access token in memory. Operation-specific preview precedes every send. It shows the question/facts or merchant names, companion/OpenAI destination, cost/retention note and exact request fields on demand. Cancellation before send makes no request. Loading/cancellation/configuration/network/invalid-output/timeout/limits keep local answers usable. Revoke, route blur/unmount and backgrounding clear credentials and unapplied suggestions.

## 3. Financial and storage decisions

ASSISTANT_RULES.md records the calculation/data contract. Reuse deterministic integer-sen budget/analytics/calendar functions. Weekly changes are descriptive, equal-length comparisons. Affordability compares one payment with the current protected daily allowance. Savings is the entered reserve. Category spending has no invented category-specific limit. Forecasts include entered unpaid bills and scheduled income through an inclusive bounded target, exclude linked occurrences and missed earlier income, assume no extra spending, and keep reserves within balance. Unsafe aggregates fail explicitly.

Only `applyCategoryChanges` writes: 1–5 distinct changed expenses with exact local full-record revisions, revalidated in the serialized atomic transaction. Only category is updated; balances, amounts, dates, accounts, notes, imports, scan locks and settlements are preserved. Stale/concurrent/invalid batches roll back. No schema migration; schema **4** remains current. No dependency added.

## 4. Cloud architecture and setup

Optional `bakibuddy/server/` uses Node’s built-in HTTP/fetch, fixed OpenAI Responses endpoint, strict JSON schema, checked output enums/IDs, no tools, store:false, default gpt-6-luna and at most800 output tokens. Cloud never provides authoritative money or freeform financial claims. OpenAI API keys live only in ignored `server/.env`; a distinct generated access token authenticates app requests. Request/body/output/time/concurrency/cache/hour/day attempt limits and explicit CORS apply. No automatic retry or payload/secret logging. Default bind is loopback; LAN HTTP requires two explicit environment settings. Nothing was deployed.

Setup generated a local random token and blank API key without printing secrets. README contains complete computer/iPhone setup. A provider key must be entered locally, never into chat or Expo public variables. Local limits are not monetary caps and reset with restart; configure provider project spending controls. store:false does not guarantee zero retention; the UI links the policy.

Verified official API references: [gpt-6-luna](https://developers.openai.com/api/docs/models/gpt-6-luna), [structured output](https://developers.openai.com/api/docs/guides/structured-outputs), [API key handling](https://developers.openai.com/api/reference/overview), [data controls](https://developers.openai.com/api/docs/guides/your-data). Documentation confirms the prepared request shape; it does not prove a live call succeeded.

## 5. Executed engineering checks

| Check | Result |
|---|---|
| TypeScript / ESLint | Passed after final session-cleanup change. |
| Unit / actual SQLite / server | **168 passed**:131 retained +26 assistant +11 server, after review fixes. |
| Expo dependency compatibility / peer check | Passed; no peer issues. |
| Frozen install | Passed. |
| Expo Doctor | **20/20 passed** using the documented pnpm package runner. Direct pnpm exec expo-doctor initially failed because it is not a local dependency; reran successfully through dlx. |
| Android/iOS/web export | Passed after session-cleanup changes: native Hermes bundles, SQLite web worker/WASM and 23 static routes. Not APK/IPA or native runtime. |
| Credential boundary | Ignored server/.env; configured local credential absent from all 102 exported files. No secret values printed. Variable names in UI setup help are expected. |
| Live OpenAI | **Not executed**; no key configured by this work. |
| Native assistant / networking | **Not executed** on this Windows host. |

Tests cover exact amount/date boundaries, empty/missing/inactive plans, all financial kinds, forecasts/rounding/overflow, deterministic facts, unsupported advice, category-only metadata preservation, stale/atomic rollback/concurrency, strict contracts, no-consent/no-auth/no-key behavior, CORS/URLs/body limits, fabricated IDs, refusal/incomplete output, timeout/abort, cache and attempt limits.

## 6. Browser and visual evidence

**31 assistant browser checks passed** on the final exported app, isolated fictional ledger and explicitly synthetic provider through the real HTTP companion. Page errors/external requests `[]`. Five examples, empty/invalid/unsupported questions, periods, offline local answers, consent cancellation, payload minimization, enum/fact-ID handling, malformed/failing/timed-out provider fallback, invalidated pending question, revoke, confirmation/back/save, unchanged balance and persistence are covered. Added actual in-flight cancellation, pending/in-flight category requests transitioning to stable confirmation, and repeated-merchant payment identity. Synthetic provider results are not live model evaluation.

141 original PNGs and 18 contact sheets in ignored `.impeccable/review/phase7/` and `bakibuddy/test-results/phase7/` cover 320/375/390/430/1440 widths plus 568×320 landscape, top/middle/bottom. Parent inspected all 17 initial sheets, the afford390 original and five final fix originals. Bounds assertions report no horizontal overflow. Retained browser suites passed45 ledger,52 budget,33 analytics,27 PDF import and 21 scan checks. The initial scan run timed out on the fictional overlap image after 13 checks with no page errors/external requests; failure evidence is preserved. A clean rerun on the final export passed all 21 without scan source changes. The isolated timeout is not claimed repaired.

Formal native review: **recapture**, stopped at evidence gate because zero iPhone/Android captures exist. It performed no craft/code review. The separate supplemental source/web audit inspected17 initial sheets,15 originals and relevant source; it returned fix for four P2 issues. One batch corrected sent-state cancellation text, category task-phase/revision abort/discard, current-balance scope and payment date/amount/account in final category confirmation, plus two cosmetic count strings. All viewports were recaptured. The same reviewer inspected current source/hashes, saved31-check results and targeted originals, and scored all four material fixes and both strings **resolved**. Its **ship** disposition covers those six scored fixes only; it cannot close the native gate or certify the entire surface. No detector runs against native StyleSheet code, no approved comp/new-world gate applies.

## 7. Design Trio and documentation

Intent/fortify/articulate informed explicit source/interpretation, minimal per-operation consent, readable assumptions, unselected editable categories and recovery. No user research invented. UI/UX Pro Max’s focused React Native guidance supplied loading indicators and feature error recovery; the actual RN 0.88 stack, inherited tokens and 48-unit targets remained authoritative. Impeccable extended the established Operate form/row composition without a palette/type/elevation change. Direction is in `.impeccable/surfaces/phase-7.md`.

The fresh independent documenter completed the ordinary-extension comparison against final source, current source hashes,141-capture manifest, saved31-check results and review evidence, with pixel inspection of nine originals plus contact 18. It updated DESIGN.md descriptive prose only; parent independently verified protected hashes: frontmatter 3848 bytes `9F7412B7832EBF598DBA44B23220F4CB775F7D8B5EC4918A3D22E60244B00C56`, sidecar `BFFAB879E352F4F9663F23F6F13296ECE9DBB48D5E478DB8E4AB0078BE929B9D`, tokens `7AA19E9DBABA8E3063CF6B69AA4B29051C83E84A92630DACB042F0DE3C9305ED`. Pre-existing sidecar Phase 2 narrative/availability drift is reported without repair. No new raster asset ships. Exact evidence: `.impeccable/review/phase7/document-comparison.md`.

The [installed Impeccable skill](C:/Users/USER/.agents/skills/impeccable/SKILL.md) routes finish work through its [new-work reference](C:/Users/USER/.agents/skills/impeccable/reference/new-work.md), which requires captures “on native, one per device class”. The reviewer’s evidence gate therefore leaves native finish approval open until actual iPhone/Android captures exist. This is an evidence requirement, not a new phase authorization request; browser evidence cannot satisfy it.

## 8. Exact run commands

From `bakibuddy/`:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm check:expo
pnpm peers check
pnpm --package=npm --package=expo-doctor dlx expo-doctor
pnpm exec expo export --platform all
node scripts/check-assistant-secrets.mjs
# Separate terminal: pnpm preview (serves dist on localhost:8082)
$env:BAKIBUDDY_URL='http://localhost:8082'
pnpm test:assistant:web
pnpm test:web
pnpm test:budget:web
pnpm test:analytics:web
pnpm test:import:web
pnpm test:scan:web
pnpm ai:setup
# Edit server/.env locally; never paste key/token into chat.
pnpm ai:server
pnpm start
```

Stop Metro before exporting on this host to avoid shared file-map cache interference. The first export recovered from a corrupt cache crawl warning while an older Metro was still running; the confirmed old Expo process was stopped and export succeeded. Subsequent final export succeeded. Browser tests remove only their own validated temporary profiles and never touch the user’s ordinary/native ledger.

Final Metro is running at `exp://LAN_HOST:8081`; LAN manifest HTTP 200 confirms version 0.7.0/SDK 58.0.0 and the iOS development bundle returns HTTP 200 (9,486,981 bytes). The optional companion runs on 127.0.0.1:8787; authenticated health HTTP 200 reports ready:false/OpenAI/gpt-6-luna, without a provider call. These are local server/bundle checks, not physical-phone or live-model evidence.

## 9. Manual checklist and limitations

On iPhone/Android, reopen0.7.0 in SDK 58 Expo Go. Ask each example locally, check exact facts/scope against Budget/Insights, try invalid/unsupported/empty records and airplane mode after loading. Review a deliberately selected Other expense, cancel first, then confirm a known category change and verify the balance stays identical after restart.

If configuring cloud locally, enter the separate token and reachable companion address, inspect/cancel each preview before any approved send, then check a consented live interpretation/insight/category request. Test unavailable/wrong-token/network/timeout/cancellation behavior; local facts remain. Verify route/background credential clearing, including leaving via native back gesture. A private HTTP development connection may be blocked by native networking policy; verify on the actual Expo Go device or use a secured HTTPS endpoint. No iOS ATS/networking success is claimed.

Capture native small/large iPhone and Android states: initial/local facts, empty/invalid, connection/consent, loading/cancel/failure, reviewed categories/confirmation/success; include keyboard, large text, landscape, notch/home/gesture areas, VoiceOver/TalkBack focus and navigation. Prior OCR/PDF/native save gates remain open. No API key/live-model result, native screenshot or Android observation is fabricated.

This is a bounded local assistant and controlled structured cloud integration, not arbitrary chat, investment/tax/credit advice, production hosted backend, cloud sync, backup/export, encryption guarantee, notifications or distribution.

## 10. Review gate

Phase 7 is complete at its implemented/automated/supplemental source-web scope; review the remaining manual/live-provider/native evidence before treating it as device/provider accepted. Phase 8 requires explicit human approval. Nothing was published, deployed, remotely pushed or submitted to a store.

PHASE 7 COMPLETE — WAITING FOR USER REVIEW.
