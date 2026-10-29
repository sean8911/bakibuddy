import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";
import { AppButton } from "../../components/AppButton";
import { AppText } from "../../components/AppText";
import { Brand } from "../../components/Brand";
import { FinancialCard } from "../../components/FinancialCard";
import { Screen } from "../../components/Screen";
import { SectionHeader } from "../../components/SectionHeader";
import { useFinance } from "../../state/FinanceProvider";
import { colors } from "../../theme/tokens";
export default function SettingsScreen() {
  const router = useRouter();
  const { snapshot } = useFinance();
  return (
    <Screen
      title="Make yourself at home."
      subtitle="Your records. Your own starting point."
    >
      <FinancialCard tone="soft" style={styles.group}>
        <Brand large />
        <AppText color={colors.emerald}>
          Know your balance. Own your future.
        </AppText>
        <AppText variant="caption" color={colors.secondary}>
          Version 0.8.1 · Animated welcome preview
        </AppText>
      </FinancialCard>
      <View style={styles.section}>
        <SectionHeader title="Welcome & sign-in" />
        <AppText color={colors.secondary}>
          Preview the new welcome screen. Email accounts are coming later;
          your local records work without one.
        </AppText>
        <AppButton
          label="Open login preview"
          variant="secondary"
          icon="person-circle-outline"
          onPress={() => router.push("/login")}
        />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Your accounts" />
        <AppText color={colors.secondary}>
          {snapshot.accounts.length}{" "}
          {snapshot.accounts.length === 1 ? "account" : "accounts"} tracked on
          this device. Add accounts, rename them or correct their opening
          balances.
        </AppText>
        <AppButton
          label="Manage accounts"
          icon="wallet-outline"
          variant="secondary"
          onPress={() => router.push("/accounts")}
        />
      </View>
      <View style={styles.section}>
        <AppButton label="Scan receipt or screenshot" icon="scan-outline" variant="secondary" onPress={() => router.push('/scan-receipt')} />
        <SectionHeader title="Your defaults" />
        <FinancialCard style={styles.group}>
          <AppText variant="label">Currency</AppText>
          <AppText color={colors.secondary}>MYR · Malaysian Ringgit</AppText>
          <AppText variant="label">Financial timezone</AppText>
          <AppText color={colors.secondary}>Asia/Kuala_Lumpur</AppText>
          <AppText variant="label">Appearance</AppText>
          <AppText color={colors.secondary}>Light</AppText>
        </FinancialCard>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Stored locally" />
        <AppText color={colors.secondary}>
          Accounts and transactions are saved in SQLite on this device. No login
          or bank connection is required. Assistant answers work locally;
          optional cloud requests show their data and ask for approval each time.
        </AppText>
        <AppText color={colors.secondary}>
          Export a reference copy before uninstalling or clearing app data.
          Exports are unencrypted, and this version cannot restore them.
          Browser records belong to this browser profile and site address.
        </AppText>
      </View>
      <View style={styles.section}>
        <SectionHeader title="Your budget" />
        <AppButton label="Budget plan" variant="secondary" onPress={() => router.push("/budget-plan")} />
        <AppButton label="Bills & income" variant="secondary" onPress={() => router.push("/planned-items")} />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Statement import" />
        <AppButton label="Import TNG statement" variant="secondary" icon="download-outline" onPress={()=>router.push("/import-tng")} />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Your assistant" />
        <AppButton label="Ask about your money" icon="chatbubble-outline" variant="secondary" onPress={()=>router.push('/assistant')} />
        <AppButton label="Review expense categories" variant="secondary" onPress={()=>router.push('/assistant-categories')} />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Privacy & data" />
        <AppButton label="Privacy & data controls" variant="secondary" icon="shield-checkmark-outline" onPress={() => router.push('/data-privacy')} />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 32, gap: 12 },
  group: { gap: 12 },
});
