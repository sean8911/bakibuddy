import {
  Tabs,
  TabList,
  TabSlot,
  TabTrigger,
  type TabTriggerSlotProps,
} from "expo-router/ui";
import { forwardRef, type ComponentRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon, type IconName } from "./Icon";

const TabButton = forwardRef<
  ComponentRef<typeof View>,
  TabTriggerSlotProps & { icon: IconName; selectedIcon: IconName }
>(function TabButton(
  { children, isFocused, icon, selectedIcon, ...props },
  ref,
) {
  return (
    <Pressable
      {...props}
      ref={ref}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={typeof children === "string" ? children : undefined}
      aria-selected={Boolean(isFocused)}
      style={({ pressed }) => [styles.tab, pressed && { opacity: 0.65 }]}
    >
      <View style={[styles.icon, isFocused && styles.active]}>
        <Icon
          name={isFocused ? selectedIcon : icon}
          size={22}
          color={isFocused ? colors.emerald : colors.secondary}
        />
      </View>
      <AppText
        variant="caption"
        color={isFocused ? colors.emerald : colors.secondary}
        style={[styles.label, isFocused && styles.selectedLabel]}
      >
        {children}
      </AppText>
    </Pressable>
  );
});

export default function AppTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={styles.tabs}>
      <TabSlot style={styles.slot} />
      <TabList
        style={[
          styles.bar,
          { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ]}
      >
        <TabTrigger name="home" href="/" asChild>
          <TabButton icon="home-outline" selectedIcon="home">
            Home
          </TabButton>
        </TabTrigger>
        <TabTrigger name="transactions" href="/transactions" asChild>
          <TabButton
            icon="swap-horizontal-outline"
            selectedIcon="swap-horizontal"
          >
            Transactions
          </TabButton>
        </TabTrigger>
        <TabTrigger name="budget" href="/budget" asChild>
          <TabButton icon="wallet-outline" selectedIcon="wallet">
            Budget
          </TabButton>
        </TabTrigger>
        <TabTrigger name="insights" href="/insights" asChild>
          <TabButton icon="bar-chart-outline" selectedIcon="bar-chart">
            Insights
          </TabButton>
        </TabTrigger>
        <TabTrigger name="settings" href="/settings" asChild>
          <TabButton icon="settings-outline" selectedIcon="settings">
            Settings
          </TabButton>
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabs: { flex: 1 },
  slot: { flex: 1 },
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingTop: spacing.sm,
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    minWidth: 0,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  icon: {
    width: 48,
    height: 30,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  active: { backgroundColor: colors.emeraldSoft },
  label: { fontSize: 10, lineHeight: 16 },
  selectedLabel: { fontWeight: "700" },
});
