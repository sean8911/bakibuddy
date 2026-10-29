import {
  CATEGORY_IDS,
  type AccountInput,
  type AccountType,
  type CategoryId,
  type LedgerSnapshot,
  type TransactionInput,
  type TransactionKind,
} from "../types/finance.ts";
import { todayInKL } from "../utils/dates.ts";
import {
  LedgerError,
  validateAccount,
  validateTransaction,
} from "../utils/validation.ts";
import { buildSnapshot } from "./ledger.ts";
import type { BudgetPlan, PlannedItem, Settlement } from "../types/budget.ts";
import { validatePlan, validatePlannedItem } from "../budget/validation.ts";
import { isOccurrence } from "../budget/calendar.ts";
import { calculateBudget } from "../budget/engine.ts";
import {IMPORT_LIMITS,type ImportRecord,type ImportHistory} from "../importing/types.ts";
import {possibleMatch} from "../importing/review.ts";
import { SCAN_LIMITS, type ScanReceipt, type ScanRecord } from '../scanning/types.ts';
import { scanPossibleMatch } from '../scanning/review.ts';
import { categoryRevision } from '../assistant/categorize.ts';
import type { CategoryChange } from '../assistant/types.ts';
import { ledgerRevision } from '../privacy/export.ts';

export type BindValue = string | number | null;
export interface SqlDriver {
  exec(sql: string): Promise<void>;
  all<T>(sql: string, params?: BindValue[]): Promise<T[]>;
  run(sql: string, params?: BindValue[]): Promise<{ changes: number }>;
}
export const SCHEMA_VERSION = 4;

export async function verifyLedgerDatabase(db: SqlDriver) {
  const integrity = await db.all<{quick_check: string}>('PRAGMA quick_check;');
  const foreignKeys = await db.all('PRAGMA foreign_key_check;');
  if(integrity.length !== 1 || integrity[0].quick_check !== 'ok' || foreignKeys.length)
    throw new LedgerError('The local database failed an integrity check. Your data has not been reset. Keep the app data and retry opening your records.', 'INTEGRITY');
}

