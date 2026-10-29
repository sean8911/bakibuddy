import type { LedgerSnapshot } from '../types/finance.ts';
import { LedgerError } from '../utils/validation.ts';

export type ExportFormat = 'json' | 'csv';
export interface LedgerExport { name: string; mime: string; content: string }
export const EXPORT_LIMIT_BYTES = 20 * 1024 * 1024;

/** Full local revision: a confirmation must cover contents, not just record counts. */
export function ledgerRevision(snapshot: LedgerSnapshot): string {
  return JSON.stringify(snapshot);
}

function csvCell(value: string | number): string {
  let text = String(value);
  // Quote delimiters/newlines and neutralize spreadsheet formula prefixes, including locale variants.
  if (typeof value === 'string' && /^[\s\uFEFF]*[=+\-@＝＋－＠\t\r\n]/u.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
function decimalSen(sen: number): string {
  const value = BigInt(sen);
  const absolute = value < 0n ? -value : value;
  return `${value < 0n ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
}
function assertBounded(value: unknown) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new LedgerError('A recorded amount is outside the supported range. Your records have not changed.');
  if (Array.isArray(value)) {
    if (value.length > 100000) throw new LedgerError('This export has too many records. Your records have not changed.');
    value.forEach(assertBounded);
  } else if (value && typeof value === 'object') Object.values(value).forEach(assertBounded);
}

export function createLedgerExport(snapshot: LedgerSnapshot, format: ExportFormat, exportedAt = new Date().toISOString()): LedgerExport {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(exportedAt) || !Number.isFinite(Date.parse(exportedAt))) throw new LedgerError('The export date is invalid. Try again.');
  if (format !== 'json' && format !== 'csv') throw new LedgerError('Choose JSON or CSV.');
  const accounts = snapshot.accounts.map(({ id, name, type, openingBalanceSen }) => ({ id, name, type, openingBalanceSen }));
  const transactions = snapshot.transactions.map(({ id, merchant, kind, category, amountSen, date, accountId, transferToAccountId, description }) => ({ id, merchant, kind, category, amountSen, date, accountId, transferToAccountId, description }));
  const budget = {
    plan: snapshot.budget.plan && (({cycle,startDate,nextIncomeDate,savingsReserveSen,spendingLimitSen}) => ({cycle,startDate,nextIncomeDate,savingsReserveSen,spendingLimitSen}))(snapshot.budget.plan),
    items: snapshot.budget.items.map(({id,name,kind,amountSen,date,repeat,accountId,category}) => ({id,name,kind,amountSen,date,repeat,accountId,category})),
    settlements: snapshot.budget.settlements.map(({itemId,dueDate,transactionId}) => ({itemId,dueDate,transactionId})),
  };
  const imports = {
    wallets: snapshot.imports.wallets.map(({walletHash,accountId}) => ({walletHash,accountId})),
    receipts: snapshot.imports.receipts.map(({sourceKey,sourceFingerprint,transactionId}) => ({sourceKey,sourceFingerprint,transactionId})),
  };
  const scans = snapshot.scans.map(({sourceKey,transactionId}) => ({sourceKey,transactionId}));
  const archive = { format: 'bakibuddy-reference', formatVersion: 1, schemaVersion: 4, currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', exportedAt, accounts, transactions, budget, imports, scans };
  assertBounded(archive);
  let content: string;
  if (format === 'json') content = JSON.stringify(archive, null, 2) + '\n';
  else {
    const names = new Map(accounts.map(account => [account.id, account.name]));
    const rows: (string | number)[][] = [['id','merchant','kind','category','amount_sen','amount_myr','date','account_id','account_name','transfer_to_account_id','transfer_to_account_name','description']];
    for (const record of transactions) rows.push([record.id,record.merchant,record.kind,record.category,record.amountSen,decimalSen(record.amountSen),record.date,record.accountId,names.get(record.accountId) ?? '',record.transferToAccountId ?? '',names.get(record.transferToAccountId ?? '') ?? '',record.description]);
    content = '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }
  if (new TextEncoder().encode(content).byteLength > EXPORT_LIMIT_BYTES) throw new LedgerError('The export exceeds 20 MB. Your records have not changed.');
  return { name: `bakibuddy-${exportedAt.replaceAll(/[:.]/g,'-')}.${format}`, mime: format === 'json' ? 'application/json' : 'text/csv', content };
}
