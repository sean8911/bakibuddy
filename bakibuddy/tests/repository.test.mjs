import assert from "node:assert/strict";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { LedgerRepository, migrate, SCHEMA_VERSION } from "../src/storage/repository.ts";
import { periodTotals, filterTransactions } from "../src/storage/ledger.ts";
import { parseAmount, validateTransaction } from "../src/utils/validation.ts";
import { todayInKL } from "../src/utils/dates.ts";

function connect(file = ":memory:") {
  const sqlite = new DatabaseSync(file);
  const driver = {
    exec: async (sql) => {
      sqlite.exec(sql);
    },
    all: async (sql, params = []) => sqlite.prepare(sql).all(...params),
    run: async (sql, params = []) => sqlite.prepare(sql).run(...params),
  };
  return {
    sqlite,
    driver,
    repository: new LedgerRepository(driver, () => "2026-10-26"),
  };
}
const account = (id = "bank", amount = 10000) => ({
  id,
  name: id,
  type: "bank",
  openingBalanceSen: amount,
});
const record = (id = "t1", changes = {}) => ({
  id,
  merchant: "Lunch",
  kind: "expense",
  category: "food",
  amountSen: 1250,
  date: "2026-10-26",
  accountId: "bank",
  transferToAccountId: null,
  description: "",
  ...changes,
});
async function setup(t) {
  const connection = connect();
  t.after(() => connection.sqlite.close());
  await migrate(connection.driver);
  await connection.repository.saveAccount(account());
  return connection;
}

