import {
  ACCOUNT_TYPES,
  CATEGORY_IDS,
  type AccountInput,
  type TransactionInput,
} from "../types/finance.ts";
import { formatFinancialDate, todayInKL } from "./dates.ts";

export class LedgerError extends Error {
  readonly code: string;
  constructor(message: string, code = "VALIDATION") {
    super(message);
    this.name = "LedgerError";
    this.code = code;
  }
}

export function safeSen(value: bigint): number {
  if (
    value > BigInt(Number.MAX_SAFE_INTEGER) ||
    value < BigInt(Number.MIN_SAFE_INTEGER)
  )
    throw new LedgerError(
      "These amounts exceed the supported range. Reduce the amount and try again.",
    );
  return Number(value);
}

export function parseAmount(input: string, allowNegative = false): number {
  if (typeof input !== "string")
    throw new LedgerError("Enter a valid amount such as 12.50.");
  const text = input.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(text))
    throw new LedgerError(
      "Enter an amount such as 12.50, with at most two decimal places and no commas.",
    );
  const negative = text.startsWith("-");
  if (negative && !allowNegative)
    throw new LedgerError("Enter an amount greater than zero.");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const result = safeSen(
    (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"))) *
      (negative ? -1n : 1n),
  );
  if (!allowNegative && result <= 0)
    throw new LedgerError("Enter an amount greater than zero.");
  return result;
}

export function editableAmount(sen: number): string {
  const absolute = Math.abs(sen);
  return `${sen < 0 ? "-" : ""}${Math.trunc(absolute / 100)}.${String(absolute % 100).padStart(2, "0")}`;
}

function id(value: string) {
  if (typeof value !== "string" || !value.trim() || value.length > 100)
    throw new LedgerError("The record identifier is invalid. Reopen the form.");
}
function integer(value: number) {
  if (!Number.isSafeInteger(value))
    throw new LedgerError(
      "Amounts must use whole sen within the supported range.",
    );
}

export function validateAccount(input: AccountInput): AccountInput {
  id(input.id);
  integer(input.openingBalanceSen);
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 60)
    throw new LedgerError("Enter an account name between 1 and 60 characters.");
  if (!(ACCOUNT_TYPES as readonly string[]).includes(input.type))
    throw new LedgerError("Choose a valid account type.");
  return { ...input, name };
}

export function validateTransaction(
  input: TransactionInput,
  today = todayInKL(),
): TransactionInput {
  id(input.id);
  id(input.accountId);
  integer(input.amountSen);
  if (input.amountSen <= 0)
    throw new LedgerError("Enter an amount greater than zero.");
  if (!["expense", "income", "refund", "transfer"].includes(input.kind))
    throw new LedgerError("Choose a valid transaction type.");
  if (!(CATEGORY_IDS as readonly string[]).includes(input.category))
    throw new LedgerError("Choose a valid category.");
  const merchant =
    typeof input.merchant === "string" ? input.merchant.trim() : "";
  if (typeof input.description !== "string")
    throw new LedgerError("Enter a valid description, or leave it empty.");
  const description = input.description.trim();
  if (!merchant || merchant.length > 80)
    throw new LedgerError("Enter a title between 1 and 80 characters.");
  if (description.length > 300)
    throw new LedgerError("Keep the description to 300 characters or fewer.");
  try {
    formatFinancialDate(input.date);
  } catch {
    throw new LedgerError("Choose a valid transaction date.");
  }
  if (input.date < "1900-01-01" || input.date > today)
    throw new LedgerError(
      "Use a date from 1900 through today. Add future bills or income in Bills & income.",
    );
  if (input.kind === "transfer") {
    if (
      !input.transferToAccountId ||
      input.transferToAccountId === input.accountId
    )
      throw new LedgerError(
        "Choose a different receiving account for the transfer.",
      );
    id(input.transferToAccountId);
  } else if (input.transferToAccountId !== null)
    throw new LedgerError("Only transfers can have a receiving account.");
  return {
    ...input,
    merchant,
    description,
    category:
      input.kind === "income" || input.kind === "transfer"
        ? "other"
        : input.category,
  };
}

export function errorMessage(error: unknown): string {
  return error instanceof LedgerError
    ? error.message
    : "The local database could not complete this action. Your form is still here; try again.";
}
