import { View } from "react-native";
import { AppText } from "./AppText";
import { todayInKL } from "../utils/dates";
import { colors } from "../theme/tokens";
export function DateField({
  value,
  onChange,
  disabled,
  label = "Transaction date",
  maximumDate = todayInKL(),
}: {
  value: string;
  onChange: (date: string) => void;
  disabled?: boolean;
  label?: string;
  maximumDate?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{label}</AppText>
      <input
        aria-label={label}
        type="date"
        value={value}
        min="1900-01-01"
        max={maximumDate}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        style={{
          boxSizing: "border-box",
          minHeight: 52,
          width: "100%",
          maxWidth: "100%",
          minWidth: 0,
          padding: "12px 14px",
          borderRadius: 12,
          border: `1px solid ${colors.fieldBorder}`,
          color: colors.navy,
          background: colors.surface,
          fontSize: 16,
          fontFamily: "inherit",
          colorScheme: "light",
        }}
      />
      <AppText variant="caption" color={colors.secondary}>
        Financial dates use Kuala Lumpur time.
      </AppText>
    </View>
  );
}
