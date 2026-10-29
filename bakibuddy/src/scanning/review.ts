import type { LedgerSnapshot, TransactionInput } from '../types/finance.ts';
import { LedgerError, parseAmount, validateTransaction } from '../utils/validation.ts';
import type { ScanCandidate, ScanDraft, ScanRecord } from './types.ts';

/** OCR names/types may differ from a manual or PDF entry. Err toward showing a warning. */
export function scanPossibleMatch(a: TransactionInput, b: TransactionInput) {
  if (a.date !== b.date || a.amountSen !== b.amountSen) return false;
  const accountsA = [a.accountId, a.transferToAccountId].filter(Boolean);
  const accountsB = [b.accountId, b.transferToAccountId].filter(Boolean);
  return accountsA.some(account => accountsB.includes(account));
}
export function scanInput(row: ScanDraft, accountId: string): TransactionInput {
  if (row.kind === 'unresolved') throw new LedgerError(`Row ${row.index}: choose the transaction type.`);
  const transfer = row.kind === 'transfer', incoming = row.direction === 'credit';
  if (transfer && (!row.direction || !row.otherAccountId || row.otherAccountId === accountId)) throw new LedgerError(`Row ${row.index}: choose the transfer direction and other tracked account.`);
  return { id: row.id, merchant: row.merchant, kind: row.kind, amountSen: parseAmount(row.amount), category: transfer ? 'other' : row.category, date: row.date, accountId: transfer && incoming ? row.otherAccountId : accountId, transferToAccountId: transfer ? incoming ? accountId : row.otherAccountId : null, description: 'Reviewed image scan' };
}
export async function prepareScanDrafts(candidates: ScanCandidate[], imageHash: string, snapshot: LedgerSnapshot, hash: (value: string) => Promise<string>, uuid: () => string): Promise<ScanDraft[]> {
  const rows: ScanDraft[] = [];
  for (const candidate of candidates) {
    const sourceKey = await hash(JSON.stringify(['scan-row-v1', imageHash, candidate.index]));
    rows.push({ ...candidate, id: uuid(), sourceKey, category: 'other', otherAccountId: '', reviewed: false, include: false, duplicateApproved: false, locked: snapshot.scans.some(receipt => receipt.sourceKey === sourceKey) });
  }
  return rows;
}
export function selectedScanRecords(rows: ScanDraft[], accountId: string, snapshot: LedgerSnapshot, today: string): ScanRecord[] {
  const records: ScanRecord[] = [];
  for (const row of rows.filter(candidate => candidate.include)) {
    if (row.locked || snapshot.scans.some(receipt => receipt.sourceKey === row.sourceKey)) throw new LedgerError(`Row ${row.index} is already saved from this image. Reopen the scan to refresh its status.`);
    if (row.reviewed !== true) throw new LedgerError(`Review row ${row.index} against the image before selecting it.`);
    const input = validateTransaction(scanInput(row, accountId), today);
    if ([...snapshot.transactions,...records.map(record => record.input)].some(other => scanPossibleMatch(input,other)) && !row.duplicateApproved) throw new LedgerError(`Row ${row.index} may already be recorded. Exclude it or confirm a separate payment.`);
    records.push({ input, sourceKey: row.sourceKey, reviewed: true, allowPossibleDuplicate: row.duplicateApproved });
  }
  if (!records.length) throw new LedgerError('Review and select at least one transaction.');
  return records;
}
