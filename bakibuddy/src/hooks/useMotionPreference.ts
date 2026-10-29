import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform } from "react-native";
import { useReducedMotion } from "react-native-reanimated";

export function useMotionPreference(onMotionSuppressed: () => void) {
  const initialReducedMotion = useReducedMotion();
  const [reducedMotion, setReducedMotion] = useState(initialReducedMotion);
  const [screenReader, setScreenReader] = useState(false);

  useEffect(() => {
    let active = true;
    const updateMotion = (enabled: boolean) => {
      setReducedMotion(enabled);
      if (enabled) onMotionSuppressed();
    };
    const updateReader = (enabled: boolean) => {
      setScreenReader(enabled);
      if (enabled) onMotionSuppressed();
    };
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      updateMotion,
    );
    // React Native Web returns a constant true for this query, not a detection.
    // Browser motion follows its real prefers-reduced-motion setting instead.
    const reader = Platform.OS === "web" ? undefined : AccessibilityInfo.addEventListener(
      "screenReaderChanged", updateReader,
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => { if (active) updateMotion(enabled); })
      .catch(() => { if (active) updateMotion(true); });
    if (Platform.OS !== "web") {
      void AccessibilityInfo.isScreenReaderEnabled()
        .then((enabled) => { if (active) updateReader(enabled); })
        .catch(() => { if (active) updateReader(true); });
    }
    return () => {
      active = false;
      motion.remove();
      reader?.remove();
    };
  }, [onMotionSuppressed]);

  return { reducedMotion, skipDecorativeMotion: reducedMotion || screenReader };
}
