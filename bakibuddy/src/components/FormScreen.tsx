import type { PropsWithChildren } from "react";
import { useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "./AppText";
import { Icon } from "./Icon";
import { colors, layout, spacing } from "../theme/tokens";

export function FormScreen({
  title,
  children,
  busy = false,
}: PropsWithChildren<{ title: string; busy?: boolean }>) {
  const router = useRouter();
  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right", "bottom"]}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel and go back"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/")
            }
            style={styles.back}
          >
            <Icon name="arrow-back" color={colors.emerald} size={20} />
            <AppText variant="label" color={colors.emerald}>
              Cancel
            </AppText>
          </Pressable>
          <AppText
            variant="heading"
            accessibilityRole="header"
            testID="screen-title"
            style={styles.title}
          >
            {title}
          </AppText>
          <View style={styles.body}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    width: "100%",
    maxWidth: layout.maxWidth,
    alignSelf: "center",
  },
  back: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  title: { marginTop: 12, marginBottom: 24 },
  body: { gap: spacing.xl },
});
