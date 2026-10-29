import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import {
  calculateAnalytics,
  budgetUtilization,
  percentageText,
  presetRange,
  shareText,
  validateRange,
} from "../src/analytics/engine.ts";
import { buildSnapshot } from "../src/storage/ledger.ts";
import { LedgerRepository, migrate } from "../src/storage/repository.ts";
import { todayInKL } from "../src/utils/dates.ts";

const today = "2026-10-27";
const range = { start: "2026-10-01", end: today };
const account = (id) => ({
  id,
  name: id,
  type: "bank",
  openingBalanceSen: 100000,
});
const record = (id, changes = {}) => ({
  id,
  merchant: id,
  kind: "expense",
  amountSen: 1000,
  date: today,
  category: "food",
  accountId: "bank",
  transferToAccountId: null,
  description: "",
  ...changes,
});
const snapshot = (records = [], budget) =>
  buildSnapshot([account("bank"), account("wallet")], records, budget);
const analyze = (records = [], selected = range, accountId = "all") =>
  calculateAnalytics(snapshot(records), selected, today, accountId);
const plan = (changes = {}) => ({
  cycle: "monthly",
  startDate: "2026-10-01",
  nextIncomeDate: "2026-11-01",
  savingsReserveSen: 10000,
  spendingLimitSen: 50000,
  ...changes,
});
const planned = (changes = {}) => ({
  id: "rent",
  name: "Rent",
  kind: "bill",
  amountSen: 20000,
  date: "2026-10-28",
  repeat: "once",
  accountId: "bank",
  category: "bills",
  ...changes,
});

