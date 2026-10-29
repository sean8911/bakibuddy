import { useFinance } from "../state/FinanceProvider";
import { calculateBudget } from "./engine";
import { errorMessage } from "../utils/validation";

export function useBudget() {
  const { snapshot, today } = useFinance();
  try {
    return {
      result: calculateBudget(snapshot, snapshot.budget, today),
      error: undefined,
    };
  } catch (failure) {
    return { result: null, error: errorMessage(failure) };
  }
}
