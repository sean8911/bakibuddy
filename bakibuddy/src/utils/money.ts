/** Display integer sen without using floating-point currency arithmetic. */
export function formatMYR(amountSen: number): string {
  if (!Number.isSafeInteger(amountSen)) {
    throw new RangeError("Money must be a safe integer number of sen.");
  }

  const absolute = Math.abs(amountSen);
  const ringgit = Math.trunc(absolute / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const sen = (absolute % 100).toString().padStart(2, "0");
  return `${amountSen < 0 ? "−" : ""}RM${ringgit}.${sen}`;
}