test("inclusive presets handle KL day boundaries, months and years", () => {
  assert.deepEqual(presetRange("month", today), range);
  assert.deepEqual(presetRange("seven", "2026-01-03"), {
    start: "2025-12-28",
    end: "2026-01-03",
  });
  assert.deepEqual(presetRange("thirty", "2024-03-01"), {
    start: "2024-02-01",
    end: "2024-03-01",
  });
  assert.equal(
    presetRange("seven", todayInKL(new Date("2026-10-26T16:00:00Z"))).end,
    today,
  );
});
test("date ranges reject invalid, reversed, future, oversized or missing values", () => {
  for (const selected of [
    { start: "", end: today },
    { start: "2026-02-30", end: today },
    { start: today, end: "2026-10-26" },
    { start: "2026-10-01", end: "2026-10-28" },
    { start: "1899-12-31", end: today },
    { start: "2025-01-01", end: today },
    {},
  ])
    assert.throws(() => validateRange(selected, today));
  assert.deepEqual(validateRange({ start: today, end: today }, today), {
    start: today,
    end: today,
  });
  assert.equal(
    calculateAnalytics(
      snapshot(),
      { start: "2024-01-01", end: "2024-12-31" },
      "2024-12-31",
    ).days,
    366,
  );
});
test("empty ledger returns real zero totals and contiguous zero buckets", () => {
  const result = analyze();
  assert.equal(result.current.count, 0);
  assert.equal(result.current.netFlowSen, 0);
  assert.deepEqual(result.categories, []);
  assert.equal(result.buckets.day.length, 27);
  assert.equal(result.buckets.week.length, 5);
  assert.equal(result.buckets.month.length, 1);
  assert.ok(result.buckets.day.every((bucket) => bucket.expenseSen === 0));
});
test("all cash-flow kinds remain separate, opening balances and transfers are excluded", () => {
  const result = analyze([
    record("income", { kind: "income", amountSen: 50000 }),
    record("expense", { amountSen: 1250 }),
    record("refund", { kind: "refund", amountSen: 250 }),
    record("move", {
      kind: "transfer",
      transferToAccountId: "wallet",
      amountSen: 10000,
    }),
  ]);
  assert.equal(result.current.incomeSen, 50000);
  assert.equal(result.current.expenseSen, 1250);
  assert.equal(result.current.refundSen, 250);
  assert.equal(result.current.netFlowSen, 49000);
  assert.equal(result.current.transferCount, 1);
  assert.equal(result.categories[0].amountSen, 1250);
});
test("both range endpoints are included and adjacent dates are excluded", () => {
  const result = analyze([
    record("before", { date: "2026-09-30" }),
    record("first", { date: "2026-10-01" }),
    record("last"),
    record("after", { date: "2026-10-28" }),
  ]);
  assert.equal(result.current.expenseSen, 2000);
  assert.equal(result.current.count, 2);
});
test("account filter includes receiving transfers without creating income", () => {
  const records = [
    record("bank"),
    record("wallet", { accountId: "wallet", amountSen: 200 }),
    record("transfer", {
      kind: "transfer",
      transferToAccountId: "wallet",
      amountSen: 5000,
    }),
  ];
  const wallet = analyze(records, range, "wallet");
  assert.equal(wallet.current.expenseSen, 200);
  assert.equal(wallet.current.incomeSen, 0);
  assert.equal(wallet.current.transferCount, 1);
  assert.throws(() => analyze(records, range, "missing"));
});
test("daily weekly and monthly buckets reconcile every total across year boundaries", () => {
  const records = [
    record("year", { date: "2025-12-31", amountSen: 1 }),
    record("jan", { date: "2026-01-01", amountSen: 2 }),
    record("sun", { date: "2026-01-04", kind: "refund", amountSen: 3 }),
    record("mon", { date: "2026-01-05", kind: "income", amountSen: 4 }),
  ];
  const result = analyze(records, { start: "2025-12-30", end: "2026-01-06" });
  for (const series of Object.values(result.buckets)) {
    for (const field of [
      "expenseSen",
      "incomeSen",
      "refundSen",
      "netFlowSen",
      "count",
    ])
      assert.equal(
        series.reduce((total, bucket) => total + bucket[field], 0),
        result.current[field],
      );
    assert.equal(series[0].start, "2025-12-30");
    assert.equal(series.at(-1).end, "2026-01-06");
  }
  assert.equal(result.buckets.week[0].end, "2026-01-04");
  assert.equal(result.buckets.week[1].start, "2026-01-05");
  assert.equal(result.buckets.month.length, 2);
});
test("categories use gross expenses with exact largest-remainder shares", () => {
  const result = analyze([
    record("one", { amountSen: 1, category: "food" }),
    record("two", { amountSen: 1, category: "bills" }),
    record("three", { amountSen: 1, category: "transport" }),
    record("returned", { kind: "refund", amountSen: 100, category: "food" }),
  ]);
  assert.equal(
    result.categories.reduce((total, row) => total + row.amountSen, 0),
    3,
  );
  assert.equal(
    result.categories.reduce((total, row) => total + row.shareBasisPoints, 0),
    10000,
  );
  assert.deepEqual(
    result.categories.map((row) => row.shareBasisPoints).sort(),
    [3333, 3333, 3334],
  );
  assert.equal(shareText(3334), "33.34%");
  assert.equal(shareText(10000), "100.00%");
});
test("category ranking is deterministic, stable for ties and independent of record order", () => {
  const records = [
    record("a", { category: "food", amountSen: 100 }),
    record("b", { category: "bills", amountSen: 100 }),
    record("c", { category: "transport", amountSen: 200 }),
  ];
  assert.deepEqual(
    analyze(records).categories,
    analyze([...records].reverse()).categories,
  );
  assert.deepEqual(
    analyze(records).categories.map((row) => row.category),
    ["transport", "bills", "food"],
  );
});
test("previous period has the same inclusive day count and exact signed comparison", () => {
  const result = analyze(
    [
      record("old", { date: "2026-10-25", amountSen: 1000 }),
      record("new", { date: today, amountSen: 1500 }),
    ],
    { start: today, end: today },
  );
  assert.deepEqual(result.previousRange, {
    start: "2026-10-26",
    end: "2026-10-26",
  });
  assert.equal(result.changePercent, null);
  const lower = analyze(
    [
      record("old", { date: "2026-10-26", amountSen: 1000 }),
      record("new", { amountSen: 250 }),
    ],
    { start: today, end: today },
  );
  assert.equal(lower.changePercent, "-75.0%");
  assert.equal(lower.differenceSen, -750);
  assert.equal(lower.trendState, "comparable");
});
test("missing/zero comparison baseline never produces infinity or invented trend", () => {
  assert.equal(analyze([record("only")]).trendState, "no-baseline");
  assert.equal(analyze([record("only")]).changePercent, null);
  assert.equal(
    analyze([record("refund", { kind: "refund" })]).trendState,
    "no-current-expenses",
  );
  assert.equal(percentageText(1n, 0n), null);
  assert.equal(percentageText(1n, 3n), "33.3%");
  assert.equal(percentageText(-1n, 3n), "-33.3%");
});
test("daily average floors sen across all calendar days, including zero days", () => {
  const result = analyze([record("one", { amountSen: 10 })], {
    start: "2026-10-25",
    end: today,
  });
  assert.equal(result.dailyAverageSen, 3);
  assert.equal(result.spendingDays, 1);
  assert.equal(result.days, 3);
});
test("refund-only and transfer-only selections stay honest", () => {
  const refunds = analyze([
    record("return", { kind: "refund", amountSen: 500 }),
  ]);
  assert.equal(refunds.current.netFlowSen, 500);
  assert.deepEqual(refunds.categories, []);
  const transfers = analyze([
    record("move", { kind: "transfer", transferToAccountId: "wallet" }),
  ]);
  assert.equal(transfers.current.count, 1);
  assert.equal(transfers.current.netFlowSen, 0);
  assert.equal(transfers.current.expenseSen, 0);
});
test("safe integer boundary remains exact; display percentages can exceed number range", () => {
  const huge = buildSnapshot(
    [{ ...account("bank"), openingBalanceSen: 0 }],
    [record("huge", { amountSen: Number.MAX_SAFE_INTEGER })],
  );
  const result = calculateAnalytics(huge, { start: today, end: today }, today);
  assert.equal(result.current.expenseSen, Number.MAX_SAFE_INTEGER);
  assert.equal(result.categories[0].shareBasisPoints, 10000);
  assert.equal(
    percentageText(BigInt(Number.MAX_SAFE_INTEGER), 1n),
    "900719925474099100.0%",
  );
});
test("unsafe aggregate reports an error instead of allowing chart-rounded money", () => {
  const raw = {
    ...snapshot(),
    transactions: [
      record("a", { amountSen: Number.MAX_SAFE_INTEGER }),
      record("b", { amountSen: 1 }),
    ],
  };
  assert.throws(() => calculateAnalytics(raw, range, today));
});
test("budget usage reuses actual cycle, reserves pending bills and stays filter-independent", () => {
  const ledger = snapshot(
    [
      record("spent", { amountSen: 10000 }),
      record("refund", { kind: "refund", amountSen: 5000 }),
    ],
    { plan: plan(), items: [planned()], settlements: [] },
  );
  const result = budgetUtilization(ledger, today);
  assert.equal(result.state, "active");
  assert.equal(result.usedSen, 30000);
  assert.equal(result.percentText, "60.0%");
  assert.equal(result.remainingSen, 20000);
  calculateAnalytics(ledger, { start: today, end: today }, today, "wallet");
  assert.equal(budgetUtilization(ledger, today).usedSen, 30000);
});
test("budget usage handles no plan, no cap, expired custom plan and zero cap", () => {
  assert.equal(budgetUtilization(snapshot(), today).state, "no-plan");
  assert.equal(
    budgetUtilization(
      snapshot([], {
        plan: plan({ spendingLimitSen: null }),
        items: [],
        settlements: [],
      }),
      today,
    ).state,
    "no-cap",
  );
  assert.equal(
    budgetUtilization(
      snapshot([], {
        plan: plan({ cycle: "custom", nextIncomeDate: today }),
        items: [],
        settlements: [],
      }),
      today,
    ).state,
    "inactive",
  );
  const zero = budgetUtilization(
    snapshot([], {
      plan: plan({ spendingLimitSen: 0 }),
      items: [],
      settlements: [],
    }),
    today,
  );
  assert.equal(zero.percentText, null);
  assert.equal(zero.progress, 0);
});
test("over-budget percentage remains explicit while graphic clamps at 100", () => {
  const usage = budgetUtilization(
    snapshot([record("spent", { amountSen: 60000 })], {
      plan: plan(),
      items: [],
      settlements: [],
    }),
    today,
  );
  assert.equal(usage.percentText, "120.0%");
  assert.equal(usage.progress, 100);
  assert.equal(usage.overSen, 10000);
  assert.equal(usage.remainingSen, 0);
});
test("real repository edits/deletes immediately change analytics without writes by analysis", async (t) => {
  const db = new DatabaseSync(":memory:");
  t.after(() => db.close());
  const driver = {
    exec: async (sql) => db.exec(sql),
    all: async (sql, params = []) => db.prepare(sql).all(...params),
    run: async (sql, params = []) => db.prepare(sql).run(...params),
  };
  await migrate(driver);
  const repo = new LedgerRepository(driver, () => today);
  await repo.saveAccount(account("bank"));
  await repo.saveTransaction(record("real"));
  let saved = await repo.load();
  const before = db.prepare("SELECT total_changes() AS count").get().count;
  assert.equal(
    calculateAnalytics(saved, range, today).current.expenseSen,
    1000,
  );
  assert.equal(
    db.prepare("SELECT total_changes() AS count").get().count,
    before,
  );
  saved = await repo.saveTransaction(
    record("real", { amountSen: 1234, category: "transport" }),
    true,
  );
  const edited = calculateAnalytics(saved, range, today);
  assert.equal(edited.current.expenseSen, 1234);
  assert.equal(edited.categories[0].category, "transport");
  saved = await repo.deleteTransaction("real");
  assert.equal(calculateAnalytics(saved, range, today).current.count, 0);
});