test("money entry uses exact sen, including signed opening balances and safe limits", () => {
  assert.equal(parseAmount(" 0012.50 "), 1250);
  assert.equal(parseAmount("0.01"), 1);
  assert.equal(parseAmount("-0.01", true), -1);
  assert.equal(parseAmount("0", true), 0);
  assert.equal(parseAmount("90071992547409.91"), Number.MAX_SAFE_INTEGER);
  for (const value of [
    "",
    " ",
    "0",
    "-2",
    "12.345",
    "1e3",
    "NaN",
    "1,000",
    "90071992547409.92",
  ])
    assert.throws(() => parseAmount(value));
});
test("KL day crosses at UTC16 and financial dates reject impossible or future values", () => {
  assert.equal(todayInKL(new Date("2026-10-25T15:59:59Z")), "2026-10-25");
  assert.equal(todayInKL(new Date("2026-10-25T16:00:00Z")), "2026-10-26");
  for (const date of ["2026-02-30", "2026-10-27", "1899-12-31", "not-a-date"])
    assert.throws(() =>
      validateTransaction(record("date", { date }), "2026-10-26"),
    );
});
test("migration creates an empty ledger, is repeatable, and preserves data", async (t) => {
  const { driver, repository } = await setup(t);
  await repository.saveTransaction(record());
  await migrate(driver);
  assert.equal((await repository.load()).transactions.length, 1);
  assert.equal((await driver.all("PRAGMA user_version"))[0].user_version, SCHEMA_VERSION);
});
test("newer schema is refused without deleting existing records", async (t) => {
  const { driver, repository } = await setup(t);
  await repository.saveTransaction(record());
  await driver.exec(`PRAGMA user_version=${SCHEMA_VERSION + 1}`);
  await assert.rejects(migrate(driver), { code: "SCHEMA" });
  assert.equal((await repository.load()).transactions.length, 1);
});
test("expense create/edit/delete updates account balances and exact totals", async (t) => {
  const { repository } = await setup(t);
  let snapshot = await repository.saveTransaction(record());
  assert.equal(snapshot.totals.balanceSen, 8750);
  snapshot = await repository.saveTransaction(
    record("t1", { amountSen: 1, description: "One sen" }),
    true,
  );
  assert.equal(snapshot.totals.balanceSen, 9999);
  snapshot = await repository.deleteTransaction("t1");
  assert.equal(snapshot.totals.balanceSen, 10000);
  assert.equal(snapshot.totals.expenseSen, 0);
});
test("income and refunds are distinct; transfer moves balances without new income/spending", async (t) => {
  const { repository } = await setup(t);
  await repository.saveAccount(account("wallet", 0));
  await repository.saveTransaction(
    record("income", { kind: "income", amountSen: 5000 }),
  );
  await repository.saveTransaction(
    record("refund", { kind: "refund", amountSen: 200 }),
  );
  const snapshot = await repository.saveTransaction(
    record("transfer", {
      kind: "transfer",
      transferToAccountId: "wallet",
      amountSen: 3000,
    }),
  );
  assert.equal(
    snapshot.accounts.find((a) => a.id === "bank").balanceSen,
    12200,
  );
  assert.equal(
    snapshot.accounts.find((a) => a.id === "wallet").balanceSen,
    3000,
  );
  assert.deepEqual(snapshot.totals, {
    balanceSen: 15200,
    incomeSen: 5000,
    expenseSen: 0,
    refundSen: 200,
  });
});
test("editing a transfer into an expense reverses both old account effects", async (t) => {
  const { repository } = await setup(t);
  await repository.saveAccount(account("wallet", 0));
  await repository.saveTransaction(
    record("t1", {
      kind: "transfer",
      transferToAccountId: "wallet",
      amountSen: 3000,
    }),
  );
  const snapshot = await repository.saveTransaction(
    record("t1", { accountId: "wallet", amountSen: 500 }),
    true,
  );
  assert.equal(
    snapshot.accounts.find((a) => a.id === "bank").balanceSen,
    10000,
  );
  assert.equal(
    snapshot.accounts.find((a) => a.id === "wallet").balanceSen,
    -500,
  );
  assert.equal(snapshot.totals.expenseSen, 500);
});
test("deleting a transfer restores both balances", async (t) => {
  const { repository } = await setup(t);
  await repository.saveAccount(account("wallet", 0));
  await repository.saveTransaction(
    record("t1", { kind: "transfer", transferToAccountId: "wallet" }),
  );
  const snapshot = await repository.deleteTransaction("t1");
  assert.equal(snapshot.totals.balanceSen, 10000);
  assert.equal(snapshot.accounts.find((a) => a.id === "wallet").balanceSen, 0);
});
test("changing opening balance or name reconciles the existing ledger", async (t) => {
  const { repository } = await setup(t);
  await repository.saveTransaction(record());
  const snapshot = await repository.saveAccount(
    { ...account("bank", 20000), name: "Maybank" },
    true,
  );
  assert.equal(snapshot.totals.balanceSen, 18750);
  assert.equal(snapshot.transactions[0].account, "Maybank");
});
test("invalid records and missing accounts roll back without changing totals", async (t) => {
  const { repository } = await setup(t);
  for (const changes of [
    { amountSen: 0 },
    { amountSen: 0.1 },
    { merchant: "" },
    { category: "invalid" },
    { accountId: "missing" },
    { kind: "transfer", transferToAccountId: "bank" },
    { kind: "transfer", transferToAccountId: "missing" },
    { transferToAccountId: "wallet" },
    { description: "x".repeat(301) },
  ])
    await assert.rejects(repository.saveTransaction(record("bad", changes)));
  const snapshot = await repository.load();
  assert.equal(snapshot.transactions.length, 0);
  assert.equal(snapshot.totals.balanceSen, 10000);
});
test("duplicate identifiers cannot double-save; matching payments require explicit confirmation", async (t) => {
  const { repository } = await setup(t);
  await repository.saveTransaction(record());
  await assert.rejects(repository.saveTransaction(record()), {
    code: "DUPLICATE_ID",
  });
  await assert.rejects(repository.saveTransaction(record("t2")), {
    code: "DUPLICATE",
  });
  const snapshot = await repository.saveTransaction(record("t2"), false, true);
  assert.equal(snapshot.transactions.length, 2);
  assert.equal(snapshot.totals.expenseSen, 2500);
});
test("account names are unique ignoring case and referenced accounts cannot be deleted", async (t) => {
  const { repository } = await setup(t);
  await assert.rejects(
    repository.saveAccount({ ...account("other"), name: "BANK" }),
  );
  await repository.saveTransaction(record());
  await assert.rejects(repository.deleteAccount("bank"));
  assert.equal((await repository.load()).accounts.length, 1);
  await repository.deleteTransaction("t1");
  assert.equal((await repository.deleteAccount("bank")).accounts.length, 0);
});
test("unsafe aggregate rolls back the record and the queue recovers", async (t) => {
  const { repository } = await setup(t);
  await assert.rejects(
    repository.saveTransaction(
      record("huge", { kind: "income", amountSen: Number.MAX_SAFE_INTEGER }),
    ),
  );
  assert.equal((await repository.load()).transactions.length, 0);
  assert.equal(
    (await repository.saveTransaction(record())).totals.balanceSen,
    8750,
  );
});
test("concurrent writes serialize and preserve every cent", async (t) => {
  const { repository } = await setup(t);
  await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      repository.saveTransaction(
        record(`item-${index}`, { merchant: `Payment ${index}`, amountSen: 1 }),
      ),
    ),
  );
  const snapshot = await repository.load();
  assert.equal(snapshot.transactions.length, 20);
  assert.equal(snapshot.totals.balanceSen, 9980);
});
test("period summaries and search/type/account/category filters do not count transfers as income", async (t) => {
  const { repository } = await setup(t);
  await repository.saveAccount(account("wallet", 0));
  await repository.saveTransaction(
    record("old", { date: "2026-09-01", description: "Course lunch" }),
  );
  await repository.saveTransaction(
    record("incoming", { kind: "income", amountSen: 5000 }),
  );
  const snapshot = await repository.saveTransaction(
    record("move", { kind: "transfer", transferToAccountId: "wallet" }),
  );
  assert.deepEqual(periodTotals(snapshot.transactions, "2026-10"), {
    incomeSen: 5000,
    expenseSen: 0,
    refundSen: 0,
  });
  assert.equal(
    filterTransactions(
      snapshot.transactions,
      "course",
      "expense",
      "bank",
      "food",
    ).length,
    1,
  );
  assert.equal(
    filterTransactions(snapshot.transactions, "", "transfer", "wallet", "all")
      .length,
    1,
  );
  assert.equal(
    filterTransactions(snapshot.transactions, "missing", "all", "all", "all")
      .length,
    0,
  );
});
test("SQLite survives close/reopen from a real on-disk file", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "bakibuddy-test-"));
  const file = path.join(directory, "ledger.db");
  let connection = connect(file);
  try {
    await migrate(connection.driver);
    await connection.repository.saveAccount(account());
    await connection.repository.saveTransaction(record());
    await connection.repository.saveBudgetPlan({ cycle: "weekly", startDate: "2026-10-26", nextIncomeDate: "2026-11-02", savingsReserveSen: 1000, spendingLimitSen: null });
    await connection.repository.savePlannedItem({ id: "lunch-plan", name: "Lunch", kind: "bill", amountSen: 1250, date: "2026-10-26", repeat: "once", accountId: "bank", category: "food" });
    await connection.repository.linkPlannedRecord({ itemId: "lunch-plan", dueDate: "2026-10-26", transactionId: "t1" });
    connection.sqlite.close();
    connection = connect(file);
    await migrate(connection.driver);
    const snapshot = await connection.repository.load();
    assert.equal(snapshot.transactions[0].amountSen, 1250);
    assert.equal(snapshot.accounts[0].balanceSen, 8750);
    assert.equal(snapshot.budget.plan.savingsReserveSen, 1000);
    assert.equal(snapshot.budget.items[0].id, "lunch-plan");
    assert.equal(snapshot.budget.settlements[0].transactionId, "t1");
  } finally {
    connection.sqlite.close();
    assert.ok(path.resolve(directory).startsWith(path.join(path.resolve(tmpdir()), 'bakibuddy-test-')));
    await rm(directory, { recursive: true, force: true });
  }
});

