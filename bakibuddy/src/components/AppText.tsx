import { isLoaded } from "expo-font";
import { Text, type TextProps, type TextStyle } from "react-native";

import { colors, systemFont, typography } from "../theme/tokens";

type Props = TextProps & {
  variant?: keyof typeof typography;
  color?: string;
  money?: boolean;
};

export function AppText({
  variant = "body",
  color = colors.navy,
  money,
  style,
  ...props
}: Props) {
  const branded =
    variant === "heading" ||
    variant === "display" ||
    variant === "title" ||
    money;
  const brandFont = isLoaded("Manrope_700Bold")
    ? "Manrope_700Bold"
    : systemFont;
  const face: TextStyle = { fontFamily: branded ? brandFont : systemFont };

  return (
    <Text
      {...props}
      style={[
        typography[variant],
        face,
        { color },
        money && { fontVariant: ["tabular-nums"] },
        style,
      ]}
    />
  );
}
