import type { Href } from "expo-router";
import { Link } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";

import { colors, layout, spacing } from "../theme/tokens";
import { AppText } from "./AppText";
import { Icon } from "./Icon";

export function SectionHeader({
  title,
  link,
  linkLabel = "View all",
}: {
  title: string;
  link?: Href;
  linkLabel?: string;
}) {
  return (
    <View style={styles.row}>
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {link && (
        <Link href={link} asChild>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${linkLabel}: ${title}`}
            style={styles.link}
          >
            <AppText variant="label" color={colors.emerald}>
              {linkLabel}
            </AppText>
            <Icon name="arrow-forward" color={colors.emerald} size={16} />
          </Pressable>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: { flexShrink: 1 },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: layout.targetSize,
    justifyContent: "flex-end",
  },
});
