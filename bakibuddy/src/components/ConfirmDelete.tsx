import { Modal, StyleSheet, View } from "react-native";
import { AppButton } from "./AppButton";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "../theme/tokens";
export function ConfirmDelete({
  visible,
  title,
  detail,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  detail: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={styles.scrim}>
        <View
          style={styles.dialog}
          accessibilityViewIsModal
          accessibilityRole="alert"
        >
          <AppText variant="title" accessibilityRole="header">
            {title}
          </AppText>
          <AppText color={colors.secondary}>{detail}</AppText>
          <AppButton
            label={busy ? "Deleting…" : "Confirm deletion"}
            variant="danger"
            disabled={busy}
            onPress={onConfirm}
          />
          <AppButton
            label="Keep it"
            variant="secondary"
            disabled={busy}
            onPress={onCancel}
          />
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: "rgba(24,45,53,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: radius.lg,
    gap: spacing.lg,
  },
});
