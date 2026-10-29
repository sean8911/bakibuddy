# Phase 7 — financial assistant

Authorized by “now phase 7”. Preserve SDK 58/RN 0.88/React 19.3, local SQLite schema 4, existing financial engines, tokens and import/OCR behavior. Phase 8/distribution and the earlier missing native screenshot gates remain separate.

## Experience

Ask a question about recorded spending, weekly changes, today's allowance, savings reserve or a bounded scheduled forecast. Show the interpretation, date scope, exact verified facts and assumptions. Local answers are immediately available without login/network. Unsupported questions explain the supported scope instead of inventing an answer. A cloud option offers question interpretation and selection of already-calculated insights; no arbitrary model-written financial text is displayed.

Review expense categories separately. Local history/name hints are useful offline; optional AI suggestions use merchant names only, not amounts, dates, accounts, notes, raw imports or images. Every suggested category remains editable/unselected until reviewed, and only explicit confirmation changes stored categories. Stale records and concurrent changes must be rejected atomically.

Cloud connection details are session-only. Before every operation show the precise question/facts or merchant-name payload, destination server, OpenAI provider and retention note; cancel sends nothing. Revoke/clear cancels active work and clears temporary credentials/results. Loading, cancellation, timeouts, quota/refusal/malformed output and unavailable-server states retain the local result. No basic-app login is introduced.

## Engineering

Reuse the deterministic budget/analytics/calendar/money functions. A small pure assistant module interprets common English/Malay keywords and builds fact cards; it does not mutate records. Forecasts include only explicitly entered unpaid bills/expected income and label no-extra-spending assumptions; missed expected income is not guaranteed. Never choose a savings percentage without a user goal.

Use a local Node companion server, with no new web framework or mobile AI SDK. OpenAI Responses API structured output is the default prepared integration; default model `gpt-6-luna`, configurable on the server. All keys stay outside Expo's bundle in ignored `server/.env`. A separate random server access token is entered into the client for the session. Require HTTPS for remote servers and restrict HTTP to private development hosts. No publishing/deployment is authorized.

Server boundaries: authentication, explicit-consent envelope/version, strict input/output validators, fixed provider endpoint/model, no tools, `store:false`, bounded request/response/output tokens, timeout/abort, one concurrent upstream request, in-memory short cache and hourly/daily attempt limits. Do not log request bodies or secrets. These development limits do not replace provider account spend controls or a future production authentication review.

Cloud operations return only checked intent/scope enums, known verified-fact IDs, or row-key/category enums. Freeform model claims/numbers are rejected. Financial figures are calculated and formatted on-device. No external AI request involving user financial data is authorized merely by phase approval; the in-app operation consent remains mandatory.

## Design Trio

Intent/fortify/articulate: transparent interpretation and source scope, exact data preview, truthful fallback, editable suggestions, meaningful empty/stale/error states. Reuse the established brief and its instruction to choose sensible defaults.

UI/UX Pro Max's focused RN search returned loading indicators and feature-boundary recovery. Apply these proportionally to RN 0.88 with existing controls; keep all targets at least 48 logical units. No palette or new system is generated.

Impeccable: extend the incumbent Operate form/row language for assistant and category review. No new world/comp/tokens. Inspect browser renders, preserve native evidence limits, use fresh scoped finish review and documentation comparison, and keep missing native capture gates explicit.

## Verification

Unit/actual-SQL: question/amount/date boundaries, exact forecasts/comparisons, refunds/transfers, missing/inactive plans, incomplete records, safe integer overflow, category revision/rollback/concurrency and metadata preservation. Server/transport: no consent/no auth/no key, body limits, CORS, private/HTTPS URLs, prompt injection, fabricated IDs/invalid schemas/refusals/incomplete results, timeout/abort/cache/rate limits and no secrets in the mobile build. Live provider verification requires a configured API key; use clearly identified synthetic upstream fixtures otherwise.

Browser: all core question types, category review/apply/cancel/stale handling, exact consent payload/cancel/no-default-network, unavailable/malformed/timed-out cloud fallback, scope refresh, narrow/wide/landscape and reload/offline. Run typecheck, lint, all relevant/retained tests, Expo/peer/Doctor and all-platform exports. Report actual live-provider and native-device evidence separately.
