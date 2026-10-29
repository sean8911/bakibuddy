import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { ActivityIndicator, AppState, StyleSheet, View } from "react-native";
import { AppText } from "../components/AppText";
import { AppButton } from "../components/AppButton";
import { openLedger } from "../storage/openDatabase";
import type { LedgerRepository } from "../storage/repository";
import type { LedgerSnapshot } from "../types/finance";
import { colors, spacing } from "../theme/tokens";
import { LedgerError } from "../utils/validation";
import { todayInKL } from "../utils/dates";

interface FinanceContextValue {
  snapshot: LedgerSnapshot;
  busy: boolean;
  today: string;
  mutate: (
    action: (repository: LedgerRepository) => Promise<LedgerSnapshot>,
  ) => Promise<void>;
}
const FinanceContext = createContext<FinanceContextValue | undefined>(
  undefined,
);

export function FinanceProvider({ children }: PropsWithChildren) {
  const [snapshot, setSnapshot] = useState<LedgerSnapshot>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [today, setToday] = useState(todayInKL);
  const working = useRef(false);
  const mounted = useRef(true);
  const refresh = useCallback(async () => {
    try {
      const repository = await openLedger();
      const next = await repository.load();
      if (mounted.current) {
        setSnapshot(next);
        setError(undefined);
      }
    } catch (failure) {
      if (mounted.current)
        setError(
          failure instanceof LedgerError
            ? failure.message
            : "Your local records could not be opened. Retry without clearing app data. For the web preview, use the documented server with cross-origin isolation headers.",
        );
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    // Starts asynchronous SQLite I/O; no state is derived synchronously in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const clock = setInterval(() => setToday(todayInKL()), 30000);
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setToday(todayInKL());
        if (!working.current) void refresh();
      }
    });
    return () => {
      mounted.current = false;
      listener.remove();
      clearInterval(clock);
    };
  }, [refresh]);
  const mutate = useCallback(
    async (
      action: (repository: LedgerRepository) => Promise<LedgerSnapshot>,
    ) => {
      if (working.current)
        throw new LedgerError("An update is already in progress. Please wait.");
      working.current = true;
      setBusy(true);
      try {
        const repository = await openLedger();
        const next = await action(repository);
        if (mounted.current) setSnapshot(next);
      } finally {
        working.current = false;
        if (mounted.current) setBusy(false);
      }
    },
    [],
  );
  if (error)
    return (
      <View style={styles.status}>
        <AppText variant="title">Let’s reopen your records.</AppText>
        <AppText color={colors.secondary}>{error}</AppText>
        <AppButton
          label="Retry opening records"
          onPress={() => {
            setError(undefined);
            void refresh();
          }}
        />
      </View>
    );
  if (!snapshot)
    return (
      <View
        style={styles.status}
        accessibilityRole="progressbar"
        accessibilityLabel="Opening local records"
      >
        <ActivityIndicator size="large" color={colors.emerald} />
        <AppText>Opening your local records…</AppText>
      </View>
    );
  return (
    <FinanceContext.Provider value={{ snapshot, busy, mutate, today }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context)
    throw new Error("useFinance must be used within FinanceProvider");
  return context;
}
const styles = StyleSheet.create({
  status: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.xl,
    backgroundColor: colors.background,
  },
});
