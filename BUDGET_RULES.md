# BakiBuddy budget calculations

## Recorded money and plans

The ledger is the source of current funds: opening balances plus recorded income, refunds, expenses and transfers. Plans never insert transactions or add money. Every account is included; a reserve protects money within that total and does not transfer it to another account.

An income cycle is a date-only interval **[start, end)** in Asia/Kuala_Lumpur. Today is included; the next income/review date is excluded. Payments on that end date belong to the next cycle. Weekly cycles advance by seven days. Monthly cycles retain their original payday anchor: January 31 → February 28/29 → March 31. The first cycle can be shorter. Custom and irregular cycles require explicit dates, have a maximum length of 366 days, and stop showing an allowance when expired. An irregular-income review date does not imply a guaranteed deposit.

## Today's allowance

All arithmetic is exact integer sen, accumulated with BigInt and checked before conversion to safe JavaScript integers.

```text
B = combined recorded account balance
U = unpaid bill occurrences due before cycle end, including overdue bills
R = savings reserve
E = gross recorded expenses dated in the active cycle through today
L = optional total cycle spending limit
D = whole calendar days from today to the exclusive end date

Funds after commitments = B − U − R
Funds available = max(0, B − U − R)
Cap remaining = max(0, L − E − U), when a cap is set
Available extra spending = min(Funds available, Cap remaining), or Funds available without a cap
Daily allowance = floor(Available extra spending / D)
Unallocated rounding remainder = Available extra spending − Daily allowance × D
Protected-funds shortfall = max(0, U + R − B)
```

An expired/future plan has no usable daily allowance. A zero spending limit intentionally permits no extra spending; a blank limit means no cap. The cap includes bills, so recording and linking a bill replaces a pending obligation with an actual expense without opening up extra cap room. Refunds increase the real balance but do not reverse gross expenses for the cap. Tracked-account transfers change neither combined money nor spending. Income already recorded is already in B and is never added again.

## Conditional forecasts

```text
I = unlinked expected-income occurrences from today through the exclusive end date
Forecast before extra spending = B − U + I
Forecast after full allowance = B − U + I − Available extra spending
```

Expected income affects these forecasts only. It never increases today's allowance until an actual income record exists. Overdue unreceived income is disclosed and excluded. Forecasts assume listed payments happen; they do not infer daily consumption or expenses the user has not entered. Savings remain in the actual forecast balance.

Chronological cash flow starts from B and processes pending bills and eligible expected income by date. Bills are processed before income on the same day because deposit timing is uncertain. The lowest projected balance produces a timing shortfall, even if the final forecast is positive. The same process checks individual payment accounts and warns when funds may need to be transferred. The global allowance is not proof that every individual account can fund every bill.

## Occurrences and payment links

- A scheduled item is one-time, weekly or monthly, with a name, amount, account and bill category. The first due date anchors recurrence. Start from the first occurrence still needing tracking; earlier unpaid occurrences otherwise remain overdue.
- One real transaction can settle one occurrence. Type, full amount and account must match. The actual transaction date can differ from its due date for early/late payments.
- **Record payment now** saves the actual transaction and its occurrence link in one atomic write. **Link selected transaction** uses a record already in the ledger and creates no new transaction. These are confirmations of recorded activity, not bank payments.
- A link removes that occurrence from unpaid bills or expected income. Identifiers, uniqueness and a serialized queue prevent two submissions settling it twice. Failure rolls back both a new record and its link.
- Amount/type/account edits to a linked transaction are blocked. Unlink first to change them. Renaming and notes remain editable. A linked schedule's financial fields are likewise protected; name/category remain editable.
- Deleting an actual transaction removes its link and makes the occurrence pending again. Unlinking keeps the transaction but restores the pending obligation/expectation. Both routes are explicit. Deleting a schedule removes its occurrences/links and keeps actual transactions. Removing a budget plan keeps schedules and the ledger.
- Partial payments, one record split across multiple bills, end dates for recurring series and automatic bank matching are not supported in this phase. For a variable bill, update the expected full amount before linking; unlink affected records before changing an existing settled series.

## Reconciliation example

These are optional test values, not seeded app data. Use a weekly cycle with seven days remaining:

| Action/state | Recorded funds | Unpaid bills | Reserve | Available extra spending | Daily allowance |
|---|---:|---:|---:|---:|---:|
| Opening funds RM1,000; bill RM200; reserve RM100; no cap | RM1,000 | RM200 | RM100 | RM700 | RM100.00 |
| Add expected income RM500 before the end | RM1,000 | RM200 | RM100 | RM700 | RM100.00 |
| Set cycle cap RM500 | RM1,000 | RM200 | RM100 | RM300 | RM42.85 |
| Record and link bill RM200 | RM800 | RM0 | RM100 | RM300 | RM42.85 |

Expected income gives a conditional pre-spending forecast of RM1,300 both before and after the bill is recorded. The RM300 capped allowance leaves five sen unallocated when divided across seven days. Dates and new expenses change the daily amount; this example assumes the same day throughout.

## Evidence and limits

No bank balance, income arrival or ability to afford an unentered obligation is guaranteed. Actual test results and unavailable native-phone checks belong to PHASE_3_REPORT.md and PROGRESS.md. The app remains local, with no cloud sync, notifications, export/backup, import, OCR or AI in this phase.
