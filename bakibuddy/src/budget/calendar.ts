import { formatFinancialDate } from "../utils/dates.ts";
import { LedgerError } from "../utils/validation.ts";
import type {
  BudgetPlan,
  PlannedItem,
  Occurrence,
  Settlement,
} from "../types/budget.ts";

const DAY = 86_400_000;
export function dayNumber(date: string): number {
  formatFinancialDate(date);
  return Date.parse(`${date}T00:00:00Z`) / DAY;
}
export function addDays(date: string, days: number): string {
  return new Date((dayNumber(date) + days) * DAY).toISOString().slice(0, 10);
}
/** Shift from the original anchor: Jan 31 -> Feb 28 -> Mar 31. */
export function addMonths(anchor: string, months: number): string {
  dayNumber(anchor);
  const [year, month, day] = anchor.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1 + months, 1));
  const last = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(day, last));
  return first.toISOString().slice(0, 10);
}
export function activeCycle(plan: BudgetPlan, today: string) {
  const now = dayNumber(today);
  let start = plan.startDate,
    end = plan.nextIncomeDate;
  if (today >= end && (plan.cycle === "weekly" || plan.cycle === "monthly")) {
    if (plan.cycle === "weekly") {
      const step = Math.floor((now - dayNumber(end)) / 7) + 1;
      start = addDays(end, (step - 1) * 7);
      end = addDays(end, step * 7);
    } else {
      const anchor = end;
      const [year, month] = today.split("-").map(Number);
      const [anchorYear, anchorMonth] = anchor.split("-").map(Number);
      let step = Math.max(0, (year - anchorYear) * 12 + month - anchorMonth);
      if (addMonths(anchor, step) <= today) step++;
      start = addMonths(anchor, step - 1);
      end = addMonths(anchor, step);
    }
  }
  return {
    start,
    end,
    days: Math.max(0, dayNumber(end) - now),
    expired: today >= end,
    upcoming: today < start,
  };
}
export function occurrences(
  items: PlannedItem[],
  settlements: Settlement[],
  endExclusive: string,
): Occurrence[] {
  const settled = new Map(
    settlements.map((s) => [`${s.itemId}/${s.dueDate}`, s.transactionId]),
  );
  const result: Occurrence[] = [];
  for (const item of items) {
    for (let index = 0; index < 12000; index++) {
      const dueDate =
        item.repeat === "monthly"
          ? addMonths(item.date, index)
          : item.repeat === "weekly"
            ? addDays(item.date, index * 7)
            : item.date;
      if (dueDate >= endExclusive) break;
      result.push({
        ...item,
        dueDate,
        transactionId: settled.get(`${item.id}/${dueDate}`) ?? null,
      });
      if (item.repeat === "once") break;
      if (index === 11999)
        throw new LedgerError(
          "This schedule is too long. Start it from a more recent date.",
        );
    }
  }
  return result.sort(
    (a, b) =>
      a.dueDate.localeCompare(b.dueDate) ||
      a.kind.localeCompare(b.kind) ||
      a.id.localeCompare(b.id),
  );
}
export function isOccurrence(item: PlannedItem, date: string): boolean {
  dayNumber(date);
  if (date < item.date) return false;
  if (item.repeat === "once") return date === item.date;
  if (item.repeat === "weekly")
    return (dayNumber(date) - dayNumber(item.date)) % 7 === 0;
  const [year, month] = date.split("-").map(Number);
  const [anchorYear, anchorMonth] = item.date.split("-").map(Number);
  return (
    addMonths(item.date, (year - anchorYear) * 12 + month - anchorMonth) ===
    date
  );
}
