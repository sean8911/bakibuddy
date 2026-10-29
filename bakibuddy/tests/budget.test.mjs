import assert from "node:assert/strict";
import test from "node:test";
import { calculateBudget } from "../src/budget/engine.ts";
import {
  activeCycle,
  addDays,
  addMonths,
  occurrences,
  isOccurrence,
} from "../src/budget/calendar.ts";
import { validatePlan, validatePlannedItem } from "../src/budget/validation.ts";
import { buildSnapshot } from "../src/storage/ledger.ts";

const today = "2026-10-26";
const plan = (changes = {}) => ({
  cycle: "weekly",
  startDate: today,
  nextIncomeDate: "2026-11-02",
  savingsReserveSen: 10000,
  spendingLimitSen: null,
  ...changes,
});
const item = (id, changes = {}) => ({
  id,
  name: id,
  kind: "bill",
  amountSen: 20000,
  date: "2026-10-27",
  repeat: "once",
  accountId: "bank",
  category: "bills",
  ...changes,
});
const tx = (id, changes = {}) => ({
  id,
  merchant: id,
  kind: "expense",
  amountSen: 1000,
  date: today,
  accountId: "bank",
  transferToAccountId: null,
  category: "food",
  description: "",
  ...changes,
});
const ledger = (balance = 100000, records = [], extra = []) =>
  buildSnapshot(
    [
      { id: "bank", name: "Bank", type: "bank", openingBalanceSen: balance },
      ...extra,
    ],
    records,
  );
const run = (options = {}, records = [], now = today) =>
  calculateBudget(
    ledger(100000, records),
    { plan: plan(), items: [], settlements: [], ...options },
    now,
  );

test("no plan returns no invented budget", () =>
  assert.equal(run({ plan: null }), null));
