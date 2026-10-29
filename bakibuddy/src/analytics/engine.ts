import type {
  LedgerSnapshot,
  TransactionInput,
  CategoryId,
} from "../types/finance.ts";
import { CATEGORY_IDS } from "../types/finance.ts";
import { addDays, dayNumber } from "../budget/calendar.ts";
import { calculateBudget } from "../budget/engine.ts";
import { LedgerError, safeSen } from "../utils/validation.ts";

export interface DateRange {
  start: string;
  end: string;
}
export type RangePreset = "month" | "seven" | "thirty" | "custom";
export type Granularity = "day" | "week" | "month";
export interface PeriodTotals {
  incomeSen: number;
  expenseSen: number;
  refundSen: number;
  netFlowSen: number;
  count: number;
  expenseCount: number;
  transferCount: number;
}
export interface AnalyticsBucket extends DateRange, PeriodTotals {}
export interface CategoryTotal {
  category: CategoryId;
  amountSen: number;
  count: number;
  shareBasisPoints: number;
}

export function presetRange(
  preset: Exclude<RangePreset, "custom">,
  today: string,
): DateRange {
  dayNumber(today);
  return {
    start:
      preset === "month"
        ? `${today.slice(0, 7)}-01`
        : addDays(today, preset === "seven" ? -6 : -29),
    end: today,
  };
}
export function validateRange(range: DateRange, today: string): DateRange {
  try {
    dayNumber(range.start);
    dayNumber(range.end);
    dayNumber(today);
  } catch {
    throw new LedgerError("Choose valid start and end dates.");
  }
  if (
    range.start < "1900-01-01" ||
    range.end > today ||
    range.start > range.end
  )
    throw new LedgerError(
      "Use dates from 1900 through today, with the start on or before the end.",
    );
  if (dayNumber(range.end) - dayNumber(range.start) >= 366)
    throw new LedgerError("Choose a range of 366 days or fewer.");
  return { ...range };
}

function totals(records: readonly TransactionInput[]): PeriodTotals {
  let income = 0n,
    expense = 0n,
    refund = 0n,
    expenseCount = 0,
    transferCount = 0;
  for (const record of records) {
    if (record.kind === "income") income += BigInt(record.amountSen);
    if (record.kind === "expense") {
      expense += BigInt(record.amountSen);
      expenseCount++;
    }
    if (record.kind === "refund") refund += BigInt(record.amountSen);
    if (record.kind === "transfer") transferCount++;
  }
  return {
    incomeSen: safeSen(income),
    expenseSen: safeSen(expense),
    refundSen: safeSen(refund),
    netFlowSen: safeSen(income + refund - expense),
    count: records.length,
    expenseCount,
    transferCount,
  };
}

function bucketStart(date: string, granularity: Granularity): string {
  if (granularity === "day") return date;
  if (granularity === "month") return `${date.slice(0, 7)}-01`;
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  return addDays(date, -((weekday + 6) % 7)); // Monday, independent of host timezone.
}
function nextBucket(start: string, granularity: Granularity) {
  if (granularity !== "month")
    return addDays(start, granularity === "day" ? 1 : 7);
  const [year, month] = start.split("-").map(Number);
  return new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
}
function buckets(
  records: readonly TransactionInput[],
  range: DateRange,
  granularity: Granularity,
): AnalyticsBucket[] {
  const grouped = new Map<string, TransactionInput[]>();
  const startsByDate = new Map<string, string>();
  for (const record of records) {
    // Many records share a day; validate/convert its calendar boundary only once.
    let key = startsByDate.get(record.date);
    if (key === undefined) {
      key = bucketStart(record.date, granularity);
      startsByDate.set(record.date, key);
    }
    const group = grouped.get(key) ?? [];
    group.push(record);
    grouped.set(key, group);
  }
  const result: AnalyticsBucket[] = [];
  for (
    let start = bucketStart(range.start, granularity);
    start <= range.end;
    start = nextBucket(start, granularity)
  ) {
    const end = addDays(nextBucket(start, granularity), -1);
    result.push({
      start: start < range.start ? range.start : start,
      end: end > range.end ? range.end : end,
      ...totals(grouped.get(start) ?? []),
    });
  }
  return result;
}

