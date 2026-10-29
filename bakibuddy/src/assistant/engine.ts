import { calculateAnalytics, presetRange, shareText } from '../analytics/engine.ts';
import { activeCycle, addDays, dayNumber, occurrences } from '../budget/calendar.ts';
import { calculateBudget } from '../budget/engine.ts';
import { CATEGORY_LABELS } from '../constants/category-labels.ts';
import { CATEGORY_IDS, type LedgerSnapshot } from '../types/finance.ts';
import { formatMYR } from '../utils/money.ts';
import { LedgerError, safeSen } from '../utils/validation.ts';
import { cleanQuestion, interpretQuestion, questionAmount, unsupportedAdvice } from './question.ts';
import type { AssistantAnswer, AssistantPeriod, QuestionInterpretation, VerifiedFact } from './types.ts';

export function assistantRevision(snapshot: LedgerSnapshot, today: string): string {
  // Local-only stale-result marker. Never include it in a cloud payload.
  return JSON.stringify([today,snapshot.accounts,snapshot.transactions,snapshot.budget]);
}
export function nextFriday(today: string) {
  const weekday = new Date(`${today}T00:00:00Z`).getUTCDay();
  return addDays(today, (5-weekday+7)%7 || 7);
}
export function scheduledForecast(snapshot: LedgerSnapshot, today: string, target: string) {
  if (dayNumber(target) < dayNumber(today) || dayNumber(target)-dayNumber(today) > 366) throw new LedgerError('Forecast a date from today through the next 366 days.');
  const pending = occurrences(snapshot.budget.items,snapshot.budget.settlements,addDays(target,1)).filter(item => !item.transactionId);
  const bills = pending.filter(item => item.kind === 'bill');
  const income = pending.filter(item => item.kind === 'income' && item.dueDate >= today);
  const total = (rows: typeof pending) => safeSen(rows.reduce((sum,row) => sum+BigInt(row.amountSen),0n));
  const billsSen = total(bills), incomeSen = total(income);
  return { target, billsSen, incomeSen, balanceSen: safeSen(BigInt(snapshot.totals.balanceSen)-BigInt(billsSen)+BigInt(incomeSen)), overdueIncomeCount: pending.filter(item => item.kind==='income' && item.dueDate<today).length };
}
export function buildAssistantAnswer(snapshot: LedgerSnapshot, today: string, raw: string, period: AssistantPeriod = 'month', understood?: QuestionInterpretation): AssistantAnswer {
  dayNumber(today);
  const question = cleanQuestion(raw), interpretation = unsupportedAdvice(question) ? interpretQuestion(question,period) : understood ?? interpretQuestion(question,period);
  const range = presetRange(interpretation.period,today);
  const facts: VerifiedFact[] = [], notes = ['Based on records you entered. Missing records can change this picture.'];
  let title = 'Your recorded money', scope = `${range.start} to ${range.end} · all accounts · MYR`;
  const add = (id: string,text: string) => facts.push({id,text});
  const budget = calculateBudget(snapshot,snapshot.budget,today);
  switch (interpretation.intent) {
    case 'overview': {
      scope = `Current recorded balance as of ${today} · all accounts · MYR`;
      add('overview.balance',`Recorded balance: ${formatMYR(snapshot.totals.balanceSen)}.`);
      add('overview.accounts',`${snapshot.accounts.length} tracked ${snapshot.accounts.length===1?'account':'accounts'}; opening balances are included.`);
      if (budget && !budget.cycle.expired && !budget.cycle.upcoming) add('overview.allowance',`Today's plan allowance: ${formatMYR(budget.dailySen)}.`);
      notes.push('Recorded balance is not a live bank balance or a guarantee of money available to spend.');
      break;
    }
    case 'spending': {
      title = 'Recorded spending'; const analysis = calculateAnalytics(snapshot,range,today);
      add('spending.expenses',`Expenses: ${formatMYR(analysis.current.expenseSen)} across ${analysis.current.expenseCount} ${analysis.current.expenseCount===1?'record':'records'}.`);
      add('spending.income',`Income: ${formatMYR(analysis.current.incomeSen)}.`);
      add('spending.refunds',`Refunds: ${formatMYR(analysis.current.refundSen)}; shown separately from expenses.`);
      add('spending.average',`Expense average across all days in this range: ${formatMYR(analysis.dailyAverageSen)} per day, rounded down to sen.`);
      notes.push('Opening balances and transfers between tracked accounts are excluded from period cash flow.');
      break;
    }
    case 'afford': {
      title = 'Compare a payment with today’s plan'; scope = `${today} · one payment today · all accounts · MYR`;
      const amount = questionAmount(question);
      if (amount === null) { add('afford.amount_needed','Include one amount, such as “Can I afford RM50 today?”'); break; }
      add('afford.request',`Payment considered: ${formatMYR(amount)}.`);
      if (!budget || budget.cycle.expired || budget.cycle.upcoming) { add('afford.plan_needed','Set or update your budget plan before comparing a payment with protected funds.'); break; }
      add('afford.daily',`Today's allowance: ${formatMYR(budget.dailySen)}.`);
      add('afford.available',`Available across the remaining cycle after commitments, reserve and any cap: ${formatMYR(budget.availableSen)}.`);
      add('afford.comparison',amount <= budget.dailySen ? 'This single payment is within today’s plan allowance.' : 'This single payment is above today’s plan allowance.');
      add('afford.protected',`The plan protects ${formatMYR(budget.billsSen)} of unpaid bills and ${formatMYR(budget.savingsReserveSen)} of savings reserve.`);
      if (budget.cashflowShortfallSen || budget.accountShortfalls.length || budget.shortfallSen) add('afford.funding_warning','Your plan has a funding or payment-timing warning. Check Budget and the paying account before spending.');
      notes.push('This does not reserve money, record a payment, or assume your next income is guaranteed.');
      break;
    }
    case 'weekly_change': {
      title = 'Why recorded weekly spending changed'; const currentRange=presetRange('seven',today), analysis=calculateAnalytics(snapshot,currentRange,today), previous=calculateAnalytics(snapshot,analysis.previousRange,today);
      scope = `${currentRange.start} to ${currentRange.end} compared with ${analysis.previousRange.start} to ${analysis.previousRange.end} · all accounts`;
      add('weekly.current',`This period's expenses: ${formatMYR(analysis.current.expenseSen)}.`);
      add('weekly.previous',`Previous period's expenses: ${formatMYR(analysis.previous.expenseSen)}.`);
      add('weekly.difference',`Recorded expense difference: ${formatMYR(analysis.differenceSen)}.`);
      if (analysis.trendState === 'no-baseline') add('weekly.no_baseline','There are no earlier expense records for a reliable percentage comparison.');
      const deltas = CATEGORY_IDS.map(category => ({category,delta:safeSen(BigInt(analysis.categories.find(row=>row.category===category)?.amountSen??0)-BigInt(previous.categories.find(row=>row.category===category)?.amountSen??0))})).filter(row=>row.delta!==0).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));
      for (const row of deltas.slice(0,3)) add(`weekly.category.${row.category}`,`${CATEGORY_LABELS[row.category]} expense difference: ${formatMYR(row.delta)}.`);
      notes.push('These are recorded changes, not proof of why they happened. Transfers and refunds do not increase gross spending.');
      break;
    }
    case 'category': {
      const category = interpretation.category ?? 'food'; title=`Your ${CATEGORY_LABELS[category].toLowerCase()} spending`;
      const analysis=calculateAnalytics(snapshot,range,today), row=analysis.categories.find(entry=>entry.category===category);
      add('category.expenses',`${CATEGORY_LABELS[category]} expenses: ${formatMYR(row?.amountSen??0)} across ${row?.count??0} ${row?.count===1?'record':'records'}.`);
      add('category.share',`Share of gross recorded expenses: ${shareText(row?.shareBasisPoints??0)}.`);
      add('category.total',`All-category expenses in the same range: ${formatMYR(analysis.current.expenseSen)}.`);
      if (budget && !budget.cycle.expired && !budget.cycle.upcoming && snapshot.budget.plan?.spendingLimitSen !== null) add('category.cap_context',`Current-cycle spending cap: ${formatMYR(snapshot.budget.plan!.spendingLimitSen!)} across all categories; it is not a category-specific limit.`);
      notes.push('No category-specific target is set, so these records alone cannot say this category is “too much”. Review categorization and your priorities.');
      break;
    }
    case 'saving': {
      title='Your savings reserve'; scope=`Current budget plan · ${today} · all accounts · MYR`;
      if (!budget) { add('saving.no_plan','Set a savings reserve in your budget plan to protect an amount you choose.'); break; }
      add('saving.reserve',`Your chosen savings reserve: ${formatMYR(budget.savingsReserveSen)}.`);
      add('saving.bills',`Unpaid bills protected by the current plan: ${formatMYR(budget.billsSen)}.`);
      add('saving.available',`Current plan's available amount after protections and cap: ${formatMYR(budget.availableSen)}.`);
      if (budget.shortfallSen) add('saving.shortfall',`Recorded funds are short of protected commitments by ${formatMYR(budget.shortfallSen)}.`);
      notes.push('The reserve is your entered goal, not a calculated recommendation. No savings percentage or amount is invented.');
      break;
    }
    case 'forecast': {
      title='Scheduled balance forecast'; let target = interpretation.horizon==='next_friday'?nextFriday(today):interpretation.horizon==='seven_days'?addDays(today,7):null;
      if (!target) { if (!snapshot.budget.plan) { add('forecast.no_plan','Set a budget plan or ask for next Friday to choose a forecast date.'); break; } const cycle=activeCycle(snapshot.budget.plan,today); if(cycle.expired||cycle.upcoming){add('forecast.inactive','Update the budget cycle before forecasting its ending balance.');break;}target=addDays(cycle.end,-1); }
      const forecast=scheduledForecast(snapshot,today,target); scope=`Through ${target}, inclusive · all accounts · MYR`;
      add('forecast.balance',`Scheduled balance on ${target}: ${formatMYR(forecast.balanceSen)}.`);
      add('forecast.current',`Starting recorded balance: ${formatMYR(snapshot.totals.balanceSen)}.`);
      add('forecast.bills',`Unpaid bills due by then, including overdue bills: ${formatMYR(forecast.billsSen)}.`);
      add('forecast.income',`Expected income due from today through then: ${formatMYR(forecast.incomeSen)}.`);
      if(forecast.overdueIncomeCount)add('forecast.overdue_income',`${forecast.overdueIncomeCount} overdue expected-income occurrences are excluded.`);
      notes.push('Conditional on scheduled income arriving and bills being paid. Assumes no extra discretionary spending; the savings reserve stays within the balance. No future transaction is created.');
      break;
    }
    default: title='Choose a supported money question'; add('unsupported.scope','Ask about recorded balance/spending, weekly changes, a single payment today, your savings reserve, a category, or a scheduled forecast.'); notes.push('Investment, credit, tax and other unsupported advice is not inferred from your ledger.');
  }
  if(!snapshot.transactions.length)notes.unshift('There are no recorded transactions yet. Opening balances are not spending history.');
  return {title,scope,facts,notes,interpretation,question,revision:assistantRevision(snapshot,today)};
}
