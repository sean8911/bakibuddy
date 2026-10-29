import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, View } from "react-native";
import { AppText } from "./AppText";
import { AppButton } from "./AppButton";
import {
  FINANCIAL_TIMEZONE,
  longFinancialDate,
  todayInKL,
} from "../utils/dates";
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
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <AppText variant="label">{label}</AppText>
      <AppButton
        label={value ? `${label}: ${longFinancialDate(value)}` : `${label}: Choose date`}
        icon="calendar-outline"
        variant="secondary"
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      {open && (
        <>
          <DateTimePicker
            value={new Date(`${value || todayInKL()}T12:00:00+08:00`)}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            timeZoneName={FINANCIAL_TIMEZONE}
            maximumDate={new Date(`${maximumDate}T23:59:59+08:00`)}
            minimumDate={new Date("1900-01-01T12:00:00+08:00")}
            themeVariant="light"
            onChange={(event, date) => {
              if (Platform.OS !== "ios") setOpen(false);
              if (event.type === "set" && date) onChange(todayInKL(date));
            }}
          />
          {Platform.OS === "ios" && (
            <AppButton
              label="Done choosing date"
              onPress={() => { if (!value) onChange(todayInKL()); setOpen(false); }}
            />
          )}
        </>
      )}
      <AppText variant="caption" color={colors.secondary}>
        Financial dates use Kuala Lumpur time.
      </AppText>
    </View>
  );
}
