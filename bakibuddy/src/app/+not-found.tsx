import { useRouter } from "expo-router";
import { AppButton } from "../components/AppButton";
import { EmptyState } from "../components/EmptyState";
import { Screen } from "../components/Screen";

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen title="Let’s get you back.">
      <EmptyState
        icon="compass-outline"
        title="This page isn’t here."
        description="Head home to explore the BakiBuddy demo."
      />
      <AppButton
        label="Back to Home"
        onPress={() => router.replace("/")}
        icon="home-outline"
      />
    </Screen>
  );
}
