import type { CategoryId, TransactionInput, TransactionKind } from '../types/finance.ts';

export const SCAN_LIMITS = { bytes: 10 * 1024 * 1024, pixels: 12000000, lines: 500, characters: 50000, rows: 50, timeoutMs: 120000 } as const;
export interface OcrLine { text: string; confidence: number; x: number; y: number; width: number; height: number }
export interface OcrExtraction { text: string; lines: OcrLine[]; width: number; height: number }
export interface ScanCandidate {
  index: number;
  merchant: string;
  amount: string;
  date: string;
  kind: TransactionKind | 'unresolved';
  direction: 'debit' | 'credit' | '';
  warnings: string[];
  sourceText: string;
}
export interface ScanDraft extends ScanCandidate {
  id: string;
  sourceKey: string;
  category: CategoryId;
  otherAccountId: string;
  reviewed: boolean;
  include: boolean;
  duplicateApproved: boolean;
  locked: boolean;
}
export interface ScanReceipt { sourceKey: string; transactionId: string }
export interface ScanRecord { input: TransactionInput; sourceKey: string; reviewed: boolean; allowPossibleDuplicate: boolean }
export type ScanMode = 'receipt' | 'activity';
