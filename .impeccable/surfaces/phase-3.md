# BakiBuddy budget planning

Mode: Operate. Phase 3 approved by continue phase 3. Inherit the Daily Planner identity, tokens, native tabs and ledger.

Intent: plan from recorded funds until the next income/review date. Expected income stays outside today’s allowance. Deduct unpaid/overdue bills and savings first. Explicitly link full real payments to occurrences; never infer or create money silently. Cover empty, insufficient funds, expired custom plans, overdue income, duplicate links and errors.

UI/UX Pro Max: React Native query returned appropriate keyboards and press feedback. Reuse existing fields, native dates, 48-unit targets and keyboard avoidance.

Financial contract: exact integer sen/BigInt, half-open cycles [start,end), today included. Monthly schedules clamp from their original anchor without drift. Weekly/monthly cycles roll; custom/irregular dates expire. Spending caps include recorded gross expenses and pending bills; refunds remain separate. Expected income is conditional forecast only. One occurrence links to one actual transaction; reconcile atomically.

Review source and supplemental web previews independently. Native runtime unverified without hardware. No new visual world or approved comp. Native source skips the web detector. Document this phase and stop before Phase 4.
