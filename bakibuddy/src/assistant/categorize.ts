import type { LedgerSnapshot, TransactionInput } from '../types/finance.ts';
import { normalizedName } from '../importing/review.ts';
import { ASSISTANT_LIMITS, type CategorySuggestion } from './types.ts';

export function categoryRevision(record: TransactionInput) {
  return JSON.stringify([record.id,record.merchant,record.kind,record.category,record.amountSen,record.date,record.accountId,record.transferToAccountId,record.description]);
}
const hints: [CategorySuggestion['proposed'],RegExp][] = [
  ['food',/\b(cafe|cafeteria|restaurant|canteen|kopitiam|mcdonalds?|kfc|tealive|coffee)\b/i],
  ['transport',/\b(mrt|lrt|ktm|rapidkl|toll|petrol|parking|shell|petronas)\b/i],
  ['groceries',/\b(grocer(?:y|ies)|supermarket|lotus|mydin|jaya grocer|99 speedmart)\b/i],
  ['education',/\b(tuition|university|bookshop|textbooks?|college)\b/i],
  ['health',/\b(pharmacy|clinic|hospital|dental)\b/i],
  ['subscriptions',/\b(netflix|spotify|subscription)\b/i],
  ['entertainment',/\b(cinema|gsc|tgv)\b/i],
];
export function categorySuggestions(snapshot: LedgerSnapshot, offset = 0): CategorySuggestion[] {
  return snapshot.transactions.filter(record=>record.kind==='expense'&&record.category==='other').slice(offset,offset+ASSISTANT_LIMITS.categoryRows).map(record=>{
    const earlier=snapshot.transactions.filter(other=>other.id!==record.id&&other.kind==='expense'&&other.category!=='other'&&normalizedName(other.merchant)===normalizedName(record.merchant));
    const learned=[...new Set(earlier.map(other=>other.category))];
    const hint=hints.find(([,pattern])=>pattern.test(record.merchant))?.[0];
    const proposed=learned.length===1?learned[0]:learned.length>1?'other':hint??'other';
    return {id:record.id,merchant:record.merchant,current:record.category,proposed,reason:learned.length===1?'history':proposed!=='other'?'name_hint':'unclear',revision:categoryRevision(record),include:false};
  });
}
