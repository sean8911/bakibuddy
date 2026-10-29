import { useState } from "react";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { Brand } from "../../components/Brand";
import { EmptyState } from "../../components/EmptyState";
import { ChoiceGroup } from "../../components/FormFields";
import { FinancialCard } from "../../components/FinancialCard";
import { LocalBadge } from "../../components/LocalBadge";
import { TransactionItem } from "../../components/TransactionItem";
import { categories } from "../../constants/categories";
import { useFinance } from "../../state/FinanceProvider";
import { filterTransactions } from "../../storage/ledger";
import { colors, layout, spacing } from "../../theme/tokens";
import { CATEGORY_IDS } from "../../types/finance";
import { formatFinancialDate } from "../../utils/dates";
import { formatMYR } from "../../utils/money";

export default function TransactionsScreen() {
  const router = useRouter();
  const { snapshot } = useFinance();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [account, setAccount] = useState("all");
  const [category, setCategory] = useState("all");
  const [filters, setFilters] = useState(false);
  const filtered = filterTransactions(
    snapshot.transactions,
    query,
    kind,
    account,
    category,
  );
  const active =
    !!query || kind !== "all" || account !== "all" || category !== "all";
  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.topbar}>
              <Brand />
              <LocalBadge />
            </View>
            <AppText
              variant="heading"
              accessibilityRole="header"
              testID="screen-title"
            >
              Your money in motion.
            </AppText>
            <AppText color={colors.secondary} style={styles.subtitle}>
              Your full history, saved on this device.
            </AppText>
            <FinancialCard style={styles.summary}>
              <View style={styles.stat}>
                <AppText variant="caption" color={colors.secondary}>
                  Income · all time
                </AppText>
                <AppText variant="title" money color={colors.emerald}>
                  {formatMYR(snapshot.totals.incomeSen)}
                </AppText>
              </View>
              <View style={styles.stat}>
                <AppText variant="caption" color={colors.secondary}>
                  Expenses · all time
                </AppText>
                <AppText variant="title" money>
                  {formatMYR(snapshot.totals.expenseSen)}
                </AppText>
              </View>
            </FinancialCard>
            {snapshot.totals.refundSen > 0 && (
              <AppText
                variant="caption"
                color={colors.secondary}
                style={styles.subtitle}
              >
                Refunds: {formatMYR(snapshot.totals.refundSen)} · separate from
                income and expenses
              </AppText>
            )}
            <View style={styles.controls}>
              <AppButton
                label="Add a transaction"
                icon="add-outline"
                disabled={!snapshot.accounts.length}
                onPress={() => router.push("/transaction/new")}
              />
              <TextInput
                accessibilityLabel="Search transactions"
                value={query}
                onChangeText={setQuery}
                placeholder="Search titles, descriptions or accounts"
                placeholderTextColor={colors.secondary}
                style={styles.search}
                returnKeyType="search"
              />
              <AppButton
                label={filters ? "Hide filters" : "Filter transactions"}
                variant="secondary"
                icon="options-outline"
                onPress={() => setFilters(!filters)}
              />
              {filters && (
                <>
                  <ChoiceGroup
                    label="Type filter"
                    value={kind}
                    onChange={setKind}
                    choices={[
                      "all",
                      "expense",
                      "income",
                      "refund",
                      "transfer",
                    ].map((value) => ({
                      value,
                      label:
                        value === "all"
                          ? "All types"
                          : value.charAt(0).toUpperCase() + value.slice(1),
                    }))}
                  />
                  <ChoiceGroup
                    label="Account filter"
                    value={account}
                    onChange={setAccount}
                    choices={[
                      { value: "all", label: "All accounts" },
                      ...snapshot.accounts.map((item) => ({
                        value: item.id,
                        label: item.name,
                      })),
                    ]}
                  />
                  <ChoiceGroup
                    label="Category filter"
                    value={category}
                    onChange={setCategory}
                    choices={[
                      { value: "all", label: "All categories" },
                      ...CATEGORY_IDS.map((id) => ({
                        value: id,
                        label: categories[id].label,
                      })),
                    ]}
                  />
                </>
              )}
              {active && (
                <AppButton
                  label="Clear search and filters"
                  variant="secondary"
                  onPress={() => {
                    setQuery("");
                    setKind("all");
                    setAccount("all");
                    setCategory("all");
                  }}
                />
              )}
              <AppText variant="caption" color={colors.secondary}>
                {filtered.length} of {snapshot.transactions.length} records ·
                Tap a record to edit
              </AppText>
            </View>
          </>
        }
        renderItem={({ item, index }) => (
          <View>
            {(index === 0 || filtered[index - 1].date !== item.date) && (
              <AppText
                variant="label"
                color={colors.secondary}
                style={styles.date}
              >
                {formatFinancialDate(item.date)} {item.date.slice(0, 4)}
              </AppText>
            )}
            <TransactionItem
              transaction={item}
              onPress={() => router.push(`/transaction/${item.id}`)}
            />
          </View>
        )}
        ListEmptyComponent={
          <>
            <EmptyState
              icon="receipt-outline"
              title={
                active
                  ? "No matching transactions."
                  : "A fresh start for your records."
              }
              description={
                active
                  ? "Try another search or clear your filters."
                  : "Add an account, then record your first transaction. There are no demo records in this ledger."
              }
            />
            {!snapshot.accounts.length && (
              <AppButton
                label="Add an account"
                onPress={() => router.push("/account/new")}
              />
            )}
          </>
        }
        ListFooterComponent={
          <AppText
            variant="caption"
            color={colors.secondary}
            style={styles.footer}
          >
            Saved on this device · MYR · Kuala Lumpur
          </AppText>
        }
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  topbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  subtitle: { marginTop: 8 },
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginTop: 24,
    padding: 16,
  },
  stat: { flexGrow: 1, gap: 4 },
  controls: { gap: 16, marginTop: 24 },
  search: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.navy,
    backgroundColor: colors.surface,
  },
  date: { marginTop: 24 },
  footer: { textAlign: "center", marginTop: spacing.xxl },
});
