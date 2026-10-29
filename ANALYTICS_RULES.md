# BakiBuddy analytics rules

## Source and scope

Insights reads the current local ledger snapshot. It creates no transaction, changes no balance and needs no database migration beyond the existing schema 2. Opening balances, planned bills and expected income do not enter historical cash-flow charts. Historical demo fixtures are never imported by production analytics.

Dates use Asia/Kuala_Lumpur calendar days. Analytics ranges include **both endpoints**: start ≤ record date ≤ end. This differs deliberately from the budget engine's [start, end) cycle. Ranges can be one through 366 days, start no earlier than 1900, and end no later than today.

- This month: first calendar day through today.
- Last 7 days: today and the six preceding days.
- Last 30 days: today and the 29 preceding days.
- Custom dates: explicitly apply valid start/end dates. Invalid drafts keep the prior applied data and input for correction.

Account selection applies to the historical totals, categories, charts and comparison. A tracked-account transfer appears in the excluded-transfer count for either endpoint account but never becomes income or an expense. The current-cycle budget section separately includes **all accounts** and says so alongside its dates.

## Exact amounts

```text
Income = sum(recorded income amounts)
Expenses = sum(recorded expense amounts)
Refunds = sum(recorded refund amounts)
Net recorded flow = Income + Refunds − Expenses
Average expense per calendar day = floor(Expenses / inclusive day count)
```

Amounts are integer sen. BigInt accumulators and safe-range checks run before display. An unsafe aggregate reports an error; charts must not silently round it into a financial value. Chart coordinates may use ordinary display geometry, but no chart-library calculation feeds financial totals, labels, budgets or storage.

Net flow is a change represented by the selected records, not an account balance, available-spending figure or bank statement. Refunds increase this flow but remain separate from new income and gross spending. There is no linked-refund matching in this phase, so a refund never silently reverses a category or resets a spending cap.

## Spending buckets and categories

Daily buckets are calendar days. Weekly buckets start Monday. Monthly buckets are calendar months. A range clips the first/last weekly or monthly bucket; no amount outside the selected dates enters that partial bucket. Every in-range calendar interval exists, including zero buckets. Bucket totals reconcile to the range's totals at every grouping.

The spending chart displays up to seven buckets per page, initially the most recent page. Earlier/later actions expose the rest. The dates, current position and total bucket count stay visible. Show chart values exposes exact readable amounts for that same page. Zero bars mean **no recorded expenses**, not proof that no spending happened. Grouping and range changes do not manufacture or interpolate missing activity. Bars use the library only for drawing and have no hover-only information or animation.

Category distributions use gross expenses only. Exact category amounts sum to Expenses. Categories rank by amount, with category ID resolving equal-value ties. Shares allocate 10,000 basis points by largest remainder: floor each exact share, then distribute remaining points by descending fractional remainder and category-ID tie order. Thus displayed two-decimal shares add to **100.00%** even for one-sen splits. Color reinforces explicit category names, amounts and percentages.

## Descriptive comparisons

The comparison range is the immediately preceding period with the same inclusive day count. It uses the same account selection. A 1–27 October range therefore compares against 4–30 September, rather than a full prior month.

```text
Difference = current recorded Expenses − previous recorded Expenses
Percentage change = Difference / previous Expenses × 100
```

Percentages use BigInt ratio arithmetic and round to one decimal for display. A zero prior-expense total has no defined percentage change; the interface explains that instead of showing infinity or assuming a trend. With no current expenses it shows the corresponding no-current-expense state. No statistically meaningful behavioral trend, complete history, AI inference or spending prediction is claimed.

## Budget utilization

Current budget usage reuses the Phase 3 calculation and its active cycle, independently of historical filters:

```text
Used or committed = current-cycle gross recorded expenses + unpaid bills before cycle end
Remaining cap = max(0, cap − Used or committed)
Over cap = max(0, Used or committed − cap)
Utilization = Used or committed / cap × 100, when cap > 0
```

A paid and linked bill replaces its pending commitment with a recorded expense without double-counting. The graphic stops at 100%, while the actual percentage and over-cap amount remain explicit. A zero cap has a separate explanation without division; a missing cap or plan offers setup; an expired custom/irregular plan asks for updated dates. This percentage is cap usage, not proof that funds are available or a savings success score.

## Library decision

On 27 October 2026, the maintained [Gifted Charts repository](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts#installation) and current npm package metadata were checked alongside Victory Native's current package/dependency requirements and [implementation](https://github.com/FormidableLabs/victory-native-xl). Gifted Charts 1.4.81 was selected for the basic bar charts and its documented Expo installation path. This is an integration choice, not a measured library benchmark.

[Expo SDK 57's SVG guidance](https://docs.expo.dev/versions/v57.0.0/sdk/svg/) and the installed SDK's bundled-native-module map specify react-native-svg 15.15.4. Expo selected expo-linear-gradient 57.0.2. These native dependencies were installed through Expo compatibility resolution. The app uses no decorative gradients; LinearGradient is a chart-library dependency. Existing typography, colors and spacing remain authoritative. No Skia renderer, backend or external analytics service was introduced.

The three direct additions and their lockfile are retained. Native bundle exports and browser rendering are distinct from physical Android/iPhone verification. Exact executed checks and remaining device work are in PHASE_4_REPORT.md and PROGRESS.md.
