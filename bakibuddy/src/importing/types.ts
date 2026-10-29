import type { CategoryId, TransactionInput, TransactionKind } from "../types/finance.ts";
export const IMPORT_LIMITS = { bytes: 5 * 1024 * 1024, pages: 100, rows: 2000, textSegments: 100000, textCharacters: 2000000 } as const;
export interface PdfSegment {
    text: string;
    x: number;
    y: number;
}
export interface PdfPage {
    width: number;
    height: number;
    items: PdfSegment[];
}
export interface PdfExtraction {
    pages: PdfPage[];
}
export type Direction = "debit" | "credit" | "unknown";
export interface TngRow {
    index: number;
    reference: string;
    date: string;
    sourceType: string;
    status: string;
    merchant: string;
    amountSen: number;
    walletBalanceSen: number;
    direction: Direction;
    suggestedKind: TransactionKind | null;
}
export interface TngStatement {
    walletId: string;
    startDate: string;
    endDate: string;
    pageCount: number;
    rows: TngRow[];
    goPlusRows: number;
    unsuccessfulRows: number;
}
export interface ImportDraft extends TngRow {
    sourceKey: string;
    sourceFingerprint: string;
    id: string;
    include: boolean;
    kind: TransactionKind | "unresolved";
    category: CategoryId;
    otherAccountId: string;
    possibleDuplicate: boolean;
    duplicateApproved: boolean;
    lockedReason?: string;
}
export interface ImportRecord {
    input: TransactionInput;
    sourceKey: string;
    sourceFingerprint: string;
    direction: Exclude<Direction, "unknown">;
    allowPossibleDuplicate: boolean;
}
export interface ImportHistory {
    wallets: {
        walletHash: string;
        accountId: string;
    }[];
    receipts: {
        sourceKey: string;
        sourceFingerprint: string;
        transactionId: string;
    }[];
}
export const emptyImportHistory = (): ImportHistory => ({ wallets: [], receipts: [] });
