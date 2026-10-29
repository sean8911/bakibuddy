# Assistant contract — Phase 7

## Authority and scope

`bakibuddy/src/assistant/` interprets questions and presents facts from the existing exact ledger, budget and analytics engines. MYR integer sen and Kuala Lumpur financial dates remain authoritative. Model output never supplies money, dates, transactions, causes or freeform financial advice. The real ledger starts empty; all development examples use separate fictional records.

Supported local tasks: recorded overview/spending, an individual payment today, equal-length weekly changes, the user-entered savings reserve, category spending, and a scheduled forecast through strictly next Friday, seven days ahead or the current cycle’s final included day. English and a small set of Malay keywords are supported; this is a bounded interpreter, not arbitrary conversation. Unsupported questions explain that scope. Investment, tax and credit advice stays unsupported even if cloud interpretation tries to relabel it.

## Exact facts

- Spending uses inclusive analytics ranges. Gross expenses, income and refunds stay separate; transfers/opening balances do not create period spending or income. Daily averages round down to whole sen across all days.
- Affordability compares one explicitly parsed amount with today’s protected plan allowance. Missing/upcoming/expired plans cannot affirm affordability. It does not subtract all today’s earlier spending again from a plan already recomputed from records, reserve funds or create a payment.
- Weekly changes compare the latest seven days with the preceding seven days. Category deltas describe records, not why the user acted. Missing records/baselines remain explicit.
- Savings reports the chosen reserve, commitments and available amount. It invents no savings target or percentage. Category spending has no category-specific limit unless a future approved feature adds one; the total cycle cap is identified separately.
- Forecasts are conditional balances before extra discretionary spending, not safe-to-spend amounts. Include unpaid bills through the target (including overdue bills), expected income from today through the target, and exclude already linked occurrences and missed earlier income. A reserve remains within the balance. The target is inclusive; the recurrence engine uses an exclusive following-day bound. Reject horizons beyond 366 days and unsafe aggregates. Never create future transactions.
- Facts disclose source/scope and assumptions. Changes to records or KL date invalidate a displayed answer. Financial errors keep the previous result and a recoverable message; stale financial facts are hidden until refreshed.

## Optional cloud boundary

No default network request, cloud login or mobile API key. `AssistantCloud` holds a companion origin and a separate access token only in memory. Clear/revoke, navigation blur/unmount and backgrounding abort active work and clear the connection, pending consent and unapplied cloud suggestions. Local calculations remain available. Cancelling an already-sent request cannot guarantee that provider processing or charges stop.

Each operation has a visible data preview and an explicit **Send this request** action. **Cancel without sending** makes no request. Changes to the source/question invalidate pending consent and discard stale results. No remembered blanket consent and no silent retries.

| Operation | Data sent | Accepted output |
|---|---|---|
| Interpret question | Up to 400 question characters and selected period | Checked intent, period, category and horizon enums |
| Select insights | Question and at most 24 locally verified `{id,text}` facts | Only identifiers from those facts |
| Suggest categories | At most five merchant names (80 characters each) with temporary r1–r5 labels | Exactly those labels, known category and reason enums |

Amounts/dates/accounts/notes/raw imports/images/transaction UUIDs are absent from category requests. Insight facts may contain financial totals, which the preview explicitly displays. The user’s question itself may contain personal information: review it before sending. All user text is treated as data, not system instructions. Extra fields, invented IDs, refusals, malformed/incomplete/oversized responses are rejected. All facts and assumptions remain available when cloud selects a subset to put first.

HTTPS is required for remote origins; HTTP is allowed only for literal private IPv4/loopback or localhost development hosts and carries an unencrypted-network notice. Origins cannot contain credentials, paths, queries or fragments. Redirects are rejected.

## Server and cost limits

`bakibuddy/server/` is an optional local Node companion, not a deployed backend. The user selected **Groq** on 28 October 2026. Keep `GROQ_API_KEY` in ignored `server/.env`; never use `EXPO_PUBLIC_*`. A separate random `AI_SERVER_TOKEN` authenticates client requests. Setup creates a token without printing it; for existing files it preserves all values and only appends missing Groq variables. Legacy OpenAI variables are unused. Native requests with no Origin still require the token; web CORS is an explicit origin allowlist. Reject provider keys in the client token field. Consent version `2026-10-groq-v1` prevents prior-provider consent from authorizing Groq requests.

The server calls the fixed Groq Chat Completions endpoint `https://api.groq.com/openai/v1/chat/completions`, with strict JSON schema, tools disabled, no streaming/history, default `openai/gpt-oss-20b`, low reasoning and at most 1,500 completion tokens. Only the two supported GPT-OSS model IDs are allowed. This is an open-weight model hosted by Groq, not an OpenAI API call. A single completed assistant JSON choice must pass local validation; truncated/refused/tool/freeform/unknown output is rejected, and reasoning is never displayed. Groq normally does not retain inference content, but reliability/abuse logs may be kept up to 30 days or longer when legally required. Data Controls may change retention. No unsupported `store` parameter or zero-retention guarantee is used.

Request body ≤20 KB; provider response ≤100 KB; one active upstream call; 22-second upstream timeout and 25-second client timeout; no automatic retries. At most 30 attempted upstream calls per UTC hour and 100 per UTC day, including failed attempts. Exact request results have a two-minute in-memory cache capped at 50 entries, with no disk history. Restart clears the cache and local counters. These are development guardrails, not a currency spending cap or production multi-user authentication. Configure provider account/project spending controls separately. Default bind is loopback; LAN HTTP requires explicit host and opt-in flags. No body/secret logging. Never deploy this companion without a separately approved production design/security review.

## Reviewed category writes

Only expenses currently in Other are offered, five at a time. Consistent exact normalized-name history precedes conservative name hints; conflicting history remains unclear. Local/AI suggestions start unselected. The user can change a proposed category, include individual rows and inspect a final confirmation. Moving pages explicitly discards unsaved page selections.

`applyCategoryChanges` rechecks 1–5 distinct expenses, valid changed categories and a full local record revision inside the serialized atomic write. Stale/concurrent/deleted records reject the whole batch. Only the category column changes; amounts, dates, accounts, descriptions, source identities, settlements and budget definitions are preserved. No schema migration is needed; schema 4 remains current.

## Evidence boundary

Synthetic provider tests exercise the real HTTP/validation/consent plumbing without contacting Groq. They are not a live model evaluation. Groq Free Plan quotas return a recoverable limit error, with no automatic retry; local answers remain. Stay on the Free Plan for free quotas; paid-account costs are outside the local app’s control. Browser captures test React Native Web and do not establish iOS/Android networking, safe areas, text scaling, gestures, assistive technology or device acceptance. See PHASE_7_GROQ_UPDATE.md for current checks and PHASE_7_REPORT.md for the original phase record/manual gates.
