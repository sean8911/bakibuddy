import type { LedgerSnapshot, TransactionInput } from "../types/finance.ts";
import { LedgerError, safeSen, validateTransaction } from "../utils/validation.ts";
import type { ImportDraft, ImportRecord, TngStatement } from "./types.ts";
export const normalizedName = (text: string) => text.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-MY");
/** Transfers can already have been entered from the other account, with a different name. */
export function possibleMatch(a: TransactionInput, b: TransactionInput) {
    return a.kind === b.kind && a.amountSen === b.amountSen && a.date === b.date && a.accountId === b.accountId && a.transferToAccountId === b.transferToAccountId && (a.kind === "transfer" || normalizedName(a.merchant) === normalizedName(b.merchant));
}
export function draftInput(row: ImportDraft, accountId: string): TransactionInput {
    if (row.kind === "unresolved" || row.direction === "unknown")
        throw new LedgerError(`Review the type and direction for row ${row.index}.`);
    const transfer = row.kind === "transfer", incoming = row.direction === "credit";
    if (transfer && (!row.otherAccountId || row.otherAccountId === accountId))
        throw new LedgerError(`Choose the other tracked account for row ${row.index}.`);
    if (!transfer && ((incoming && row.kind === "expense") || (!incoming && row.kind !== "expense")))
        throw new LedgerError(`The type does not match the money direction for row ${row.index}.`);
    return { id: row.id, merchant: row.merchant, kind: row.kind, category: row.category, amountSen: row.amountSen, date: row.date, accountId: transfer && incoming ? row.otherAccountId : accountId, transferToAccountId: transfer ? (incoming ? accountId : row.otherAccountId) : null, description: `Imported from TNG · ${row.sourceType}` };
}
export async function prepareDrafts(statement: TngStatement, accountId: string, snapshot: LedgerSnapshot, hash: (value: string) => Promise<string>, uuid: () => string) {
    const walletHash = await hash(`tng-wallet-v1:${statement.walletId}`);
    const existing = snapshot.imports.wallets.find((entry) => entry.walletHash === walletHash || entry.accountId === accountId);
    if (existing && (existing.walletHash !== walletHash || existing.accountId !== accountId))
        throw new LedgerError("This wallet is linked to a different account, or this account belongs to another wallet. Choose its original eWallet account.");
    const seen = new Set<string>();
    const rows: ImportDraft[] = [];
    for (const row of statement.rows) {
        const sourceKey = await hash(JSON.stringify(["tng-row-v1", statement.walletId, row.sourceType.toLowerCase().replace(/\s+/g, ""), row.reference]));
        const sourceFingerprint = await hash(JSON.stringify([row.date, row.amountSen, row.sourceType, row.merchant, row.reference]));
        const prior = snapshot.imports.receipts.find((entry) => entry.sourceKey === sourceKey);
        const lockedReason = prior ? (prior.sourceFingerprint === sourceFingerprint ? "Already imported" : "Reference conflicts with an earlier import. Check the original statement.") : seen.has(sourceKey) ? "Repeated reference in this file" : undefined;
        seen.add(sourceKey);
        const draft: ImportDraft = { ...row, sourceKey, sourceFingerprint, id: uuid(), include: false, kind: row.suggestedKind ?? "unresolved", category: "other", otherAccountId: "", possibleDuplicate: false, duplicateApproved: false, lockedReason };
        try {
            draft.possibleDuplicate = snapshot.transactions.some((transaction) => possibleMatch(draftInput(draft, accountId), transaction));
        }
        catch { /* Unresolved rows are checked after review. */ }
        rows.push(draft);
    }
    return { walletHash, rows };
}
export function selectedRecords(rows: ImportDraft[], accountId: string, snapshot: LedgerSnapshot, today: string): ImportRecord[] {
    const records: ImportRecord[] = [];
    for (const row of rows.filter((entry) => entry.include)) {
        if (row.lockedReason)
            throw new LedgerError(`Row ${row.index}: ${row.lockedReason}.`);
        const input = validateTransaction(draftInput(row, accountId), today);
        const duplicate = [...snapshot.transactions, ...records.map((entry) => entry.input)].some((other) => possibleMatch(input, other));
        if (duplicate && !row.duplicateApproved)
            throw new LedgerError(`Row ${row.index} may already be recorded. Review it and confirm a separate transaction, or exclude it.`);
        records.push({ input, sourceKey: row.sourceKey, sourceFingerprint: row.sourceFingerprint, direction: row.direction as "debit" | "credit", allowPossibleDuplicate: row.duplicateApproved });
    }
    if (!records.length)
        throw new LedgerError("Select at least one reviewed transaction to import.");
    return records;
}
export function importTotals(records: readonly { input: TransactionInput }[]) {
    let expenses = 0n, income = 0n, refunds = 0n, transfers = 0n;
    for (const { input } of records) {
        const n = BigInt(input.amountSen);
        if (input.kind === "expense")
            expenses += n;
        if (input.kind === "income")
            income += n;
        if (input.kind === "refund")
            refunds += n;
        if (input.kind === "transfer")
            transfers += n;
    }
    return { expenses: safeSen(expenses), income: safeSen(income), refunds: safeSen(refunds), transfers: safeSen(transfers) };
}