export async function migrate(db: SqlDriver) {
  await db.exec("PRAGMA foreign_keys = ON;");
  await db.exec("BEGIN IMMEDIATE;");
  try {
    const [{ user_version: version }] = await db.all<{ user_version: number }>(
      "PRAGMA user_version;",
    );
    if (version > SCHEMA_VERSION)
      throw new LedgerError(
        "This database needs a newer BakiBuddy version. Update the app; your data has not been changed.",
        "SCHEMA",
      );
    if (version < 1) {
      await db.exec(`
        CREATE TABLE categories (id TEXT PRIMARY KEY NOT NULL);
        CREATE TABLE accounts (
          id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL COLLATE NOCASE UNIQUE,
          type TEXT NOT NULL CHECK(type IN ('bank','ewallet','cash','other')),
          opening_balance_sen INTEGER NOT NULL CHECK(typeof(opening_balance_sen)='integer' AND opening_balance_sen BETWEEN -9007199254740991 AND 9007199254740991)
        );
        CREATE TABLE transactions (
          id TEXT PRIMARY KEY NOT NULL, merchant TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('expense','income','refund','transfer')),
          category TEXT NOT NULL REFERENCES categories(id),
          amount_sen INTEGER NOT NULL CHECK(typeof(amount_sen)='integer' AND amount_sen > 0 AND amount_sen <= 9007199254740991),
          date TEXT NOT NULL CHECK(length(date)=10), account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
          transfer_to_account_id TEXT REFERENCES accounts(id) ON DELETE RESTRICT,
          description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
          CHECK ((kind='transfer' AND transfer_to_account_id IS NOT NULL AND account_id<>transfer_to_account_id)
            OR (kind<>'transfer' AND transfer_to_account_id IS NULL))
        );
        CREATE INDEX transactions_date ON transactions(date DESC, created_at DESC);
        CREATE INDEX transactions_account ON transactions(account_id);
        CREATE INDEX transactions_destination ON transactions(transfer_to_account_id);
      `);
      for (const category of CATEGORY_IDS)
        await db.run("INSERT INTO categories(id) VALUES (?)", [category]);
      await db.exec("PRAGMA user_version = 1;");
    }
    if (version < 2) {
      await db.exec(`
        CREATE TABLE budget_plan (
          id INTEGER PRIMARY KEY CHECK(id=1), cycle TEXT NOT NULL CHECK(cycle IN ('weekly','monthly','custom','irregular')),
          startDate TEXT NOT NULL, nextIncomeDate TEXT NOT NULL,
          savingsReserveSen INTEGER NOT NULL CHECK(typeof(savingsReserveSen)='integer' AND savingsReserveSen BETWEEN 0 AND 9007199254740991),
          spendingLimitSen INTEGER CHECK(spendingLimitSen IS NULL OR (typeof(spendingLimitSen)='integer' AND spendingLimitSen BETWEEN 0 AND 9007199254740991))
        );
        CREATE TABLE planned_items (
          id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL,
          kind TEXT NOT NULL CHECK(kind IN ('bill','income')),
          amountSen INTEGER NOT NULL CHECK(typeof(amountSen)='integer' AND amountSen BETWEEN 1 AND 9007199254740991),
          date TEXT NOT NULL, repeat TEXT NOT NULL CHECK(repeat IN ('once','weekly','monthly')),
          accountId TEXT NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
          category TEXT NOT NULL REFERENCES categories(id)
        );
        CREATE TABLE settlements (
          itemId TEXT NOT NULL REFERENCES planned_items(id) ON DELETE CASCADE,
          dueDate TEXT NOT NULL,
          transactionId TEXT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
          PRIMARY KEY(itemId,dueDate)
        );
        CREATE INDEX planned_items_account ON planned_items(accountId);
        PRAGMA user_version = 2;
      `);
    }
    if(version<3)await db.exec(`
      CREATE TABLE import_wallets (
        wallet_hash TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE
      );
      CREATE TABLE import_receipts (
        source_key TEXT PRIMARY KEY NOT NULL, source_fingerprint TEXT NOT NULL,
        transaction_id TEXT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE,
        wallet_hash TEXT NOT NULL REFERENCES import_wallets(wallet_hash) ON DELETE CASCADE
      );
      PRAGMA user_version = 3;
    `);
    if (version < 4) await db.exec(`
      CREATE TABLE scan_receipts (
        source_key TEXT PRIMARY KEY NOT NULL,
        transaction_id TEXT NOT NULL UNIQUE REFERENCES transactions(id) ON DELETE CASCADE
      );
      PRAGMA user_version = 4;
    `);
    await verifyLedgerDatabase(db);
    await db.exec("COMMIT;");
  } catch (error) {
    await db.exec("ROLLBACK;").catch(() => undefined);
    throw error;
  }
}

interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  opening_balance_sen: number;
}
interface TransactionRow {
  id: string;
  merchant: string;
  kind: TransactionKind;
  category: CategoryId;
  amount_sen: number;
  date: string;
  account_id: string;
  transfer_to_account_id: string | null;
  description: string;
}

export class LedgerRepository {
  private queue: Promise<unknown> = Promise.resolve();
  private readonly db: SqlDriver;
  private readonly today: () => string;
  constructor(db: SqlDriver, today: () => string = todayInKL) {
    this.db = db;
    this.today = today;
  }

