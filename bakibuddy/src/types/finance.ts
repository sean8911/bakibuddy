import type { BudgetData } from "./budget.ts";
import type { ImportHistory } from "../importing/types.ts";
export type TransactionKind = "expense" | "income" | "transfer" | "refund";
export const CATEGORY_IDS = [
  "food",
  "transport",
  "shopping",
  "entertainment",
  "education",
  "bills",
  "subscriptions",
  "health",
  "groceries",
  "other",
] as const;
export const ACCOUNT_TYPES = ["bank", "ewallet", "cash", "other"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export interface AccountInput {
  id: string;
  name: string;
  type: AccountType;
  openingBalanceSen: number;
}
export interface Account extends AccountInput {
  balanceSen: number;
}
export interface TransactionInput {
  id: string;
  merchant: string;
  kind: TransactionKind;
  category: CategoryId;
  amountSen: number;
  date: string;
  accountId: string;
  transferToAccountId: string | null;
  description: string;
}
export interface LedgerTransaction extends TransactionInput {
  account: string;
  note: string;
}
export interface LedgerTotals {
  balanceSen: number;
  incomeSen: number;
  expenseSen: number;
  refundSen: number;
}
export interface LedgerSnapshot {
  scans: import('../scanning/types.ts').ScanReceipt[];
  imports: ImportHistory;
  budget: BudgetData;
  accounts: Account[];
  transactions: LedgerTransaction[];
  totals: LedgerTotals;
}
export type CategoryId =
  | "food"
  | "transport"
  | "shopping"
  | "entertainment"
  | "education"
  | "bills"
  | "subscriptions"
  | "health"
  | "groceries"
  | "other";

export interface TransactionDisplay {
  readonly id: string;
  readonly merchant: string;
  readonly kind: TransactionKind;
  readonly category: CategoryId;
  readonly amountSen: number;
  readonly date: string;
  readonly account: string;
  readonly note?: string;
}
/** Historical Phase 1 fixtures only; production records use LedgerTransaction. */
export type DemoTransaction = TransactionDisplay;

export interface DemoBudget {
  readonly category: CategoryId;
  readonly limitSen: number;
  readonly spentSen: number;
  readonly percentage: number;
}
