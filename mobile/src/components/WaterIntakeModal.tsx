import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  createIntakeId,
  createWaterIntake,
  type WaterIntakeRequest,
} from "../api/dailyStatistics";
import { getErrorMessage } from "../api/client";
import { theme } from "../theme";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function WaterIntakeModal({ visible, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState("250");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<WaterIntakeRequest | null>(null);

  const chooseAmount = (value: string) => {
    setAmount(value.replace(/[^0-9]/g, ""));
    // A changed amount is a new logical action, so it needs a new ID.
    setPending(null);
    setError(null);
  };

  const submit = async () => {
    const amountMl = Number(amount);
    if (!Number.isInteger(amountMl) || amountMl < 1 || amountMl > 5000) {
      setError("Nhập lượng nước từ 1 đến 5.000 mL.");
      return;
    }

    const payload =
      pending ??
      ({
        intakeId: createIntakeId(),
        occurredAt: new Date().toISOString(),
        amountMl,
      } satisfies WaterIntakeRequest);

    setPending(payload);
    setSaving(true);
    setError(null);

    try {
      await createWaterIntake(payload);
      setPending(null);
      setAmount("250");
      await onSaved();
      onClose();
    } catch (requestError) {
      // Keep the exact payload and intakeId for a safe retry after uncertain failures.
      setError(getErrorMessage(requestError) + " Bạn có thể thử lại; ứng dụng sẽ dùng lại mã ghi nhận này.");
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    if (saving) return;
    setError(null);
    setPending(null);
    setAmount("250");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dismiss}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.headingRow}>
            <View style={styles.iconBubble}>
              <Text style={styles.headingIcon}>💧</Text>
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>BỔ SUNG NƯỚC</Text>
              <Text style={styles.title}>Bạn vừa uống bao nhiêu?</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={dismiss} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Lượng nước (mL)</Text>
          <View style={styles.amountRow}>
            <TextInput
              value={amount}
              onChangeText={chooseAmount}
              keyboardType="number-pad"
              returnKeyType="done"
              editable={!saving}
              selectTextOnFocus
              accessibilityLabel="Lượng nước tính bằng millilitres"
              style={styles.amountInput}
              maxLength={4}
            />
            <Text style={styles.amountUnit}>mL</Text>
          </View>

          <View style={styles.quickAmounts}>
            {[150, 250, 350, 500].map((value) => (
              <Pressable
                key={value}
                onPress={() => chooseAmount(String(value))}
                disabled={saving}
                style={[styles.quickChip, amount === String(value) && styles.quickChipSelected]}
              >
                <Text style={[styles.quickText, amount === String(value) && styles.quickTextSelected]}>
                  {value} mL
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.helper}>Mỗi lần uống được lưu thành một lần ghi nhận riêng.</Text>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={submit}
            disabled={saving}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, saving && styles.disabled]}
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>{pending ? "Thử gửi lại" : "Lưu lượng nước"}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" onPress={dismiss} disabled={saving} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Để sau</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 35, 31, 0.34)",
  },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  grabber: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 4,
    backgroundColor: "#D9E3DF",
    marginBottom: 22,
  },
  headingRow: { flexDirection: "row", alignItems: "center", marginBottom: 26, gap: 12 },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: theme.colors.waterBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  headingIcon: { fontSize: 25 },
  headingCopy: { flex: 1, gap: 4 },
  eyebrow: { color: theme.colors.primary, fontSize: 10, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 19, fontWeight: "800" },
  close: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center" },
  closeText: { color: theme.colors.secondaryText, fontSize: 25, lineHeight: 28 },
  label: { color: theme.colors.secondaryText, fontSize: 13, fontWeight: "700", marginBottom: 8 },
  amountRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderRadius: 16, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  amountInput: { flex: 1, paddingVertical: 13, color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  amountUnit: { color: theme.colors.secondaryText, fontWeight: "700" },
  quickAmounts: { flexDirection: "row", gap: 8, marginTop: 12 },
  quickChip: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border },
  quickChipSelected: { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
  quickText: { color: theme.colors.secondaryText, fontSize: 12, fontWeight: "700" },
  quickTextSelected: { color: theme.colors.primaryDark },
  helper: { color: theme.colors.secondaryText, fontSize: 12, lineHeight: 18, marginTop: 13, marginBottom: 12 },
  errorBox: { backgroundColor: theme.colors.dangerBackground, padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { color: theme.colors.danger, fontSize: 12, lineHeight: 18 },
  primaryButton: { minHeight: 52, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  primaryText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.6 },
  cancelButton: { alignItems: "center", paddingVertical: 14 },
  cancelText: { color: theme.colors.secondaryText, fontSize: 14, fontWeight: "700" },
});