test('a failed migration rolls back every schema change and can be retried', async(t) => {
  const connection=connect();t.after(()=>connection.sqlite.close());
  const faulty={...connection.driver,run:async(sql,params=[])=>{if(params[0]==='education')throw new Error('Simulated interrupted migration');return connection.driver.run(sql,params);}};
  await assert.rejects(migrate(faulty));
  assert.equal((await connection.driver.all('PRAGMA user_version'))[0].user_version,0);
  assert.equal((await connection.driver.all("SELECT name FROM sqlite_master WHERE type='table'")).length,0);
  await migrate(connection.driver);assert.equal((await connection.repository.load()).transactions.length,0);
});
test('quoted titles and descriptions are bound as data, never executable SQL', async(t)=>{
  const {repository}=await setup(t);const merchant="Lunch'; DROP TABLE accounts;--";
  const snapshot=await repository.saveTransaction(record('quoted',{merchant,description:"A friend's lunch"}));
  assert.equal(snapshot.accounts.length,1);assert.equal(snapshot.transactions[0].merchant,merchant);
});
test('missing or nonnumeric entry values are rejected clearly',async(t)=>{
  const {repository}=await setup(t);
  for(const value of [undefined,null,1250])assert.throws(()=>parseAmount(value),{code:'VALIDATION'});
  for(const changes of [{merchant:undefined},{description:undefined},{accountId:null},{amountSen:null}])await assert.rejects(repository.saveTransaction(record('missing',changes)),{code:'VALIDATION'});
});
