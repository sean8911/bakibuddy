import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import type { AnalyticsBucket, Granularity } from "../analytics/engine";
import { colors, spacing } from "../theme/tokens";
import { formatBudgetDate, formatFinancialDate } from "../utils/dates";
import { formatMYR } from "../utils/money";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { ChoiceGroup } from "./FormFields";

interface ChartPoint {
  label: string;
  value: number;
  color?: string;
}

/** The library positions already-verified integer-sen values; it owns no financial totals. */
export function MoneyBarChart({
  points,
  label,
  testID,
}: {
  points: ChartPoint[];
  label: string;
  testID: string;
}) {
  const [width, setWidth] = useState(0);
  const maximum = Math.max(1, ...points.map((point) => point.value));
  const chartWidth = Math.max(0, width - 24);
  const cell = Math.min(72, chartWidth / Math.max(1, points.length));
  const barWidth = Math.min(32, cell * 0.55);
  const spacing = Math.max(0, cell - barWidth);
  const initialSpacing = Math.max(
    0,
    (chartWidth - points.length * cell) / 2 + spacing / 2,
  );
  return (
    <View
      style={styles.chart}
      testID={testID}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <AppText variant="caption" color={colors.secondary}>
        Scale: RM0.00 to {formatMYR(maximum)}
      </AppText>
      <View accessible accessibilityRole="image" accessibilityLabel={label}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.plot}
        >
          {width > 0 && (
            <BarChart
              key={`${chartWidth}/${points.length}/${maximum}`}
              data={points.map((point) => ({
                value: point.value,
                label: point.label,
                frontColor: point.color ?? colors.emerald,
                labelWidth: barWidth,
              }))}
              width={chartWidth}
              height={152}
              maxValue={maximum}
              noOfSections={4}
              barWidth={barWidth}
              spacing={spacing}
              initialSpacing={initialSpacing}
              endSpacing={0}
              yAxisLabelWidth={0}
              hideYAxisText
              yAxisThickness={0}
              xAxisThickness={1}
              xAxisColor={colors.fieldBorder}
              rulesColor={colors.line}
              rulesType="solid"
              xAxisLabelTextStyle={{ color: colors.secondary, fontSize: 12 }}
              xAxisLabelsHeight={18}
              labelsDistanceFromXaxis={4}
              isAnimated={false}
              disablePress
              disableScroll
              showScrollIndicator={false}
              barBorderTopLeftRadius={4}
              barBorderTopRightRadius={4}
            />
          )}
        </View>
      </View>
    </View>
  );
}

export function SpendingTimeline({
  buckets,
}: {
  buckets: Record<Granularity, AnalyticsBucket[]>;
}) {
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [requestedPage, setPage] = useState<number>();
  const [showValues, setShowValues] = useState(false);
  const all = buckets[granularity];
  const lastPage = Math.max(0, Math.ceil(all.length / 7) - 1);
  const page = Math.min(requestedPage ?? lastPage, lastPage);
  const visible = all.slice(page * 7, page * 7 + 7);
  const first = visible[0],
    last = visible.at(-1);
  const names = { day: "days", week: "weeks", month: "months" };
  return (
    <View style={styles.section}>
      <AppText variant="title">Spending over time</AppText>
      <ChoiceGroup
        label="Chart grouping"
        choices={[
          { value: "day", label: "Daily" },
          { value: "week", label: "Weekly" },
          { value: "month", label: "Monthly" },
        ]}
        value={granularity}
        onChange={(value) => {
          setGranularity(value as Granularity);
          setPage(undefined);
        }}
      />
      <AppText color={colors.secondary}>
        {first && last
          ? `${formatBudgetDate(first.start)} – ${formatBudgetDate(last.end)}`
          : "No dates selected"}
      </AppText>
      <MoneyBarChart
        points={visible.map((bucket) => ({
          value: bucket.expenseSen,
          label:
            granularity === "month"
              ? formatFinancialDate(bucket.start).split(" ")[1]
              : granularity === "week"
                ? formatFinancialDate(bucket.start).replace(" ", "")
                : bucket.start.slice(8),
        }))}
        label={`Recorded expenses across ${visible.length} ${names[granularity]}. Exact amounts are available with Show chart values.`}
        testID="spending-chart"
      />
      <AppText variant="caption" color={colors.secondary}>
        Showing {page * 7 + 1}–{page * 7 + visible.length} of {all.length}{" "}
        {names[granularity]}. Weekly buckets start Monday; the first and last
        buckets may be partial. Zero bars mean no recorded expenses.
      </AppText>
      {lastPage > 0 && (
        <View style={styles.actions}>
          <View style={styles.action}>
            <AppButton
              label="Earlier periods"
              variant="secondary"
              disabled={page === 0}
              onPress={() => setPage(page - 1)}
            />
          </View>
          <View style={styles.action}>
            <AppButton
              label="Later periods"
              variant="secondary"
              disabled={page === lastPage}
              onPress={() => setPage(page + 1)}
            />
          </View>
        </View>
      )}
      <AppButton
        label={showValues ? "Hide chart values" : "Show chart values"}
        variant="secondary"
        onPress={() => setShowValues(!showValues)}
      />
      {showValues && (
        <View testID="spending-values">
          {visible.map((bucket) => (
            <View key={bucket.start} style={styles.valueRow}>
              <AppText color={colors.secondary} style={styles.valueLabel}>
                {formatBudgetDate(bucket.start)}
                {bucket.end !== bucket.start
                  ? ` – ${formatBudgetDate(bucket.end)}`
                  : ""}
              </AppText>
              <AppText variant="label" money>
                {formatMYR(bucket.expenseSen)}
              </AppText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: spacing.xl, gap: spacing.md },
  chart: { width: "100%", gap: 8 },
  plot: { minHeight: 206, paddingTop: 12, overflow: "hidden" },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flex: 1, minWidth: 110 },
  valueRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  valueLabel: { flex: 1, minWidth: 120 },
});
