# Phase 7 follow-up — Groq

Authorized by **“ok then use Groq”**, 28 October 2026. Version **0.7.1** replaces the optional OpenAI integration with Groq; Phase 8 remains unapproved.

## What changed

- Server uses the fixed Groq Chat Completions endpoint, default `openai/gpt-oss-20b`, strict JSON schema and low reasoning with at most 1,500 completion tokens. The model is hosted by Groq; no OpenAI key/account is used. Tools are explicitly disabled. Only one completed assistant JSON choice can pass the existing fact/category/intent validators. Reasoning, refusals, tool calls, truncated content, extra facts and multiple choices are rejected.
- `GROQ_API_KEY` and optional `GROQ_MODEL` stay in ignored `bakibuddy/server/.env`. Setup preserves existing credentials/token and adds only missing Groq settings. Legacy OpenAI variables are unused; no values were printed or deleted. Client token fields reject provider keys. Export scanning includes both current and legacy credentials.
- Consent is now `2026-10-groq-v1`. Old provider consent cannot authorize a Groq request; restart the companion and reopen the app. The visible destination and policy now name Groq, explain free quotas/paid-plan costs and state the retention exceptions. Every request still requires its own data preview and approval.
- Groq quota errors return a recoverable limit response without retrying. Local answers, deterministic money, category-only atomic confirmation, schema 4 and all financial records remain unchanged.
- Expo’s compatibility check newly recommended patches: Expo 58.0.20, FileSystem 58.0.12 and Router 58.0.27. Applied these within SDK 58; RN 0.88/React 19.3 remain. Expo’s self-relaunch failed because this host lacks npx; completed the two remaining explicit packages through pnpm. pnpm recorded exact-version release-age exceptions for the selected Expo patches/transitives; build-script permissions remain disabled. No new AI SDK or dependency was added.

## Setup

