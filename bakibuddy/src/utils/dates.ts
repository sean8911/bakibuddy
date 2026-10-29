export const FINANCIAL_TIMEZONE = "Asia/Kuala_Lumpur";

export function todayInKL(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: FINANCIAL_TIMEZONE,
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function longFinancialDate(date: string): string {
  formatFinancialDate(date);
  return new Intl.DateTimeFormat("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: FINANCIAL_TIMEZONE,
  }).format(new Date(`${date}T12:00:00+08:00`));
}

/** Planned schedules can span years; their labels must disambiguate occurrences. */
export function formatBudgetDate(date: string): string {
  return `${formatFinancialDate(date)} ${date.slice(0, 4)}`;
}

/** ISO date-only values use noon in KL, so parsing cannot shift the financial day. */
export function formatFinancialDate(date: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new RangeError("Expected an ISO date.");
  const instant = new Date(`${date}T12:00:00+08:00`);
  if (
    Number.isNaN(instant.getTime()) ||
    instant.toISOString().slice(0, 10) !== date
  ) {
    throw new RangeError("Expected a valid calendar date.");
  }
  return new Intl.DateTimeFormat("en-MY", {
    day: "numeric",
    month: "short",
    timeZone: FINANCIAL_TIMEZONE,
  }).format(instant);
}
