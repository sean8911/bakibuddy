import type { BudgetData } from "../types/budget.ts";
import type { LedgerSnapshot } from "../types/finance.ts";
import { safeSen } from "../utils/validation.ts";
import { activeCycle, occurrences } from "./calendar.ts";

const max = (a: bigint, b: bigint) => (a > b ? a : b);
const min = (a: bigint, b: bigint) => (a < b ? a : b);
/** Plans never create money. Today's allowance uses recorded funds only. */
export function calculateBudget(
  ledger: LedgerSnapshot,
  budget: BudgetData,
  today: string,
) {
  if (!budget.plan) return null;
  const plan = budget.plan,
    cycle = activeCycle(plan, today);
  const all = occurrences(budget.items, budget.settlements, cycle.end);
  const pending = all.filter((item) => !item.transactionId);
  const bills = pending.filter((item) => item.kind === "bill");
  const income = pending.filter(
    (item) => item.kind === "income" && item.dueDate >= today,
  );
  const overdueIncome = pending.filter(
    (item) => item.kind === "income" && item.dueDate < today,
  );
  const sum = (items: typeof all) =>
    items.reduce((total, item) => total + BigInt(item.amountSen), 0n);
  const balance = BigInt(ledger.totals.balanceSen),
    committed = sum(bills),
    expected = sum(income);
  const reserve = BigInt(plan.savingsReserveSen);
  const spent = ledger.transactions.reduce(
    (total, record) =>
      record.kind === "expense" &&
      record.date >= cycle.start &&
      record.date <= today &&
      record.date < cycle.end
        ? total + BigInt(record.amountSen)
        : total,
    0n,
  );
  const remainingLimit =
    plan.spendingLimitSen === null
      ? null
      : max(0n, BigInt(plan.spendingLimitSen) - spent - committed);
  const unprotected = balance - committed - reserve,
    available = max(0n, unprotected);
  const allowance =
    cycle.expired || cycle.upcoming
      ? 0n
      : remainingLimit === null
        ? available
        : min(available, remainingLimit);
  const daily = cycle.days > 0 ? allowance / BigInt(cycle.days) : 0n;
  // Bills precede expected income on the same day: a deposit is not guaranteed.
  let running = balance,
    lowest = balance;
  const accounts = new Map(
    ledger.accounts.map((a) => [a.id, BigInt(a.balanceSen)]),
  );
  const shortfalls = new Map<string, bigint>();
  const events = [...bills, ...income].sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) || a.kind.localeCompare(b.kind),
  );
  for (const item of events) {
    const change = BigInt(item.amountSen) * (item.kind === "bill" ? -1n : 1n);
    running += change;
    lowest = min(lowest, running);
    const accountBalance = (accounts.get(item.accountId) ?? 0n) + change;
    accounts.set(item.accountId, accountBalance);
    if (accountBalance < 0n)
      shortfalls.set(
        item.accountId,
        max(shortfalls.get(item.accountId) ?? 0n, -accountBalance),
      );
  }
  return {
    cycle,
    occurrences: all,
    bills,
    income,
    overdueIncome,
    recordedBalanceSen: ledger.totals.balanceSen,
    billsSen: safeSen(committed),
    expectedIncomeSen: safeSen(expected),
    savingsReserveSen: plan.savingsReserveSen,
    spentSen: safeSen(spent),
    remainingLimitSen: remainingLimit === null ? null : safeSen(remainingLimit),
    availableSen: safeSen(allowance),
    dailySen: safeSen(daily),
    roundingRemainderSen: safeSen(allowance - daily * BigInt(cycle.days)),
    shortfallSen: safeSen(max(0n, -unprotected)),
    forecastBalanceSen: safeSen(balance - committed + expected),
    forecastAfterAllowanceSen: safeSen(
      balance - committed + expected - allowance,
    ),
    cashflowShortfallSen: safeSen(max(0n, -lowest)),
    accountShortfalls: Array.from(shortfalls, ([accountId, value]) => ({
      accountId,
      amountSen: safeSen(value),
    })),
  };
}
