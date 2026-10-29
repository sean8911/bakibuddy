import { formatFinancialDate } from '../utils/dates.ts';
import { editableAmount, LedgerError, parseAmount } from '../utils/validation.ts';
import { SCAN_LIMITS, type OcrExtraction, type OcrLine, type ScanCandidate, type ScanMode } from './types.ts';

const months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const monthPattern = '(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const shortDate = new RegExp(`^(\\d{1,2})\\s+${monthPattern}\\s*,?\\s*\\d{1,2}[:.]\\d{2}`, 'i');
const rangeDate = new RegExp(`(\\d{1,2})\\s+${monthPattern}\\s+(\\d{4}|\\d{2})(?!\\d)`, 'gi');
const ignoredMoney = /points?|balance|change|cash\s*(?:tendered|received)|subtotal|sub.total|tax|sst|discount|saving|rounding/i;
const foreignCurrency = /\b(?:USD|SGD|IDR|THB|CNY|RMB|EUR|GBP|JPY|AUD|HKD)\b|[$€£]/i;
const clean = (text: string) => text.normalize('NFKC').replace(/[−–—]/g, '-').replace(/\s+/g, ' ').trim();
function date(year: string, month: number, day: string) {
  const value = `${year}-${String(month).padStart(2, '0')}-${day.padStart(2, '0')}`;
  try { formatFinancialDate(value); return value; } catch { return ''; }
}
function dateIn(text: string) {
  const iso = text.match(/\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (iso) return date(iso[1], Number(iso[2]), iso[3]);
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/);
  if (numeric) return date(numeric[3], Number(numeric[2]), numeric[1]);
  const named = new RegExp(`\\b(\\d{1,2})\\s+${monthPattern}[, ]+((?:19|20)\\d{2})\\b`, 'i').exec(text);
  return named ? date(named[3], months.indexOf(named[2].slice(0,3).toLowerCase()) + 1, named[1]) : '';
}
function amountIn(text: string, allowBare = false) {
  if (ignoredMoney.test(text) || foreignCurrency.test(text)) return '';
  // Do not turn OCR letters (S/O/I) into digits: a plausible correction can change money.
  const matches = [...clean(text).matchAll(/(?:RM|MYR)\s*([0-9]+(?:,[0-9]{3})*\.[0-9]{2})(?![0-9.])/gi)];
  if (matches.length === 1) {
    try { return editableAmount(parseAmount(matches[0][1].replaceAll(',', ''))); } catch { return ''; }
  }
  const bare = allowBare ? clean(text).match(/(?:^|\s)([0-9]+\.[0-9]{2})\s*$/) : null;
  if (bare) { try { return editableAmount(parseAmount(bare[1])); } catch { /* Needs correction. */ } }
  return '';
}
function warnings(merchant: string, amount: string, transactionDate: string, lines: OcrLine[]) {
  const values: string[] = [];
  if (!merchant) values.push('Enter the merchant or transaction name.');
  if (!amount) values.push('Enter the full payment amount from the image.');
  if (!transactionDate) values.push('Choose the transaction date, including its year.');
  if (lines.some(line => line.confidence < 80)) values.push('Some text was unclear. Compare every field with the image.');
  return values;
}
function activity(extraction: OcrExtraction): ScanCandidate[] {
  const lines = [...extraction.lines].sort((a,b) => a.y - b.y || a.x - b.x);
  const anchors = lines.filter(line => shortDate.test(clean(line.text)));
  if (!anchors.length) return [];
  const header = lines.filter(line => line.y < anchors[0].y).map(line => clean(line.text)).join(' ');
  const dates = [...header.matchAll(rangeDate)].map(match => date(match[3].length === 2 ? `20${match[3]}` : match[3], months.indexOf(match[2].slice(0,3).toLowerCase()) + 1, match[1]));
  const [start, end] = dates.length === 2 && dates.every(Boolean) && dates[0] <= dates[1] ? dates : [];
  return anchors.map((anchor, index) => {
    const endY = anchors[index+1]?.y ?? extraction.height * .91;
    const row = lines.filter(line => line.y > anchor.y + anchor.height * .6 && line.y < endY);
    const money = row.filter(line => /(?:^|\s|[+-])(?:RM|MYR)/i.test(clean(line.text)) && !ignoredMoney.test(line.text));
    const moneyLine = money.length === 1 ? money[0] : undefined;
    let amount = moneyLine && moneyLine.confidence >= 50 ? amountIn(moneyLine.text) : '';
    const left = row.filter(line => line !== moneyLine && line.x < extraction.width * .7 && !/DuitNow|transfer to wallet|points?|^Home$|^Profile$|^Activity$|^Transfer$|^Reload$|^Refund$/i.test(line.text));
    const names = left.map(line => ({ text: clean(line.text).replace(/[-+]?\s*(?:RM|MYR).*$/i, ''), y: line.y }));
    if (moneyLine && moneyLine.x < extraction.width * .7) names.push({ text: clean(moneyLine.text).replace(/[-+]?\s*(?:RM|MYR).*$/i, ''), y: moneyLine.y });
    const merchant = names.sort((a,b) => a.y-b.y).map(line => line.text.trim()).filter(Boolean).join(' ').slice(0,80);
    if (money.length > 1) amount = '';
    const match = shortDate.exec(clean(anchor.text))!;
    let transactionDate = '';
    if (start && end) {
      const years = [...new Set([start.slice(0,4),end.slice(0,4)])];
      const candidates = years.map(year => date(year, months.indexOf(match[2].slice(0,3).toLowerCase()) + 1, match[1])).filter(value => value && value >= start && value <= end);
      if (candidates.length === 1) transactionDate = candidates[0];
    }
    const transfer = /transfer|reload|top.up/i.test(row.map(line => line.text).join(' '));
    const outgoing = moneyLine ? /-\s*(?:RM|MYR)/i.test(clean(moneyLine.text)) : false;
    const incoming = moneyLine ? /\+\s*(?:RM|MYR)/i.test(clean(moneyLine.text)) : false;
    return { index: index+1, merchant, amount, date: transactionDate, kind: outgoing && !transfer ? 'expense' : 'unresolved', direction: outgoing ? 'debit' : incoming ? 'credit' : '', warnings: [...warnings(merchant, amount, transactionDate, [anchor,...row]), ...(transactionDate ? ['The year comes from the displayed statement period. Verify the full date.'] : []), ...(transfer ? ['Decide whether this paid another person or moved money between your own accounts.'] : [])], sourceText: [anchor,...row].map(line => line.text).join('\n').slice(0,3000) };
  });
}
function receipt(extraction: OcrExtraction): ScanCandidate[] {
  const lines = [...extraction.lines].sort((a,b) => a.y - b.y || a.x - b.x);
  const meaningful = lines.filter(line => !/points?|balance|qr\s*code|^scan\b/i.test(line.text));
  const totalLines = meaningful.filter(line => /(?:grand\s*total|total\s*(?:paid|amount|payment|due)?|amount\s*(?:paid|due)|payment\s*amount)/i.test(line.text) && !ignoredMoney.test(line.text));
  const totals = totalLines.map(line => {
    const nearby = lines.filter(other => other !== line && Math.abs(other.y - line.y) < Math.max(line.height,other.height) * .6).map(other => other.text).join(' ');
    return amountIn(`${line.text} ${nearby}`, true);
  }).filter(Boolean);
  const values = [...new Set(totals)];
  let amount = values.length === 1 ? values[0] : '';
  if (!totalLines.length) {
    const amounts = meaningful.map(line => amountIn(line.text)).filter(Boolean);
    if (amounts.length === 1) amount = amounts[0];
  }
  if (foreignCurrency.test(extraction.text)) amount = '';
  const dateValues = [...new Set(meaningful.map(line => dateIn(line.text)).filter(Boolean))];
  const transactionDate = dateValues.length === 1 ? dateValues[0] : '';
  const merchantLine = meaningful.find(line => !/receipt|invoice|payment|successful|transaction|date|time|total|amount|ref(?:erence)?|\b(?:RM|MYR)\s*\d|\d{2}[:/-]\d{2}/i.test(line.text) && /[a-z]{3}/i.test(line.text));
  const merchant = merchantLine ? clean(merchantLine.text).slice(0,80) : '';
  if (!/[a-z0-9]/i.test(extraction.text)) return [];
  if (!totalLines.length && !meaningful.some(line => /(?:RM|MYR)\s*[0-9]/i.test(line.text)) && !transactionDate) return [];
  return [{ index: 1, merchant, amount, date: transactionDate, kind: 'unresolved', direction: '', warnings: [...warnings(merchant, amount, transactionDate, lines), ...(values.length > 1 ? ['Several totals were found. Enter the actual payment amount.'] : [])], sourceText: extraction.text.slice(0,3000) }];
}
export function parseScan(extraction: OcrExtraction, mode: ScanMode): ScanCandidate[] {
  if (!extraction || !Array.isArray(extraction.lines) || extraction.lines.length > SCAN_LIMITS.lines || typeof extraction.text !== 'string' || extraction.text.length > SCAN_LIMITS.characters || !Number.isFinite(extraction.width) || !Number.isFinite(extraction.height) || extraction.width <= 0 || extraction.height <= 0 || extraction.width * extraction.height > SCAN_LIMITS.pixels)
    throw new LedgerError('The image produced too much or invalid text. Choose a smaller, clearer image.');
  if (extraction.lines.some(line => typeof line.text !== 'string' || line.text.length > 3000 || ![line.x,line.y,line.width,line.height,line.confidence].every(Number.isFinite) || line.x < 0 || line.y < 0 || line.width < 0 || line.height < 0 || line.confidence < 0 || line.confidence > 100)) throw new LedgerError('The image reader returned invalid text. Choose the image again.');
  const rows = mode === 'activity' ? activity(extraction) : receipt(extraction);
  if (rows.length > SCAN_LIMITS.rows) throw new LedgerError('Choose an image with no more than 50 transactions.');
  return rows;
}
