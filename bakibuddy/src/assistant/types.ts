import type { CategoryId } from '../types/finance.ts';
export const ASSISTANT_INTENTS = ['overview','spending','afford','weekly_change','saving','category','forecast','unsupported'] as const;
export type AssistantIntent = typeof ASSISTANT_INTENTS[number];
export type AssistantPeriod = 'month' | 'seven' | 'thirty';
export type ForecastHorizon = 'next_friday' | 'seven_days' | 'cycle_end';
export interface QuestionInterpretation {
  intent: AssistantIntent;
  period: AssistantPeriod;
  category: CategoryId | null;
  horizon: ForecastHorizon;
}
export interface VerifiedFact { id: string; text: string }
export interface AssistantAnswer {
  title: string;
  scope: string;
  facts: VerifiedFact[];
  notes: string[];
  interpretation: QuestionInterpretation;
  question: string;
  revision: string;
}
export interface CategorySuggestion {
  id: string;
  merchant: string;
  current: CategoryId;
  proposed: CategoryId;
  reason: 'history' | 'name_hint' | 'cloud' | 'unclear';
  revision: string;
  include: boolean;
}
export interface CategoryChange { id: string; expectedRevision: string; category: CategoryId }
export const ASSISTANT_LIMITS = { question: 400, facts: 24, factText: 400, categoryRows: 5, requestBytes: 20000, responseBytes: 100000, timeoutMs: 25000 } as const;