1. Create a key in the [Groq Console](https://console.groq.com/keys). Keep the account on the **Free Plan** for free quotas; the app cannot control a provider account’s billing tier.
2. From `bakibuddy/`, run `pnpm ai:setup`, then edit `server/.env` locally. Set `GROQ_API_KEY=your-key` and keep the separate `AI_SERVER_TOKEN`. Never paste either secret into chat.
3. Run `pnpm ai:server`. Restart after changing the environment file. For a phone on a trusted private network, explicitly set `AI_HOST=0.0.0.0` and `AI_ALLOW_LAN_HTTP=true`, and use the computer’s current private IPv4 address with port 8787. HTTP is unencrypted. These LAN settings were configured during the later user setup; no firewall settings were changed automatically. The user-reported iPhone result is recorded below; Android and the remaining native checklist are open.
4. In BakiBuddy 0.7.1, open Ask about your money → Optional cloud help → Set up cloud. Enter the companion URL and **AI_SERVER_TOKEN**, not the Groq key. Inspect the Groq destination/data preview before Send this request. Cancel before sending makes no provider request.

Current API/plan/privacy sources checked: [API reference](https://console.groq.com/docs/api-reference), [strict structured output](https://console.groq.com/docs/structured-outputs), [free-plan quotas](https://console.groq.com/docs/rate-limits), [data controls](https://console.groq.com/docs/your-data). Free quotas are bounded and can change; no unlimited-free or zero-retention promise is made.

## Verification

TypeScript, lint and **175 unit/actual-SQL/server/setup tests pass**. New checks cover the Groq wire format/tool prohibition, prior-provider consent rejection, quota handling, malformed/truncated/refused/tool/multiple-choice responses, no-display reasoning, supported models, separate credentials and actual setup creation/migration/idempotency. Existing financial tests pass.

Expo compatibility and peer checks pass; Doctor **20/20**. Final cache-cleared Android/iOS Hermes and web exports pass with 23 static routes, using Router 58.0.27. The first post-install export retained the prior resolver path, so it was rebuilt with `--clear` before browser verification. All102 export files were checked: configured current/legacy credentials are absent, and the environment file is ignored.

**34 assistant browser checks pass**, errors/external requests `[]`, using synthetic Groq responses and an isolated fictional ledger.144 top/middle/bottom PNGs cover320/375/390/430/1440 widths and 568×320 landscape. Verified provider/policy/plan disclosure, key rejection, no-send cancellation, exact payload boundaries, quota/invalid/timeout fallback, confirmation transitions and category-only persistence. Sampled seven originals for the updated 320/390/1440 consent, setup/error, waiting and quota states; no clipped labels or horizontal overflow observed. This is a self source/render check, not a new independent or native finish verdict.

Retained ledger/budget/analytics/PDF suites pass 45/52/33/27 checks. **The full OCR browser regression did not pass**: the first run timed out on the overlap image after 13 checks; an isolated rerun timed out on the repeat-image check after six. Both failures had empty page-error/external-request arrays and are preserved under `.impeccable/review/phase7-groq/initial-scan-regression/` and `second-scan-regression/`. A separate instrumented probe successfully read/discarded the same fictional receipt three times with the real local engine. This confirms that basic repeated OCR still runs, not that the suite’s intermittent timeout is fixed. No scanner source, timeout limit or financial assertion was changed. Treat this as an unresolved supplemental-web regression; native OCR acceptance remains manual.

During initial migration verification, the real companion’s authenticated health check returned HTTP 200, provider Groq/model openai/gpt-oss-20b, ready:false, and old provider consent returned400. No live Groq request was made at that stage. The unconfigured companion was stopped so the user could add a key and start it from their own terminal. The later user setup and result below supersede that configuration status while preserving the original evidence.

### User-reported iPhone result — 28 October 2026

The user supplied screenshots of the native cloud setup and answered **“Finished successfully”** when asked whether the Groq request finished or showed an error. Record one successful consented live request on the user's physical iPhone as user-reported evidence. There is no independent provider trace or acceptance claim for all assistant operations, native states, category saves or Android. The formal native finish review remains recapture and the unresolved OCR browser regression is unchanged.

Setup support configured the explicit private-LAN host/opt-in settings and distinguished the server-only Groq key from the separate phone access token. The user was instructed to revoke an exposed provider key in the Groq console and enter a replacement locally; provider-side revocation was not independently verified. After a companion token was subsequently pasted into chat and the test was complete, regenerated that token locally without displaying it, preserved all other environment settings and restarted the verified companion. Authenticated health returned HTTP 200, ready:true, provider Groq/model `openai/gpt-oss-20b`; unauthenticated health returned 401. No agent-initiated provider request accompanied these health checks. The phone needs the replacement token for its next cloud session. No credentials or financial content were copied into this report.

Expo had stopped during user setup. Restarted with `pnpm exec expo start --lan --port 8081 --max-workers 2`; the iOS manifest returned HTTP 200/version 0.7.1/SDK 58.0.0 and the development bundle returned HTTP 200/9,487,430 bytes. These are host checks, recorded separately from the user-reported phone result. This continuation changes only private configuration and documentation; prior automated-suite results were not rerun or claimed as new passes.

## Design and scope

Final Metro runs at `exp://LAN_HOST:8081` with two workers. Manifest HTTP 200 confirms version 0.7.1/SDK 58.0.0; iOS development bundle HTTP 200, **9,487,430 bytes**. The first busy startup did not answer manifest probes promptly; it was stopped and restarted after browser cleanup with `--max-workers 2`. A corrupt file-map cache was reported and rebuilt. The final native bundle probe succeeded; this is host/bundle evidence, not physical iPhone acceptance.

Commands from `bakibuddy/`: `pnpm ai:setup`, `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm check:expo`, `pnpm peers check`, `pnpm --package=npm --package=expo-doctor dlx expo-doctor`, `pnpm exec expo export --clear --platform all`, `node scripts/check-assistant-secrets.mjs`, `pnpm test:assistant:web`, and the five retained browser scripts with `BAKIBUDDY_URL=http://localhost:8082`. `pnpm preview` serves the static export. Start phone development with `pnpm exec expo start --lan --port 8081 --max-workers 2`. The retained scan command is explicitly a failed check, not included among passing results.

This is a small provider/copy refinement. Design Trio reused the existing experience contract; Articulate/Impeccable clarify guidance shaped truthful plan, destination, key and retention wording. UI/UX Pro Max’s focused RN error-recovery result reinforced the existing feature-boundary/local fallback. No new visual system, tokens or layout was introduced. DESIGN.md changed only current descriptive provider prose; the normative frontmatter/sidecar/tokens remain protected. No fresh independent finish verdict is claimed for this follow-up; source/browser evidence and the previous review’s scope are kept separate.

Groq integration is complete at the implemented/automated/supplemental browser scope, with one user-reported successful live iPhone request. Remaining assistant/native checks and the unresolved OCR browser regression remain explicit review items. No deployment, publishing, remote push, store build or Phase 8 work.

PHASE 7 COMPLETE — WAITING FOR USER REVIEW.
