import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { addDays, occurrences } from "../budget/calendar";
import { AppButton } from "../components/AppButton";
import { AppText } from "../components/AppText";
import { ChoiceGroup, FormError } from "../components/FormFields";
import { FormScreen } from "../components/FormScreen";
import { useFinance } from "../state/FinanceProvider";
import { colors } from "../theme/tokens";
import {
  formatBudgetDate as formatFinancialDate,
  todayInKL,
} from "../utils/dates";
import { formatMYR } from "../utils/money";
import { errorMessage } from "../utils/validation";

export default function PlannedItemsScreen() {
  const { snapshot } = useFinance();
  const router = useRouter();
  const [filter, setFilter] = useState("pending");
  const [count, setCount] = useState(20);
  const today = todayInKL(),
    horizon = addDays(today, 367);
  let all: ReturnType<typeof occurrences> = [],
    error: string | undefined;
  try {
    all = occurrences(
      snapshot.budget.items,
      snapshot.budget.settlements,
      horizon,
    );
  } catch (failure) {
    error = errorMessage(failure);
  }
  const visible = all.filter((item) =>
    filter === "linked" ? !!item.transactionId : !item.transactionId,
  );
  return (
    <FormScreen title="Bills & income">
      <AppText color={colors.secondary}>
        Keep plans separate from payments. An unpaid bill protects money in your
        budget, including when overdue. Expected income never increases today’s
        allowance.
      </AppText>
      <AppButton
        label="Add scheduled item"
        onPress={() => router.push("/planned/new")}
      />
      <AppText variant="title">Your schedules</AppText>
      {!snapshot.budget.items.length && (
        <AppText color={colors.secondary}>
          No schedules yet. Add rent, subscriptions or a one-time bill, then
          salary, allowance or an expected freelance payment.
        </AppText>
      )}
      {snapshot.budget.items.map((item) => (
        <View key={item.id} style={styles.row}>
          <AppText variant="label">
            {item.name} · {item.kind === "bill" ? "Bill" : "Expected income"}
          </AppText>
          <AppText color={colors.secondary}>
            {formatMYR(item.amountSen)} ·{" "}
            {item.repeat === "once" ? "One time" : item.repeat} · from{" "}
            {formatFinancialDate(item.date)}
          </AppText>
          <AppButton
            label={`Edit ${item.name}`}
            variant="secondary"
            onPress={() => router.push(`/planned/${item.id}`)}
          />
        </View>
      ))}
      <AppText variant="title">Payments to review</AppText>
      <AppText color={colors.secondary}>
        Overdue items and occurrences through{" "}
        {formatFinancialDate(addDays(horizon, -1))}. A link confirms the full
        amount; it does not make another transaction.
      </AppText>
      <ChoiceGroup
        label="Payment status"
        choices={[
          { value: "pending", label: "Pending" },
          { value: "linked", label: "Linked records" },
        ]}
        value={filter}
        onChange={(value) => {
          setFilter(value);
          setCount(20);
        }}
      />
      <FormError message={error} />
      {!visible.length && (
        <AppText color={colors.secondary}>
          {filter === "pending"
            ? "No pending payments in this window."
            : "No linked payments in this window."}
        </AppText>
      )}
      {visible.slice(0, count).map((item) => (
        <View key={`${item.id}/${item.dueDate}`} style={styles.row}>
          <AppText variant="label">
            {item.name} · {formatMYR(item.amountSen)}
          </AppText>
          <AppText
            color={
              !item.transactionId && item.dueDate < today
                ? colors.amber
                : colors.secondary
            }
          >
            {item.transactionId
              ? "Linked"
              : item.dueDate < today
                ? "Overdue"
                : "Due"}{" "}
            {formatFinancialDate(item.dueDate)} ·{" "}
            {item.kind === "bill" ? "Bill" : "Income"}
          </AppText>
          <AppButton
            label={`Review ${item.name} due ${formatFinancialDate(item.dueDate)}`}
            variant="secondary"
            onPress={() =>
              router.push({
                pathname: "/planned-payment",
                params: { itemId: item.id, dueDate: item.dueDate },
              })
            }
          />
        </View>
      ))}
      {visible.length > count && (
        <AppButton
          label="Show 20 more payments"
          variant="secondary"
          onPress={() => setCount(count + 20)}
        />
      )}
    </FormScreen>
  );
}
const styles = StyleSheet.create({
  row: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 8,
  },
});