test("funds protect bills and savings, daily amounts floor exact sen", () => {
  const result = run({ items: [item("rent")] });
  assert.equal(result.availableSen, 70000);
  assert.equal(result.dailySen, 10000);
  assert.equal(result.forecastBalanceSen, 80000);
  assert.equal(result.forecastAfterAllowanceSen, 10000);
  const rounded = run({
    plan: plan({ savingsReserveSen: 0 }),
    items: [item("odd", { amountSen: 1 })],
  });
  assert.equal(rounded.dailySen, 14285);
  assert.equal(rounded.roundingRemainderSen, 4);
  assert.equal(
    rounded.dailySen * rounded.cycle.days + rounded.roundingRemainderSen,
    rounded.availableSen,
  );
});
test("expected income forecasts only, overdue income excluded, end date excluded", () => {
  const result = run({
    items: [
      item("expected", { kind: "income", amountSen: 50000 }),
      item("late", { kind: "income", date: "2026-10-25" }),
      item("payday", { kind: "income", date: "2026-11-02" }),
      item("endbill", { date: "2026-11-02" }),
    ],
  });
  assert.equal(result.availableSen, 90000);
  assert.equal(result.expectedIncomeSen, 50000);
  assert.equal(result.forecastBalanceSen, 150000);
  assert.equal(result.overdueIncome.length, 1);
  assert.equal(result.billsSen, 0);
});
test("overdue and today bills remain reserved across cycles", () => {
  const result = run({
    items: [
      item("overdue", { date: "2026-10-01" }),
      item("today", { date: today }),
    ],
  });
  assert.equal(result.billsSen, 40000);
  assert.equal(result.availableSen, 50000);
});
test("insufficient or negative funds yield zero and exact shortfall", () => {
  const result = run({ items: [item("large", { amountSen: 120000 })] });
  assert.equal(result.dailySen, 0);
  assert.equal(result.shortfallSen, 30000);
  assert.equal(result.forecastBalanceSen, -20000);
  const negative = calculateBudget(
    ledger(-1),
    { plan: plan({ savingsReserveSen: 0 }), items: [], settlements: [] },
    today,
  );
  assert.equal(negative.shortfallSen, 1);
  assert.equal(negative.dailySen, 0);
});
test("cap includes recorded expenses and pending bills; zero cap is intentional", () => {
  const result = run(
    { plan: plan({ spendingLimitSen: 30000 }), items: [item("rent")] },
    [tx("spent", { amountSen: 5000 })],
  );
  assert.equal(result.spentSen, 5000);
  assert.equal(result.remainingLimitSen, 5000);
  assert.equal(result.availableSen, 5000);
  assert.equal(run({ plan: plan({ spendingLimitSen: 0 }) }).availableSen, 0);
  assert.equal(
    run({ plan: plan({ spendingLimitSen: 500 }) }, [tx("overspent")])
      .availableSen,
    0,
  );
});
test("refunds restore real funds but not spending cap; transfers do neither", () => {
  const bank = [
    { id: "wallet", name: "Wallet", type: "cash", openingBalanceSen: 0 },
  ];
  const records = [
    tx("spent"),
    tx("refund", { kind: "refund", amountSen: 1000 }),
    tx("move", {
      kind: "transfer",
      transferToAccountId: "wallet",
      amountSen: 5000,
    }),
  ];
  const result = calculateBudget(
    ledger(100000, records, bank),
    { plan: plan({ spendingLimitSen: 2000 }), items: [], settlements: [] },
    today,
  );
  assert.equal(result.recordedBalanceSen, 100000);
  assert.equal(result.spentSen, 1000);
  assert.equal(result.availableSen, 1000);
});
test("payment link replaces a reserve with a real expense without double counting", () => {
  const options = { items: [item("rent")] };
  const before = run(options);
  const after = run(
    {
      ...options,
      settlements: [
        { itemId: "rent", dueDate: "2026-10-27", transactionId: "paid" },
      ],
    },
    [tx("paid", { amountSen: 20000 })],
  );
  assert.equal(before.availableSen, after.availableSen);
  assert.equal(after.billsSen, 0);
  assert.equal(before.forecastBalanceSen, after.forecastBalanceSen);
});
test("received-income link replaces expected forecast with real money once", () => {
  const scheduled = item("income", { kind: "income", amountSen: 50000 });
  const before = run({ items: [scheduled] });
  const after = run(
    {
      items: [scheduled],
      settlements: [
        {
          itemId: "income",
          dueDate: scheduled.date,
          transactionId: "received",
        },
      ],
    },
    [tx("received", { kind: "income", amountSen: 50000 })],
  );
  assert.equal(before.forecastBalanceSen, after.forecastBalanceSen);
  assert.equal(after.expectedIncomeSen, 0);
  assert.equal(after.availableSen - before.availableSen, 50000);
});
test("chronological shortfall is reported even if later income makes ending positive", () => {
  const result = run({
    items: [
      item("bill", { amountSen: 120000, date: today }),
      item("later", { kind: "income", amountSen: 200000 }),
    ],
  });
  assert.equal(result.forecastBalanceSen, 180000);
  assert.equal(result.cashflowShortfallSen, 20000);
  assert.equal(result.accountShortfalls[0].amountSen, 20000);
  const sameDay = run({
    items: [
      item("bill", { amountSen: 120000 }),
      item("sameDayIncome", { kind: "income", amountSen: 200000 }),
    ],
  });
  assert.equal(sameDay.cashflowShortfallSen, 20000);
});
test("weekly rollover is half-open and excludes old spending", () => {
  assert.deepEqual(activeCycle(plan(), "2026-11-02"), {
    start: "2026-11-02",
    end: "2026-11-09",
    days: 7,
    expired: false,
    upcoming: false,
  });
  assert.equal(run({}, [tx("old")], "2026-11-02").spentSen, 0);
});
test("monthly cycles and occurrences clamp without drift, including leap years", () => {
  assert.equal(addMonths("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonths("2027-01-31", 2), "2027-03-31");
  assert.equal(addMonths("2024-01-31", 1), "2024-02-29");
  const monthly = plan({
    cycle: "monthly",
    startDate: "2027-01-01",
    nextIncomeDate: "2027-01-31",
  });
  assert.equal(activeCycle(monthly, "2027-02-28").end, "2027-03-31");
  const scheduled = item("monthly", { date: "2027-01-31", repeat: "monthly" });
  assert.deepEqual(
    occurrences([scheduled], [], "2027-04-01").map((entry) => entry.dueDate),
    ["2027-01-31", "2027-02-28", "2027-03-31"],
  );
  assert.equal(isOccurrence(scheduled, "2027-02-28"), true);
  assert.equal(isOccurrence(scheduled, "2027-03-28"), false);
});
test("custom/irregular cycles expire with no division by zero or fabricated payday", () => {
  for (const cycle of ["custom", "irregular"]) {
    const result = run({ plan: plan({ cycle }) }, [], "2026-11-02");
    assert.equal(result.cycle.expired, true);
    assert.equal(result.dailySen, 0);
    assert.equal(result.availableSen, 0);
  }
  assert.equal(run({}, [], "2026-11-01").cycle.days, 1);
});
test("calendar arithmetic crosses years and leap days without host timezone", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.throws(() => addDays("2026-02-30", 1));
});
test("invalid and missing plan/schedule inputs are rejected", () => {
  for (const changes of [
    { savingsReserveSen: -1 },
    { spendingLimitSen: 1.1 },
    { nextIncomeDate: today },
    { nextIncomeDate: "2026-12-01" },
    { startDate: "bad" },
    { cycle: "daily" },
    { savingsReserveSen: undefined },
  ])
    assert.throws(() => validatePlan(plan(changes)));
  for (const changes of [
    { name: " " },
    { amountSen: 0 },
    { amountSen: NaN },
    { date: "2026-02-30" },
    { repeat: "yearly" },
    { accountId: "" },
    { kind: "refund" },
    { category: "bad" },
  ])
    assert.throws(() => validatePlannedItem(item("invalid", changes)));
});
test("unsafe forecasts fail visibly instead of rounding or overflowing", () => {
  assert.throws(() =>
    run({
      items: [
        item("huge", { kind: "income", amountSen: Number.MAX_SAFE_INTEGER }),
      ],
    }),
  );
  const result = calculateBudget(
    ledger(Number.MAX_SAFE_INTEGER),
    { plan: plan({ savingsReserveSen: 0 }), items: [], settlements: [] },
    today,
  );
  assert.equal(result.dailySen, Number(BigInt(Number.MAX_SAFE_INTEGER) / 7n));
});
