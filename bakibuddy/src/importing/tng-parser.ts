import { formatFinancialDate } from "../utils/dates.ts";
import { LedgerError, parseAmount } from "../utils/validation.ts";
import { IMPORT_LIMITS, type PdfExtraction, type TngRow, type TngStatement, type Direction } from "./types.ts";
const clean = (value: string) => value.normalize("NFKC").replace(/\s+/g, " ").trim();
const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const column = (x: number) => x < 60 ? 0 : x < 120 ? 1 : x < 225 ? 2 : x < 290 ? 3 : x < 450 ? 4 : x < 650 ? 5 : x < 745 ? 6 : 7;
const fail = (message: string): never => { throw new LedgerError(message, "IMPORT_FORMAT"); };
function date(value: string) {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
    if (!match)
        return fail("A transaction date is missing or unsupported. Use the original TNG eWallet export.");
    const result = `${match[3]}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
    try {
        formatFinancialDate(result);
    }
    catch {
        return fail("The statement contains an invalid transaction date.");
    }
    return result;
}
function period(value: string) {
    const match = /^(\d{1,2}) ([A-Za-z]+) (\d{4})\s*-\s*(\d{1,2}) ([A-Za-z]+) (\d{4})$/.exec(value);
    if (!match)
        return null;
    const one = months.indexOf(match[2].toLowerCase()) + 1, two = months.indexOf(match[5].toLowerCase()) + 1;
    if (!one || !two)
        return null;
    return { start: date(`${match[1]}/${one}/${match[3]}`), end: date(`${match[4]}/${two}/${match[6]}`) };
}
function currency(value: string, positive: boolean) {
    if (!/^RM(?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2}$/.test(value))
        return fail("An amount is missing or malformed. No records were saved.");
    const amount = parseAmount(value.slice(2).replaceAll(",", ""), true);
    if (positive && amount <= 0)
        return fail("The statement contains a zero or invalid transaction amount.");
    return amount;
}
function classification(type: string): {
    direction: Direction;
    suggestedKind: "expense" | null;
} {
    const label = type.toLowerCase().replaceAll(" ", "");
    if (["duitnowqr", "duitnowqrtngd", "payment", "rfidpayment", "paydirect"].includes(label))
        return { direction: "debit", suggestedKind: "expense" };
    if (["transfertowallet", "ewalletcashout"].includes(label))
        return { direction: "debit", suggestedKind: null };
    if (["receivefromwallet", "reload", "ewalletcashin", "duitnow_receivefrom"].includes(label))
        return { direction: "credit", suggestedKind: null };
    return { direction: "unknown", suggestedKind: null };
}
/** Supports the eight-column, text-based TNG wallet layout verified against the supplied PDF. */
export function parseTngStatement(input: PdfExtraction, today: string): TngStatement {
    if (!input || !Array.isArray(input.pages) || input.pages.length < 1 || input.pages.length > IMPORT_LIMITS.pages)
        return fail("Choose a supported statement with 1 to 100 pages.");
    let title = false, tableHeader = false, walletId = "", selectedPeriod: ReturnType<typeof period> = null, mode: "none" | "wallet" | "goplus" = "none";
    let row: string[][] | undefined, goPlusRows = 0, unsuccessfulRows = 0, segmentCount = 0, characters = 0;
    const rows: TngRow[] = [];
    const finish = () => {
        if (!row)
            return;
        const cell = row.map((parts) => clean(parts.join(" ")));
        const reference = row[3].join("").replace(/\s+/g, "");
        row = undefined;
        if (cell[1].toLowerCase() !== "success") {
            if (!["failed", "cancelled", "canceled", "pending"].includes(cell[1].toLowerCase()))
                return fail("A transaction status is missing or unsupported. No records were saved.");
            unsuccessfulRows++;
            return;
        }
        const sourceType = cell[2].includes("_") ? cell[2].replaceAll(" ", "") : cell[2];
        if (!sourceType || !reference || !/^[A-Za-z0-9_-]{8,160}$/.test(reference))
            return fail("A transaction type or reference is incomplete. Use the original exported PDF.");
        const recordDate = date(cell[0]);
        if (recordDate < "1900-01-01" || recordDate > today || !selectedPeriod || recordDate < selectedPeriod.start || recordDate > selectedPeriod.end)
            return fail("A transaction falls outside the statement period or is later than today.");
        const merchant = clean(cell[4]) || sourceType;
        if (merchant.length > 300)
            return fail("A description exceeds the supported statement layout.");
        rows.push({ index: rows.length + 1, reference, date: recordDate, sourceType, status: cell[1], merchant, amountSen: currency(cell[6], true), walletBalanceSen: currency(cell[7], false), ...classification(sourceType) });
        if (rows.length > IMPORT_LIMITS.rows)
            return fail("This statement exceeds 2,000 wallet transactions. Export a shorter range.");
    };
    for (const page of input.pages) {
        if (!page || !Number.isFinite(page.width) || !Number.isFinite(page.height) || Math.abs(page.width - 842) > 4 || Math.abs(page.height - 595) > 4 || !Array.isArray(page.items))
            return fail("This PDF layout is not supported. Choose the original landscape TNG eWallet statement.");
        segmentCount += page.items.length;
        if (segmentCount > IMPORT_LIMITS.textSegments)
            return fail("The statement is too large to review safely. Export a shorter range.");
        const lines: {
            y: number;
            items: typeof page.items;
        }[] = [];
        for (const item of [...page.items].sort((a, b) => a.y - b.y || a.x - b.x)) {
            if (typeof item.text !== "string" || !Number.isFinite(item.x) || !Number.isFinite(item.y))
                return fail("The PDF contains unsupported text positioning.");
            characters += item.text.length;
            if (characters > IMPORT_LIMITS.textCharacters)
                return fail("The statement text exceeds the import limit. Export a shorter range.");
            if (!item.text.trim())
                continue;
            const last = lines.at(-1);
            if (last && Math.abs(last.y - item.y) < 1)
                last.items.push(item);
            else
                lines.push({ y: item.y, items: [item] });
        }
        for (const line of lines) {
            line.items.sort((a, b) => a.x - b.x);
            const texts = line.items.map((item) => clean(item.text)), joined = texts.join(" ");
            if (texts.includes("TNG WALLET TRANSACTION HISTORY")) {
                title = true;
                continue;
            }
            if (texts[0] === "Wallet ID") {
                const value = texts.slice(1).find((text) => /^\d{12,24}$/.test(text));
                if (!value || walletId && walletId !== value)
                    return fail("The statement wallet identifier is missing or inconsistent.");
                walletId = value;
                continue;
            }
            if (texts[0] === "Transaction Period") {
                selectedPeriod = period(texts.slice(1).join(" "));
                continue;
            }
            if (texts.includes("TNG WALLET TRANSACTION")) {
                finish();
                mode = "wallet";
                continue;
            }
            if (texts.includes("GO+ TRANSACTION")) {
                finish();
                mode = "goplus";
                continue;
            }
            if (texts[0] === "Date" && texts.includes("Status")) {
                const expected = ["Date", "Status", "Transaction Type", "Reference", "Description", "Details", "Amount (RM)", "Wallet Balance"];
                const headers = Array.from({ length: 8 }, () => [] as string[]);
                for (const item of line.items)
                    headers[column(item.x)].push(item.text);
                if (mode === "wallet" && expected.some((value, index) => clean(headers[index].join("")) !== value))
                    return fail("The wallet table columns differ from the verified TNG layout.");
                if (mode === "wallet")
                    tableHeader = true;
                continue;
            }
            if (joined.startsWith("*This is a system generated email") || texts[0]?.startsWith("+603 "))
                continue;
            if (mode === "none")
                continue;
            const cells = Array.from({ length: 8 }, () => [] as string[]);
            for (const item of line.items)
                cells[column(item.x)].push(item.text);
            const dateCell = clean(cells[0].join(" "));
            if (mode === "goplus") {
                if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateCell))
                    goPlusRows++;
                continue;
            }
            if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateCell)) {
                finish();
                row = cells;
            }
            else if (row && dateCell === "")
                for (let index = 1; index < 8; index++)
                    row[index].push(...cells[index]);
            else if (row && dateCell)
                return fail("An unexpected line interrupts a wallet transaction. No records were saved.");
        }
    }
    finish();
    if (!title || !tableHeader || !walletId || !selectedPeriod || selectedPeriod.start > selectedPeriod.end || !rows.length)
        return fail("No supported TNG wallet table was found. Scanned PDFs and screenshots require OCR, which is outside this import.");
    return { walletId, startDate: selectedPeriod.start, endDate: selectedPeriod.end, pageCount: input.pages.length, rows, goPlusRows, unsuccessfulRows };
}
