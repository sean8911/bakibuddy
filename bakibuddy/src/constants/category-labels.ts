import type { CategoryId } from '../types/finance.ts';
export const CATEGORY_LABELS: Record<CategoryId,string> = {
  food: 'Food & drinks', transport: 'Transport', shopping: 'Shopping', entertainment: 'Entertainment',
  education: 'Education', bills: 'Bills', subscriptions: 'Subscriptions', health: 'Health', groceries: 'Groceries', other: 'Other',
};
