import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { LedgerRepository, migrate } from "../src/storage/repository.ts";
import { calculateBudget } from "../src/budget/engine.ts";

const now = "2026-10-26";
const plan = {
  cycle: "weekly",
  startDate: now,
  nextIncomeDate: "2026-11-02",
  savingsReserveSen: 10000,
  spendingLimitSen: 50000,
};
const item = (changes = {}) => ({
  id: "rent",
  name: "Rent",
  kind: "bill",
  amountSen: 20000,
  date: now,
  repeat: "monthly",
  accountId: "bank",
  category: "bills",
  ...changes,
});
const record = (changes = {}) => ({
  id: "paid",
  merchant: "Rent",
  kind: "expense",
  amountSen: 20000,
  date: now,
  accountId: "bank",
  transferToAccountId: null,
  category: "bills",
  description: "",
  ...changes,
});
function connect(t) {
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const driver = {
    exec: async (sql) => sqlite.exec(sql),
    all: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    run: async (sql, params = []) => sqlite.prepare(sql).run(...params),
  };
  return { driver, repo: new LedgerRepository(driver, () => now) };
}
async function setup(t) {
  const connection = connect(t);
  await migrate(connection.driver);
  await connection.repo.saveAccount({
    id: "bank",
    name: "Bank",
    type: "bank",
    openingBalanceSen: 100000,
  });
  await connection.repo.saveBudgetPlan(plan);
  await connection.repo.savePlannedItem(item());
  return connection;
}
const budget = (snapshot) => calculateBudget(snapshot, snapshot.budget, now);
test("schema v1 upgrades atomically with every existing record intact", async (t) => {
  const { driver, repo } = connect(t);
  await migrate(driver);
  await repo.saveAccount({
    id: "bank",
    name: "Bank",
    type: "bank",
    openingBalanceSen: 100000,
  });
  await repo.saveTransaction(record());
  await driver.exec(
    "DROP TABLE scan_receipts; DROP TABLE import_receipts; DROP TABLE import_wallets; DROP TABLE settlements; DROP TABLE planned_items; DROP TABLE budget_plan; PRAGMA user_version=1;",
  );
  const faulty = {
    ...driver,
    exec: async (sql) => {
      if (sql.includes("CREATE TABLE budget_plan")) {
        await driver.exec("CREATE TABLE budget_plan(id INTEGER)");
        throw new Error("Interrupted upgrade");
      }
      return driver.exec(sql);
    },
  };
  await assert.rejects(migrate(faulty));
  assert.equal((await driver.all("PRAGMA user_version"))[0].user_version, 1);
  assert.equal(
    (
      await driver.all(
        "SELECT name FROM sqlite_master WHERE name='budget_plan'",
      )
    ).length,
    0,
  );
  await migrate(driver);
  await migrate(driver);
  const snapshot = await repo.load();
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.totals.balanceSen, 80000);
  assert.equal(snapshot.budget.plan, null);
});
test("plan and schedule CRUD persists through a new repository without seeding transactions", async (t) => {
  const { repo, driver } = await setup(t);
  let snapshot = await new LedgerRepository(driver, () => now).load();
  assert.deepEqual(snapshot.budget.plan, plan);
  assert.equal(snapshot.transactions.length, 0);
  await repo.savePlannedItem(
    item({ name: "Room rent", amountSen: 25000 }),
    true,
  );
  snapshot = await repo.saveBudgetPlan({ ...plan, savingsReserveSen: 0 });
  assert.equal(budget(snapshot).availableSen, 25000);
  snapshot = await repo.deleteBudgetPlan();
  assert.equal(snapshot.budget.plan, null);
  assert.equal(snapshot.budget.items.length, 1);
  snapshot = await repo.deletePlannedItem("rent");
  assert.equal(snapshot.budget.items.length, 0);
});
test("record-and-link is atomic and reconciles money and cap without a double reserve", async (t) => {
  const { repo } = await setup(t);
  const before = budget(await repo.load());
  const snapshot = await repo.saveTransaction(record(), false, false, {
    itemId: "rent",
    dueDate: now,
  });
  assert.equal(snapshot.budget.settlements.length, 1);
  assert.equal(budget(snapshot).billsSen, 0);
  assert.equal(budget(snapshot).availableSen, before.availableSen);
  assert.equal(budget(snapshot).forecastBalanceSen, before.forecastBalanceSen);
});
test("link existing records, unlink, and delete restore the correct reserve", async (t) => {
  const { repo } = await setup(t);
  await repo.saveTransaction(record());
  let snapshot = await repo.linkPlannedRecord({
    itemId: "rent",
    dueDate: now,
    transactionId: "paid",
  });
  assert.equal(snapshot.transactions.length, 1);
  snapshot = await repo.unlinkPlannedRecord("rent", now);
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(budget(snapshot).billsSen, 20000);
  await repo.linkPlannedRecord({
    itemId: "rent",
    dueDate: now,
    transactionId: "paid",
  });
  snapshot = await repo.deleteTransaction("paid");
  assert.equal(snapshot.budget.settlements.length, 0);
  assert.equal(snapshot.totals.balanceSen, 100000);
  assert.equal(budget(snapshot).billsSen, 20000);
});
test("mismatched or duplicate links roll back the entire record creation", async (t) => {
  const { repo } = await setup(t);
  for (const changes of [{ amountSen: 1 }, { kind: "income" }])
    await assert.rejects(
      repo.saveTransaction(record(changes), false, false, {
        itemId: "rent",
        dueDate: now,
      }),
    );
  await assert.rejects(
    repo.saveTransaction(record(), false, false, {
      itemId: "rent",
      dueDate: "2026-10-27",
    }),
  );
  assert.equal((await repo.load()).transactions.length, 0);
  await repo.saveTransaction(record(), false, false, {
    itemId: "rent",
    dueDate: now,
  });
  await assert.rejects(
    repo.saveTransaction(record({ id: "again" }), false, true, {
      itemId: "rent",
      dueDate: now,
    }),
  );
  assert.equal((await repo.load()).transactions.length, 1);
});
test("linked transaction/schedule financial edits are protected; metadata edits work", async (t) => {
  const { repo } = await setup(t);
  await repo.saveTransaction(record(), false, false, {
    itemId: "rent",
    dueDate: now,
  });
  await assert.rejects(repo.saveTransaction(record({ amountSen: 1 }), true));
  await repo.saveTransaction(
    record({ merchant: "Room rent paid", description: "Confirmed" }),
    true,
  );
  await assert.rejects(
    repo.savePlannedItem(item({ date: "2026-10-27" }), true),
  );
  await repo.savePlannedItem(item({ name: "Room rent" }), true);
  const snapshot = await repo.deletePlannedItem("rent");
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.budget.settlements.length, 0);
});
test("planned account references block account removal; invalid plans keep earlier data", async (t) => {
  const { repo } = await setup(t);
  await assert.rejects(repo.deleteAccount("bank"), /scheduled/);
  await assert.rejects(
    repo.savePlannedItem(item({ id: "missing", accountId: "missing" })),
  );
  await assert.rejects(repo.saveBudgetPlan({ ...plan, nextIncomeDate: now }));
  await assert.rejects(repo.saveBudgetPlan({ ...plan, savingsReserveSen: -1 }));
  assert.deepEqual((await repo.load()).budget.plan, plan);
});
test("forecast overflow rolls back and the write queue recovers", async (t) => {
  const { repo } = await setup(t);
  await assert.rejects(
    repo.savePlannedItem(
      item({ id: "huge", kind: "income", amountSen: Number.MAX_SAFE_INTEGER }),
    ),
  );
  assert.equal((await repo.load()).budget.items.length, 1);
  await repo.savePlannedItem(
    item({ id: "small", kind: "income", amountSen: 1 }),
  );
  assert.equal((await repo.load()).budget.items.length, 2);
});
test("weekly and monthly anchors stay editable after the original payday passes", async (t) => {
  const { repo } = await setup(t);
  await repo.saveBudgetPlan({
    ...plan,
    cycle: "monthly",
    startDate: "2026-01-01",
    nextIncomeDate: "2026-01-31",
  });
  const snapshot = await repo.saveBudgetPlan({
    ...(await repo.load()).budget.plan,
    savingsReserveSen: 1,
  });
  assert.equal(budget(snapshot).cycle.end, "2026-10-31");
  await assert.rejects(
    repo.saveBudgetPlan({
      ...plan,
      cycle: "irregular",
      startDate: "2026-10-01",
      nextIncomeDate: now,
    }),
  );
});
test("concurrent payment submissions commit one occurrence and recover cleanly", async (t) => {
  const { repo } = await setup(t);
  const results = await Promise.allSettled([
    repo.saveTransaction(record({ id: "one" }), false, true, {
      itemId: "rent",
      dueDate: now,
    }),
    repo.saveTransaction(record({ id: "two" }), false, true, {
      itemId: "rent",
      dueDate: now,
    }),
  ]);
  assert.equal(
    results.filter((result) => result.status === "fulfilled").length,
    1,
  );
  const snapshot = await repo.load();
  assert.equal(snapshot.transactions.length, 1);
  assert.equal(snapshot.budget.settlements.length, 1);
  assert.equal(snapshot.totals.balanceSen, 80000);
});
test("received income links once, becomes spendable, and deletion restores its expectation", async (t) => {
  const { repo } = await setup(t);
  await repo.savePlannedItem(
    item({
      id: "salary",
      kind: "income",
      amountSen: 50000,
      date: "2026-10-27",
      repeat: "once",
    }),
  );
  await repo.saveBudgetPlan({ ...plan, spendingLimitSen: null });
  const before = budget(await repo.load());
  let snapshot = await repo.saveTransaction(
    record({ id: "received", kind: "income", amountSen: 50000 }),
    false,
    false,
    { itemId: "salary", dueDate: "2026-10-27" },
  );
  assert.equal(budget(snapshot).forecastBalanceSen, before.forecastBalanceSen);
  assert.equal(budget(snapshot).availableSen - before.availableSen, 50000);
  await assert.rejects(
    repo.linkPlannedRecord({
      itemId: "salary",
      dueDate: "2026-10-27",
      transactionId: "received",
    }),
  );
  snapshot = await repo.deleteTransaction("received");
  assert.equal(budget(snapshot).expectedIncomeSen, 50000);
  assert.equal(budget(snapshot).availableSen, before.availableSen);
});
