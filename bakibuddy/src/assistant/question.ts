import { LedgerError, parseAmount } from '../utils/validation.ts';
import type { CategoryId } from '../types/finance.ts';
import { ASSISTANT_LIMITS, type AssistantPeriod, type QuestionInterpretation } from './types.ts';

const categoryWords: [CategoryId,RegExp][] = [
  ['food',/\b(food|makan|cafe|restaurant|drinks?)\b/],['transport',/\b(transport|train|bus|petrol|fuel|pengangkutan)\b/],['groceries',/\b(grocer(?:y|ies)|supermarket|runcit)\b/],['shopping',/\b(shopping|clothes|pakaian)\b/],['education',/\b(education|tuition|books?|pendidikan)\b/],['bills',/\b(bills?|utilities|rent|sewa)\b/],['subscriptions',/\b(subscriptions?|langganan)\b/],['health',/\b(health|medical|pharmacy|kesihatan)\b/],['entertainment',/\b(entertainment|cinema|games?|hiburan)\b/],['other',/\b(other|lain)\b/],
];
export const unsupportedAdvice = (question: string) => /\b(invest|stocks?|crypto|loan|tax|bitcoin|mortgage)\b/i.test(question);
export const unsafeControls = (text: string) => Array.from(text).some(character => { const code=character.charCodeAt(0);return code<32&&code!==9&&code!==10&&code!==13; });
export function cleanQuestion(raw: string) {
  if (typeof raw !== 'string') throw new LedgerError('Enter a question.');
  const value = raw.trim();
  if (!value || value.length > ASSISTANT_LIMITS.question || unsafeControls(value)) throw new LedgerError('Enter a question of 1 to 400 characters.');
  return value;
}
export function questionAmount(raw: string): number | null {
  const matches = [...raw.matchAll(/(?:\b(?:RM|MYR)\s*|\bspend\s+)([-+]?\d[\d.,]*)/gi)];
  if (!matches.length) return null;
  if (matches.length !== 1) throw new LedgerError('Ask about one spending amount at a time.');
  return parseAmount(matches[0][1]);
}
export function interpretQuestion(raw: string, selectedPeriod: AssistantPeriod = 'month'): QuestionInterpretation {
  const question = cleanQuestion(raw).normalize('NFKC').toLowerCase();
  const period = /last\s*30|thirty/.test(question) ? 'thirty' : /week|7 days|seven|minggu/.test(question) ? 'seven' : /month|bulan/.test(question) ? 'month' : selectedPeriod;
  const category = categoryWords.find(([,pattern]) => pattern.test(question))?.[0] ?? null;
  const horizon = /friday|jumaat/.test(question) ? 'next_friday' : /7 days|seven days|next week|minggu depan/.test(question) ? 'seven_days' : 'cycle_end';
  let intent: QuestionInterpretation['intent'] = 'unsupported';
  if (unsupportedAdvice(question)) return { intent,period,category,horizon };
  if (/\b(afford|boleh|mampu)\b/.test(question) || /\bspend\s+(?:rm|myr|\d)/.test(question)) intent = 'afford';
  else if (/forecast|next friday|jumaat|will i have|next week|7 days from|cycle end/.test(question)) intent = 'forecast';
  else if (/\b(sav(?:e|ing|ings)|reserve|simpan|simpanan)\b/.test(question)) intent = 'saving';
  else if (/why|more|less|change|compare|increase|decrease|kenapa|berbanding/.test(question) && /week|minggu/.test(question)) intent = 'weekly_change';
  else if (category) intent = 'category';
  else if (/\b(spend|spent|spending|expense|expenses|belanja|perbelanjaan)\b/.test(question)) intent = 'spending';
  else if (/\b(balance|baki|overview|summary|money|wang)\b/.test(question)) intent = 'overview';
  return { intent, period, category, horizon };
}
