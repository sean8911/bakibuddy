import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../theme/tokens";

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline,
  hint,
  error,
  onBlur,
  disabled,
  maxLength = 300,
  secureTextEntry = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  hint?: string;
  error?: string;
  onBlur?: () => void;
  disabled?: boolean;
  maxLength?: number;
  secureTextEntry?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        accessibilityState={{ disabled: !!disabled }}
        aria-disabled={!!disabled}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.secondary}
        keyboardType={keyboardType}
        multiline={multiline}
        editable={!disabled}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        autoComplete={secureTextEntry ? "off" : undefined}
        autoCorrect={secureTextEntry ? false : undefined}
        autoCapitalize={secureTextEntry ? "none" : undefined}
        style={[
          styles.input,
          multiline && styles.multiline,
          error && styles.invalid,
        ]}
        selectionColor={colors.emerald}
      />
      {error ? (
        <AppText
          variant="caption"
          color={colors.orange}
          accessibilityLiveRegion="polite"
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={colors.secondary}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
export function ChoiceGroup({
  label,
  choices,
  value,
  onChange,
  disabled,
}: {
  label: string;
  choices: readonly { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <View
        style={styles.choices}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
      >
        {choices.map((choice) => (
          <Pressable
            key={choice.value}
            accessibilityRole="radio"
            accessibilityLabel={`${label}: ${choice.label}`}
            accessibilityState={{ checked: value === choice.value, disabled }}
            aria-checked={value === choice.value}
            disabled={disabled}
            onPress={() => onChange(choice.value)}
            style={({ pressed }) => [
              styles.choice,
              value === choice.value && styles.selected,
              pressed && { opacity: 0.7 },
            ]}
          >
            <AppText
              variant="label"
              color={value === choice.value ? colors.emerald : colors.secondary}
            >
              {choice.label}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function FormError({ message }: { message?: string }) {
  return message ? (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
      style={styles.error}
    >
      <AppText color={colors.orange}>{message}</AppText>
    </View>
  ) : null;
}
export const formStyles = StyleSheet.create({
  field: { gap: 8 },
  hint: { color: colors.secondary },
});
const styles = StyleSheet.create({
  field: { gap: spacing.sm },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.fieldBorder,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    fontSize: 16,
    color: colors.navy,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  invalid: { borderColor: colors.orange },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 48,
    justifyContent: "center",
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  selected: {
    borderColor: colors.emerald,
    backgroundColor: colors.emeraldSoft,
  },
  error: {
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: colors.orangeSoft,
  },
});
