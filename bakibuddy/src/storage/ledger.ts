import type {
  AccountInput,
  LedgerSnapshot,
  TransactionInput,
} from "../types/finance.ts";
import { safeSen, LedgerError } from "../utils/validation.ts";
import { emptyBudget, type BudgetData } from "../types/budget.ts";
import {emptyImportHistory,type ImportHistory} from "../importing/types.ts";

/** BigInt accumulators preserve exact sen before checking the supported JS integer boundary. */
export function buildSnapshot(
  accounts: AccountInput[],
  records: TransactionInput[],
  budget: BudgetData = emptyBudget(),
  imports: ImportHistory = emptyImportHistory(),
  scans: import('../scanning/types.ts').ScanReceipt[] = [],
): LedgerSnapshot {
  const balances = new Map(
    accounts.map((account) => [account.id, BigInt(account.openingBalanceSen)]),
  );
  let income = 0n,
    expenses = 0n,
    refunds = 0n;
  const names = new Map(accounts.map((account) => [account.id, account.name]));
  for (const record of records) {
    const amount = BigInt(record.amountSen);
    const source = balances.get(record.accountId);
    if (source === undefined)
      throw new LedgerError(
        "A transaction refers to a missing account. Your data has not been changed.",
        "INTEGRITY",
      );
    const incoming = record.kind === "income" || record.kind === "refund";
    balances.set(record.accountId, source + (incoming ? amount : -amount));
    if (record.kind === "income") income += amount;
    if (record.kind === "expense") expenses += amount;
    if (record.kind === "refund") refunds += amount;
    if (record.kind === "transfer") {
      const target = record.transferToAccountId;
      if (!target || !balances.has(target))
        throw new LedgerError(
          "A transfer refers to a missing receiving account.",
          "INTEGRITY",
        );
      balances.set(target, (balances.get(target) ?? 0n) + amount);
    }
  }
  let total = 0n;
  const result = accounts.map((account) => {
    const balance = balances.get(account.id) ?? 0n;
    total += balance;
    return { ...account, balanceSen: safeSen(balance) };
  });
  return {
    imports,
    scans,
    budget,
    accounts: result,
    transactions: records.map((record) => ({
      ...record,
      account:
        record.kind === "transfer"
          ? `${names.get(record.accountId)} → ${names.get(record.transferToAccountId ?? "")}`
          : (names.get(record.accountId) ?? ""),
      note: record.description,
    })),
    totals: {
      balanceSen: safeSen(total),
      incomeSen: safeSen(income),
      expenseSen: safeSen(expenses),
      refundSen: safeSen(refunds),
    },
  };
}

export function periodTotals(
  records: readonly TransactionInput[],
  month: string,
) {
  let income = 0n,
    expenses = 0n,
    refunds = 0n;
  for (const record of records) {
    if (!record.date.startsWith(month)) continue;
    if (record.kind === "income") income += BigInt(record.amountSen);
    if (record.kind === "expense") expenses += BigInt(record.amountSen);
    if (record.kind === "refund") refunds += BigInt(record.amountSen);
  }
  return {
    incomeSen: safeSen(income),
    expenseSen: safeSen(expenses),
    refundSen: safeSen(refunds),
  };
}

export function filterTransactions(
  records: readonly LedgerSnapshot["transactions"][number][],
  query: string,
  kind: string,
  accountId: string,
  category: string,
) {
  const search = query.trim().toLocaleLowerCase();
  return records.filter(
    (record) =>
      (!search ||
        `${record.merchant} ${record.description} ${record.account}`
          .toLocaleLowerCase()
          .includes(search)) &&
      (kind === "all" || record.kind === kind) &&
      (accountId === "all" ||
        record.accountId === accountId ||
        record.transferToAccountId === accountId) &&
      (category === "all" || record.category === category),
  );
}