/** Largest-remainder allocation makes category labels add to exactly 100.00%. */
function categoryTotals(
  records: readonly TransactionInput[],
  totalExpense: number,
): CategoryTotal[] {
  if (!totalExpense) return [];
  const sums = new Map<CategoryId, { amount: bigint; count: number }>();
  for (const record of records) {
    if (record.kind !== "expense") continue;
    const item = sums.get(record.category) ?? { amount: 0n, count: 0 };
    item.amount += BigInt(record.amountSen);
    item.count++;
    sums.set(record.category, item);
  }
  const denominator = BigInt(totalExpense);
  const rows = CATEGORY_IDS.filter((category) => sums.has(category)).map(
    (category) => {
      const item = sums.get(category)!;
      const scaled = item.amount * 10000n;
      return {
        category,
        amountSen: safeSen(item.amount),
        count: item.count,
        shareBasisPoints: Number(scaled / denominator),
        remainder: scaled % denominator,
      };
    },
  );
  let left = 10000 - rows.reduce((sum, row) => sum + row.shareBasisPoints, 0);
  for (const row of [...rows].sort((a, b) =>
    a.remainder === b.remainder
      ? a.category.localeCompare(b.category)
      : a.remainder > b.remainder
        ? -1
        : 1,
  )) {
    if (left-- <= 0) break;
    row.shareBasisPoints++;
  }
  return rows
    .map((row) => ({
      category: row.category,
      amountSen: row.amountSen,
      count: row.count,
      shareBasisPoints: row.shareBasisPoints,
    }))
    .sort(
      (a, b) =>
        b.amountSen - a.amountSen || a.category.localeCompare(b.category),
    );
}

/** Format display ratios with BigInt; financial totals never pass through chart math. */
export function percentageText(
  numerator: bigint,
  denominator: bigint,
): string | null {
  if (denominator <= 0n) return null;
  const negative = numerator < 0n,
    absolute = negative ? -numerator : numerator;
  const tenths = (absolute * 1000n + denominator / 2n) / denominator;
  return `${negative && tenths > 0n ? "-" : ""}${tenths / 10n}.${tenths % 10n}%`;
}
export function shareText(basisPoints: number): string {
  return `${Math.trunc(basisPoints / 100)}.${String(basisPoints % 100).padStart(2, "0")}%`;
}

export function calculateAnalytics(
  snapshot: LedgerSnapshot,
  requestedRange: DateRange,
  today: string,
  accountId = "all",
) {
  const range = validateRange(requestedRange, today);
  if (
    accountId !== "all" &&
    !snapshot.accounts.some((account) => account.id === accountId)
  )
    throw new LedgerError("Choose an existing account, or view all accounts.");
  const days = dayNumber(range.end) - dayNumber(range.start) + 1;
  const previousRange = {
    start: addDays(range.start, -days),
    end: addDays(range.start, -1),
  };
  const accountRecords = snapshot.transactions.filter(
    (record) =>
      accountId === "all" ||
      record.accountId === accountId ||
      record.transferToAccountId === accountId,
  );
  const inRange = (record: TransactionInput, period: DateRange) =>
    record.date >= period.start && record.date <= period.end;
  const records = accountRecords.filter((record) => inRange(record, range));
  const current = totals(records),
    previous = totals(
      accountRecords.filter((record) => inRange(record, previousRange)),
    );
  const categories = categoryTotals(records, current.expenseSen);
  const difference = safeSen(
    BigInt(current.expenseSen) - BigInt(previous.expenseSen),
  );
  return {
    range,
    days,
    current,
    previous,
    previousRange,
    categories,
    dailyAverageSen: safeSen(BigInt(current.expenseSen) / BigInt(days)),
    spendingDays: new Set(
      records
        .filter((record) => record.kind === "expense")
        .map((record) => record.date),
    ).size,
    differenceSen: difference,
    changePercent:
      previous.expenseSen > 0
        ? percentageText(BigInt(difference), BigInt(previous.expenseSen))
        : null,
    trendState:
      current.expenseCount === 0
        ? ("no-current-expenses" as const)
        : previous.expenseCount === 0
          ? ("no-baseline" as const)
          : ("comparable" as const),
    buckets: {
      day: buckets(records, range, "day"),
      week: buckets(records, range, "week"),
      month: buckets(records, range, "month"),
    },
  };
}

export function budgetUtilization(snapshot: LedgerSnapshot, today: string) {
  const result = calculateBudget(snapshot, snapshot.budget, today);
  const cap = snapshot.budget.plan?.spendingLimitSen;
  if (!result || cap == null || result.cycle.expired || result.cycle.upcoming)
    return {
      state: !result
        ? ("no-plan" as const)
        : result.cycle.expired || result.cycle.upcoming
          ? ("inactive" as const)
          : ("no-cap" as const),
    };
  const used = BigInt(result.spentSen) + BigInt(result.billsSen);
  const usedSen = safeSen(used);
  const fraction =
    cap > 0 ? (used * 10000n) / BigInt(cap) : used > 0n ? 10000n : 0n;
  return {
    state: "active" as const,
    start: result.cycle.start,
    end: result.cycle.end,
    capSen: cap,
    recordedSen: result.spentSen,
    pendingBillsSen: result.billsSen,
    usedSen,
    remainingSen: Math.max(0, safeSen(BigInt(cap) - used)),
    overSen: Math.max(0, safeSen(used - BigInt(cap))),
    percentText: percentageText(used, BigInt(cap)),
    progress: Number(fraction > 10000n ? 10000n : fraction) / 100,
  };
}
