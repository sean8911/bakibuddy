import assert from "node:assert/strict";
import test from "node:test";
import {
  demo,
  demoBills,
  demoBudgets,
  demoTransactions,
} from "../src/data/demo.ts";

test("fixture identifiers are unique", () => {
  assert.equal(
    new Set(demoTransactions.map((item) => item.id)).size,
    demoTransactions.length,
  );
  assert.equal(
    new Set(demoBills.map((item) => item.id)).size,
    demoBills.length,
  );
});
test("all fixture amounts are nonnegative integer sen", () => {
  const amounts = [
    ...demoTransactions.map((item) => item.amountSen),
    ...demoBills.map((item) => item.amountSen),
    ...demoBudgets.flatMap((item) => [item.limitSen, item.spentSen]),
  ];
  assert.ok(
    amounts.every((amount) => Number.isSafeInteger(amount) && amount >= 0),
  );
});
test("demo summary reconciles and transfers do not inflate spending or income", () => {
  const expenses = demoTransactions
    .filter((item) => item.kind === "expense")
    .reduce((sum, item) => sum + item.amountSen, 0);
  const income = demoTransactions
    .filter((item) => item.kind === "income")
    .reduce((sum, item) => sum + item.amountSen, 0);
  assert.ok(demoTransactions.some((item) => item.kind === "transfer"));
  assert.equal(expenses, demo.spendingSen);
  assert.equal(income, demo.incomeSen);
  assert.equal(income - expenses, demo.balanceSen);
});
test("category examples reconcile to the visible monthly budget", () => {
  assert.equal(
    demoBudgets.reduce((sum, item) => sum + item.limitSen, 0),
    demo.budgetSen,
  );
  assert.equal(
    demoBudgets.reduce((sum, item) => sum + item.spentSen, 0),
    demo.spendingSen,
  );
  assert.equal(demo.budgetSen - demo.spendingSen, demo.budgetRemainingSen);
  for (const budget of demoBudgets) {
    const categorySpent = demoTransactions
      .filter(
        (item) => item.kind === "expense" && item.category === budget.category,
      )
      .reduce((sum, item) => sum + item.amountSen, 0);
    assert.equal(budget.spentSen, categorySpent);
    assert.equal(
      budget.percentage,
      Math.round((categorySpent * 100) / budget.limitSen),
    );
  }
});
test("fixed daily preview reconciles to reserves with an explicit rounding remainder", () => {
  assert.equal(
    demoBills.reduce((sum, item) => sum + item.amountSen, 0),
    demo.upcomingBillsSen,
  );
  assert.equal(
    demo.balanceSen - demo.upcomingBillsSen - demo.reserveSen,
    demo.availableAfterReservesSen,
  );
  assert.equal(
    demo.dailyPreviewSen * demo.previewDays + demo.previewRemainderSen,
    demo.availableAfterReservesSen,
  );
});
test("demo dates are in descending order and never beyond the scenario date", () => {
  const dates = demoTransactions.map((item) => item.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.ok(dates.every((date) => date <= demo.date));
  assert.ok(
    demoBills.every(
      (bill) => bill.dueDate > demo.date && bill.dueDate < demo.nextIncomeDate,
    ),
  );
});
