import { Platform } from "react-native";

export const colors = {
  background: "#F7F8F4",
  surface: "#FFFFFF",
  canvas: "#E8EEEB",
  navy: "#182D35",
  secondary: "#586B70",
  muted: "#586B70",
  line: "#E4EAE5",
  fieldBorder: "#74867B",
  emerald: "#11634E",
  emeraldDark: "#0B4939",
  emeraldSoft: "#E8F1E9",
  mint: "#D8EFCC",
  onEmerald: "#E0F0E6",
  amber: "#8A571B",
  amberSoft: "#FAEEDB",
  orange: "#A6532D",
  orangeSoft: "#F9EDE4",
  blue: "#355D86",
  blueSoft: "#EAF0F8",
  purple: "#70548A",
  purpleSoft: "#F0EBF5",
  graySoft: "#EDF0ED",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 36,
} as const;
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;
export const layout = {
  maxWidth: 600,
  compactWidth: 360,
  targetSize: 48,
} as const;

export const typography = {
  display: {
    fontSize: 42,
    lineHeight: 52,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  heading: {
    fontSize: 28,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  title: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  body: { fontSize: 15, lineHeight: 23, fontWeight: "400" },
  label: { fontSize: 14, lineHeight: 21, fontWeight: "600" },
  caption: { fontSize: 12, lineHeight: 18, fontWeight: "400" },
} as const;

export const systemFont = Platform.OS === "ios" ? "System" : undefined;
