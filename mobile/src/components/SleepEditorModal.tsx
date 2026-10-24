import { useEffect, useState } from "react";
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

import { getErrorMessage } from "../api/client";
import { updateDailySleep } from "../api/dailyStatistics";
import { theme } from "../theme";

type Props = {
  visible: boolean;
  currentHours: number | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
};

export function SleepEditorModal({ visible, currentHours, onClose, onSaved }: Props) {
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setHours(currentHours === null ? "" : String(currentHours));
      setError(null);
    }
  }, [visible, currentHours]);

  const submit = async () => {
    const value = Number(hours);
    if (hours.trim() === "" || !Number.isFinite(value) || value < 0 || value > 24) {
      setError("Nhập thời lượng từ 0 đến 24 giờ.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      // The server owns the daily value; refresh after the write succeeds.
      await updateDailySleep({ sleepHours: value });
      await onSaved();
      onClose();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  };

  const dismiss = () => {
    if (!saving) {
      setError(null);
      onClose();
    }
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
              <Text style={styles.headingIcon}>🌙</Text>
            </View>
            <View style={styles.headingCopy}>
              <Text style={styles.eyebrow}>GIẤC NGỦ HÔM NAY</Text>
              <Text style={styles.title}>Bạn ngủ bao lâu?</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={dismiss} style={styles.close}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Thời lượng ngủ (giờ)</Text>
          <View style={styles.amountRow}>
            <TextInput
              value={hours}
              onChangeText={(value) => {
                setHours(value.replace(",", ".").replace(/[^0-9.]/g, ""));
                setError(null);
              }}
              keyboardType="decimal-pad"
              returnKeyType="done"
              editable={!saving}
              selectTextOnFocus
              accessibilityLabel="Thời lượng ngủ tính bằng giờ"
              placeholder="Ví dụ: 7.5"
              placeholderTextColor="#9BAAA5"
              style={styles.amountInput}
              maxLength={5}
            />
            <Text style={styles.amountUnit}>giờ</Text>
          </View>

          <View style={styles.suggestions}>
            {[6, 7, 7.5, 8].map((value) => (
              <Pressable
                key={value}
                disabled={saving}
                onPress={() => {
                  setHours(String(value));
                  setError(null);
                }}
                style={[styles.quickChip, hours === String(value) && styles.quickChipSelected]}
              >
                <Text style={[styles.quickText, hours === String(value) && styles.quickTextSelected]}>
                  {value} giờ
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.helper}>Giá trị này sẽ thay thế thời lượng ngủ đã lưu cho ngày hiện tại.</Text>

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
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Lưu thời lượng ngủ</Text>}
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
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(15, 35, 31, 0.34)" },
  sheet: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 34 : 24, backgroundColor: theme.colors.surface, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  grabber: { alignSelf: "center", width: 42, height: 5, borderRadius: 4, backgroundColor: "#D9E3DF", marginBottom: 22 },
  headingRow: { flexDirection: "row", alignItems: "center", marginBottom: 26, gap: 12 },
  iconBubble: { width: 52, height: 52, borderRadius: 18, backgroundColor: theme.colors.sleepBackground, alignItems: "center", justifyContent: "center" },
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
  suggestions: { flexDirection: "row", gap: 8, marginTop: 12 },
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
