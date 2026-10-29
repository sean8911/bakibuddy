import type { CategoryId } from "./finance.ts";

export type CycleKind = "weekly" | "monthly" | "custom" | "irregular";
export type RepeatKind = "once" | "weekly" | "monthly";
export interface BudgetPlan {
  cycle: CycleKind;
  startDate: string;
  nextIncomeDate: string;
  savingsReserveSen: number;
  spendingLimitSen: number | null;
}
export interface PlannedItem {
  id: string;
  name: string;
  kind: "bill" | "income";
  amountSen: number;
  date: string;
  repeat: RepeatKind;
  accountId: string;
  category: CategoryId;
}
export interface Settlement {
  itemId: string;
  dueDate: string;
  transactionId: string;
}
export interface BudgetData {
  plan: BudgetPlan | null;
  items: PlannedItem[];
  settlements: Settlement[];
}
export interface Occurrence extends PlannedItem {
  dueDate: string;
  transactionId: string | null;
}
export const emptyBudget = (): BudgetData => ({
  plan: null,
  items: [],
  settlements: [],
});
