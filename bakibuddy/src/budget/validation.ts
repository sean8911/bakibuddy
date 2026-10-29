import type { BudgetPlan, PlannedItem } from "../types/budget.ts";
import { CATEGORY_IDS } from "../types/finance.ts";
import { LedgerError } from "../utils/validation.ts";
import { dayNumber } from "./calendar.ts";

function amount(value: number, zero = true) {
  if (!Number.isSafeInteger(value) || value < (zero ? 0 : 1))
    throw new LedgerError(
      zero
        ? "Use a zero or positive amount in whole sen."
        : "Enter an amount greater than zero in whole sen.",
    );
}
function date(value: string) {
  try {
    dayNumber(value);
  } catch {
    throw new LedgerError("Choose a valid calendar date.");
  }
  if (value < "1900-01-01" || value > "2100-12-31")
    throw new LedgerError("Choose a date from 1900 through 2100.");
}
export function validatePlan(plan: BudgetPlan): BudgetPlan {
  if (!["weekly", "monthly", "custom", "irregular"].includes(plan.cycle))
    throw new LedgerError("Choose an income cycle.");
  date(plan.startDate);
  date(plan.nextIncomeDate);
  const days = dayNumber(plan.nextIncomeDate) - dayNumber(plan.startDate);
  if (days < 1 || days > 366)
    throw new LedgerError(
      "The next income or review date must be 1 to 366 days after the cycle starts.",
    );
  if (plan.cycle === "weekly" && days > 7)
    throw new LedgerError(
      "A first weekly cycle can be at most 7 days. Choose a nearer payday.",
    );
  if (plan.cycle === "monthly" && days > 31)
    throw new LedgerError(
      "A first monthly cycle can be at most 31 days. Choose a nearer payday.",
    );
  amount(plan.savingsReserveSen);
  if (plan.spendingLimitSen !== null) amount(plan.spendingLimitSen);
  return { ...plan };
}
export function validatePlannedItem(item: PlannedItem): PlannedItem {
  if (typeof item.id !== "string" || !item.id.trim() || item.id.length > 100)
    throw new LedgerError("Reopen this scheduled item and try again.");
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name || name.length > 80)
    throw new LedgerError("Enter a name between 1 and 80 characters.");
  if (!["bill", "income"].includes(item.kind))
    throw new LedgerError("Choose a bill or expected income.");
  if (!["once", "weekly", "monthly"].includes(item.repeat))
    throw new LedgerError("Choose a valid repeat schedule.");
  if (!(CATEGORY_IDS as readonly string[]).includes(item.category))
    throw new LedgerError("Choose a valid category.");
  if (typeof item.accountId !== "string" || !item.accountId)
    throw new LedgerError("Choose an account.");
  amount(item.amountSen, false);
  date(item.date);
  return {
    ...item,
    name,
    category: item.kind === "income" ? "other" : item.category,
  };
}