  private async read(): Promise<LedgerSnapshot> {
    const accounts = await this.db.all<AccountRow>(
      "SELECT * FROM accounts ORDER BY name COLLATE NOCASE, id",
    );
    const records = await this.db.all<TransactionRow>(
      "SELECT * FROM transactions ORDER BY date DESC, created_at DESC, id DESC",
    );
    const plans = await this.db.all<BudgetPlan>(
      "SELECT cycle,startDate,nextIncomeDate,savingsReserveSen,spendingLimitSen FROM budget_plan WHERE id=1",
    );
    const items = await this.db.all<PlannedItem>(
      "SELECT * FROM planned_items ORDER BY date,name,id",
    );
    const settlements = await this.db.all<Settlement>(
      "SELECT * FROM settlements ORDER BY dueDate,itemId",
    );
    const wallets=await this.db.all<ImportHistory["wallets"][number]>("SELECT wallet_hash AS walletHash,account_id AS accountId FROM import_wallets");
    const receipts=await this.db.all<ImportHistory["receipts"][number]>("SELECT source_key AS sourceKey,source_fingerprint AS sourceFingerprint,transaction_id AS transactionId FROM import_receipts");
    const scans = await this.db.all<ScanReceipt>('SELECT source_key AS sourceKey,transaction_id AS transactionId FROM scan_receipts');
    return buildSnapshot(
      accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        openingBalanceSen: account.opening_balance_sen,
      })),
      records.map((record) => ({
        id: record.id,
        merchant: record.merchant,
        kind: record.kind,
        category: record.category,
        amountSen: record.amount_sen,
        date: record.date,
        accountId: record.account_id,
        transferToAccountId: record.transfer_to_account_id,
        description: record.description,
      })),
      {
        plan: plans[0] ? { ...plans[0] } : null,
        items: items.map((item) => ({ ...item })),
        settlements: settlements.map((entry) => ({ ...entry })),
      },
      {wallets,receipts},
      scans,
    );
  }
  load() {
    return this.enqueue(() => this.read());
  }
  deleteAllLocalRecords(expectedRevision: string) {
    return this.write(async () => {
      if (!expectedRevision || ledgerRevision(await this.read()) !== expectedRevision)
        throw new LedgerError('Your records changed. Cancel and review deletion again. Nothing was deleted.', 'STALE');
      // Child tables first; categories and schema remain available for a fresh ledger.
      await this.db.exec(`DELETE FROM settlements;
        DELETE FROM scan_receipts;
        DELETE FROM import_receipts;
        DELETE FROM import_wallets;
        DELETE FROM transactions;
        DELETE FROM planned_items;
        DELETE FROM budget_plan;
        DELETE FROM accounts;`);
    });
  }
  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation);
    this.queue = result.catch(() => undefined);
    return result;
  }
  private write(operation: () => Promise<void>) {
    return this.enqueue(async () => {
      await this.db.exec("BEGIN IMMEDIATE;");
      try {
        await operation();
        const snapshot = await this.read(); // Range/integrity checks happen before committing.
        calculateBudget(snapshot, snapshot.budget, this.today());
        await this.db.exec("COMMIT;");
        return snapshot;
      } catch (error) {
        await this.db.exec("ROLLBACK;").catch(() => undefined);
        throw error;
      }
    });
  }
  saveAccount(raw: AccountInput, editing = false) {
    return this.write(async () => {
      const account = validateAccount(raw);
      const duplicates = await this.db.all<{ id: string }>(
        "SELECT id FROM accounts WHERE name = ? COLLATE NOCASE AND id <> ?",
        [account.name, account.id],
      );
      if (duplicates.length)
        throw new LedgerError(
          "An account with this name already exists. Choose a different name.",
        );
      if (editing) {
        if(account.type!=="ewallet"&&(await this.db.all("SELECT wallet_hash FROM import_wallets WHERE account_id=?",[account.id])).length)throw new LedgerError("This account is linked to a TNG statement. Keep its eWallet type.");
        const result = await this.db.run(
          "UPDATE accounts SET name=?,type=?,opening_balance_sen=? WHERE id=?",
          [account.name, account.type, account.openingBalanceSen, account.id],
        );
        if (!result.changes)
          throw new LedgerError(
            "This account no longer exists. Return to your accounts.",
            "NOT_FOUND",
          );
      } else {
        if (
          (
            await this.db.all("SELECT id FROM accounts WHERE id=?", [
              account.id,
            ])
          ).length
        )
          throw new LedgerError(
            "This account has already been saved.",
            "DUPLICATE_ID",
          );
        await this.db.run(
          "INSERT INTO accounts(id,name,type,opening_balance_sen) VALUES (?,?,?,?)",
          [account.id, account.name, account.type, account.openingBalanceSen],
        );
      }
    });
  }
  deleteAccount(id: string) {
    return this.write(async () => {
      if (
        (
          await this.db.all(
            "SELECT id FROM planned_items WHERE accountId=? LIMIT 1",
            [id],
          )
        ).length
      )
        throw new LedgerError(
          "This account has scheduled bills or income. Change or remove those schedules before removing the account.",
        );
      if (
        (
          await this.db.all(
            "SELECT id FROM transactions WHERE account_id=? OR transfer_to_account_id=? LIMIT 1",
            [id, id],
          )
        ).length
      )
        throw new LedgerError(
          "This account has transactions. Move or delete those transactions before removing the account.",
        );
      if (!(await this.db.run("DELETE FROM accounts WHERE id=?", [id])).changes)
        throw new LedgerError("This account no longer exists.", "NOT_FOUND");
    });
  }
  saveTransaction(
    raw: TransactionInput,
    editing = false,
    allowDuplicate = false,
    settlement?: Omit<Settlement, "transactionId">,
  ) {
    return this.write(async () => {
      const input = validateTransaction(raw, this.today());
      const links = await this.db.all<Settlement>(
        "SELECT * FROM settlements WHERE transactionId=?",
        [input.id],
      );
      for (const link of links)
        await this.validateSettlement({ ...link }, input);
      const accounts = await this.db.all<{ id: string }>(
        "SELECT id FROM accounts",
      );
      if (
        !accounts.some((account) => account.id === input.accountId) ||
        (input.transferToAccountId &&
          !accounts.some((account) => account.id === input.transferToAccountId))
      )
        throw new LedgerError("Choose an existing account.");
      if (
        !editing &&
        (
          await this.db.all("SELECT id FROM transactions WHERE id=?", [
            input.id,
          ])
        ).length
      )
        throw new LedgerError(
          "This transaction has already been saved.",
          "DUPLICATE_ID",
        );
      const duplicates = await this.db.all(
        "SELECT id FROM transactions WHERE id<>? AND lower(trim(merchant))=lower(?) AND kind=? AND amount_sen=? AND date=? AND account_id=? AND COALESCE(transfer_to_account_id,'')=COALESCE(?,'') AND category=? LIMIT 1",
        [
          input.id,
          input.merchant,
          input.kind,
          input.amountSen,
          input.date,
          input.accountId,
          input.transferToAccountId,
          input.category,
        ],
      );
      if (duplicates.length && !allowDuplicate)
        throw new LedgerError(
          "A matching transaction already exists. Check your history, or save separately if this was another payment.",
          "DUPLICATE",
        );
      const values = [
        input.merchant,
        input.kind,
        input.category,
        input.amountSen,
        input.date,
        input.accountId,
        input.transferToAccountId,
        input.description,
      ];
      if (editing) {
        if (
          !(
            await this.db.run(
              "UPDATE transactions SET merchant=?,kind=?,category=?,amount_sen=?,date=?,account_id=?,transfer_to_account_id=?,description=? WHERE id=?",
              [...values, input.id],
            )
          ).changes
        )
          throw new LedgerError(
            "This transaction no longer exists. Return to your history.",
            "NOT_FOUND",
          );
      } else
        await this.db.run(
          "INSERT INTO transactions(merchant,kind,category,amount_sen,date,account_id,transfer_to_account_id,description,id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
          [...values, input.id, new Date().toISOString()],
        );
      if (settlement)
        await this.link({ ...settlement, transactionId: input.id }, input);
    });
  }
  deleteTransaction(id: string) {
    return this.write(async () => {
      if (
        !(await this.db.run("DELETE FROM transactions WHERE id=?", [id]))
          .changes
      )
        throw new LedgerError(
          "This transaction no longer exists.",
          "NOT_FOUND",
        );
    });
  }

  importTransactions(accountId:string,walletHash:string,records:ImportRecord[]) {
    return this.write(async()=>{
      const hash=(value:string)=>typeof value==="string"&&/^[a-f0-9]{64}$/.test(value);
      if(!hash(walletHash)||!records.length||records.length>IMPORT_LIMITS.rows)throw new LedgerError("The import is invalid or too large. Review a shorter statement.");
      const before=await this.read();
      if(!before.accounts.some((account)=>account.id===accountId&&account.type==="ewallet"))throw new LedgerError("Choose an existing eWallet account.");
      const mapping=before.imports.wallets.find((entry)=>entry.walletHash===walletHash||entry.accountId===accountId);
      if(mapping&&(mapping.walletHash!==walletHash||mapping.accountId!==accountId))throw new LedgerError("This wallet is linked to a different account. Choose its original eWallet account.");
      const keys=new Set(before.imports.receipts.map((entry)=>entry.sourceKey));
      const ids=new Set(before.transactions.map((entry)=>entry.id));
      const checked:TransactionInput[]=[];
      for(const record of records) {
        if(!hash(record.sourceKey)||!hash(record.sourceFingerprint)||keys.has(record.sourceKey))throw new LedgerError("A statement reference is repeated or already imported. Reopen the statement to refresh the preview.","IMPORT_DUPLICATE");
        const input=validateTransaction(record.input,this.today());
        if(ids.has(input.id))throw new LedgerError("This transaction has already been saved.","DUPLICATE_ID");
        if(record.direction!=="debit"&&record.direction!=="credit")throw new LedgerError("Review the direction of every selected transaction.");
        const incoming=record.direction==="credit";
        if(input.kind==="transfer"?(incoming?input.transferToAccountId!==accountId:input.accountId!==accountId):input.accountId!==accountId||(incoming?input.kind==="expense":input.kind!=="expense"))throw new LedgerError("A transaction type or account does not match its wallet direction.");
        if(!before.accounts.some((a)=>a.id===input.accountId)||(input.transferToAccountId&&!before.accounts.some((a)=>a.id===input.transferToAccountId)))throw new LedgerError("Choose existing accounts for every transaction.");
        if([...before.transactions,...checked].some((other)=>possibleMatch(input,other))&&!record.allowPossibleDuplicate)throw new LedgerError("A selected transaction may already be recorded. Confirm a separate payment or exclude it.","DUPLICATE");
        keys.add(record.sourceKey);ids.add(input.id);checked.push(input);
      }
      if(!mapping)await this.db.run("INSERT INTO import_wallets(wallet_hash,account_id) VALUES (?,?)",[walletHash,accountId]);
      for(let index=0;index<records.length;index++) {
        const input=checked[index],record=records[index];
        await this.db.run("INSERT INTO transactions(id,merchant,kind,category,amount_sen,date,account_id,transfer_to_account_id,description,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",[input.id,input.merchant,input.kind,input.category,input.amountSen,input.date,input.accountId,input.transferToAccountId,input.description,new Date().toISOString()]);
        await this.db.run("INSERT INTO import_receipts(source_key,source_fingerprint,transaction_id,wallet_hash) VALUES (?,?,?,?)",[record.sourceKey,record.sourceFingerprint,input.id,walletHash]);
      }
    });
  }

  saveScannedTransactions(records: ScanRecord[]) {
    return this.write(async () => {
      if (!records.length || records.length > SCAN_LIMITS.rows) throw new LedgerError('Select between 1 and 50 reviewed transactions.');
      const before = await this.read();
      const keys = new Set(before.scans.map(receipt => receipt.sourceKey));
      const ids = new Set(before.transactions.map(record => record.id));
      const checked: TransactionInput[] = [];
      for (const record of records) {
        if (record.reviewed !== true) throw new LedgerError('Compare every selected transaction with the image before saving.');
        if (typeof record.sourceKey !== 'string' || !/^[a-f0-9]{64}$/.test(record.sourceKey) || keys.has(record.sourceKey)) throw new LedgerError('A row from this image is already saved. Reopen the scan to refresh the preview.', 'SCAN_DUPLICATE');
        const input = validateTransaction(record.input, this.today());
        if (ids.has(input.id)) throw new LedgerError('This transaction is already saved.', 'DUPLICATE_ID');
        if (!before.accounts.some(account => account.id === input.accountId) || (input.transferToAccountId && !before.accounts.some(account => account.id === input.transferToAccountId))) throw new LedgerError('Choose existing accounts for every transaction.');
        if ([...before.transactions,...checked].some(other => scanPossibleMatch(input,other)) && record.allowPossibleDuplicate !== true) throw new LedgerError('A selected transaction may already be recorded. Exclude it or confirm a separate payment.', 'DUPLICATE');
        keys.add(record.sourceKey); ids.add(input.id); checked.push(input);
      }
      for (let index = 0; index < records.length; index++) {
        const input = checked[index];
        await this.db.run('INSERT INTO transactions(id,merchant,kind,category,amount_sen,date,account_id,transfer_to_account_id,description,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)', [input.id,input.merchant,input.kind,input.category,input.amountSen,input.date,input.accountId,input.transferToAccountId,input.description,new Date().toISOString()]);
        await this.db.run('INSERT INTO scan_receipts(source_key,transaction_id) VALUES (?,?)', [records[index].sourceKey,input.id]);
      }
    });
  }

  applyCategoryChanges(changes: CategoryChange[]) {
    return this.write(async () => {
      if(!Array.isArray(changes)||!changes.length||changes.length>5)throw new LedgerError('Review between 1 and 5 expense-category changes.');
      const before=await this.read(), seen=new Set<string>();
      for(const change of changes) {
        const record=before.transactions.find(row=>row.id===change.id);
        if(!record||record.kind!=='expense'||seen.has(change.id)||!CATEGORY_IDS.includes(change.category))throw new LedgerError('Choose existing, distinct expenses and valid categories.');
        if(typeof change.expectedRevision!=='string'||categoryRevision(record)!==change.expectedRevision)throw new LedgerError('An expense changed since these suggestions were prepared. Refresh the review before applying.','STALE');
        if(record.category===change.category)throw new LedgerError('Choose a different category, or exclude this unchanged row.');
        seen.add(change.id);
      }
      for(const change of changes)await this.db.run('UPDATE transactions SET category=? WHERE id=?',[change.category,change.id]);
    });
  }

  saveBudgetPlan(raw: BudgetPlan) {
    return this.write(async () => {
      const plan = validatePlan(raw);
      if (plan.startDate > this.today())
        throw new LedgerError("Start the budget today or earlier.");
      if (
        plan.nextIncomeDate <= this.today() &&
        (plan.cycle === "custom" || plan.cycle === "irregular")
      )
        throw new LedgerError(
          "Choose a next income or review date after today.",
        );
      await this.db.run(
        "INSERT INTO budget_plan(id,cycle,startDate,nextIncomeDate,savingsReserveSen,spendingLimitSen) VALUES (1,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET cycle=excluded.cycle,startDate=excluded.startDate,nextIncomeDate=excluded.nextIncomeDate,savingsReserveSen=excluded.savingsReserveSen,spendingLimitSen=excluded.spendingLimitSen",
        [
          plan.cycle,
          plan.startDate,
          plan.nextIncomeDate,
          plan.savingsReserveSen,
          plan.spendingLimitSen,
        ],
      );
    });
  }
  deleteBudgetPlan() {
    return this.write(async () => {
      await this.db.run("DELETE FROM budget_plan WHERE id=1");
    });
  }
  savePlannedItem(raw: PlannedItem, editing = false) {
    return this.write(async () => {
      const item = validatePlannedItem(raw);
      if (
        !(
          await this.db.all("SELECT id FROM accounts WHERE id=?", [
            item.accountId,
          ])
        ).length
      )
        throw new LedgerError("Choose an existing account.");
      const old = (
        await this.db.all<PlannedItem>(
          "SELECT * FROM planned_items WHERE id=?",
          [item.id],
        )
      )[0];
      if (editing && !old)
        throw new LedgerError(
          "This scheduled item no longer exists.",
          "NOT_FOUND",
        );
      if (!editing && old)
        throw new LedgerError(
          "This item has already been saved.",
          "DUPLICATE_ID",
        );
      if (
        old &&
        (
          await this.db.all(
            "SELECT itemId FROM settlements WHERE itemId=? LIMIT 1",
            [item.id],
          )
        ).length &&
        (old.kind !== item.kind ||
          old.amountSen !== item.amountSen ||
          old.date !== item.date ||
          old.repeat !== item.repeat ||
          old.accountId !== item.accountId)
      )
        throw new LedgerError(
          "This schedule has linked records. Unlink them before changing its amount, dates, repeat or account. Its name and category can still change.",
        );
      if (
        !editing &&
        (await this.db.all("SELECT id FROM planned_items")).length >= 100
      )
        throw new LedgerError(
          "You can keep up to 100 scheduled items. Remove an unused item first.",
        );
      await this.db.run(
        "INSERT INTO planned_items(id,name,kind,amountSen,date,repeat,accountId,category) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,kind=excluded.kind,amountSen=excluded.amountSen,date=excluded.date,repeat=excluded.repeat,accountId=excluded.accountId,category=excluded.category",
        [
          item.id,
          item.name,
          item.kind,
          item.amountSen,
          item.date,
          item.repeat,
          item.accountId,
          item.category,
        ],
      );
    });
  }
  deletePlannedItem(id: string) {
    return this.write(async () => {
      if (
        !(await this.db.run("DELETE FROM planned_items WHERE id=?", [id]))
          .changes
      )
        throw new LedgerError(
          "This scheduled item no longer exists.",
          "NOT_FOUND",
        );
    });
  }
  private async validateSettlement(link: Settlement, record: TransactionInput) {
    const item = (
      await this.db.all<PlannedItem>("SELECT * FROM planned_items WHERE id=?", [
        link.itemId,
      ])
    )[0];
    if (!item || !isOccurrence(item, link.dueDate))
      throw new LedgerError("This scheduled occurrence no longer exists.");
    if (
      record.kind !== (item.kind === "bill" ? "expense" : "income") ||
      record.amountSen !== item.amountSen ||
      record.accountId !== item.accountId
    )
      throw new LedgerError(
        "A linked record must match the schedule's type, full amount and account. Unlink it in Bills & income before changing those fields.",
      );
  }
  private async link(link: Settlement, record: TransactionInput) {
    await this.validateSettlement(link, record);
    if (
      (
        await this.db.all(
          "SELECT transactionId FROM settlements WHERE (itemId=? AND dueDate=?) OR transactionId=?",
          [link.itemId, link.dueDate, link.transactionId],
        )
      ).length
    )
      throw new LedgerError(
        "This occurrence or transaction is already linked. Review its saved record.",
      );
    await this.db.run(
      "INSERT INTO settlements(itemId,dueDate,transactionId) VALUES (?,?,?)",
      [link.itemId, link.dueDate, link.transactionId],
    );
  }
  linkPlannedRecord(link: Settlement) {
    return this.write(async () => {
      const snapshot = await this.read();
      const record = snapshot.transactions.find(
        (entry) => entry.id === link.transactionId,
      );
      if (!record) throw new LedgerError("Choose an existing transaction.");
      await this.link(link, record);
    });
  }
  unlinkPlannedRecord(itemId: string, dueDate: string) {
    return this.write(async () => {
      if (
        !(
          await this.db.run(
            "DELETE FROM settlements WHERE itemId=? AND dueDate=?",
            [itemId, dueDate],
          )
        ).changes
      )
        throw new LedgerError("This occurrence is no longer linked.");
    });
  }
}
