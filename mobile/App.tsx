import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
} from "react-native";

import { MetricCard } from "./src/components/MetricCard";
import { SleepEditorModal } from "./src/components/SleepEditorModal";
import { WaterIntakeModal } from "./src/components/WaterIntakeModal";
import { useDailyStatistics } from "./src/hooks/useDailyStatistics";
import { theme } from "./src/theme";

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatDay(dateString?: string) {
  const date = dateString
    ? new Date(dateString + "T12:00:00+07:00")
    : new Date();

  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(date);
}

function formatMetric(value: number | null | undefined, decimals = 0) {
  if (value === null || value === undefined) return "—";
  return decimals > 0
    ? value.toLocaleString("vi-VN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      })
    : numberFormatter.format(value);
}

function formatUpdateTime(date: Date | null) {
  if (!date) return "Đang chờ dữ liệu";
  return "Cập nhật lúc " + date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function App() {
  const { data, loading, refreshing, error, lastUpdated, refresh } =
    useDailyStatistics();
  const [waterVisible, setWaterVisible] = useState(false);
  const [sleepVisible, setSleepVisible] = useState(false);

  const dayLabel = useMemo(() => formatDay(data?.date), [data?.date]);

  const waterSaved = async () => {
    await refresh();
  };

  const sleepSaved = async () => {
    await refresh();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void refresh()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <View style={styles.topLine}>
          <View style={styles.brandMark}>
            <View style={styles.brandMarkInner}>
              <Text style={styles.brandMarkText}>V</Text>
            </View>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>VitaLoom</Text>
            <Text style={styles.brandTagline}>CHĂM SÓC BẢN THÂN, MỖI NGÀY</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={[styles.liveDot, { backgroundColor: error ? "#D97757" : theme.colors.primary }]} />
            <Text style={styles.liveText}>{error ? "Ngoại tuyến" : "Hôm nay"}</Text>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={styles.dateLabel}>{dayLabel.toLocaleUpperCase("vi-VN")}</Text>
          <Text style={styles.heading}>Chào bạn,</Text>
          <Text style={styles.headingSecond}>mình cùng xem hôm nay nhé.</Text>
          <Text style={styles.subheading}>
            Một chút quan tâm đến cơ thể, mỗi ngày đều có ý nghĩa.
          </Text>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>Tổng quan sức khỏe</Text>
            <Text style={styles.sectionSubtitle}>Các chỉ số trong ngày của bạn</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Làm mới dữ liệu"
            onPress={() => void refresh()}
            disabled={loading || refreshing}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={styles.refreshIcon}>↻</Text>
            )}
          </Pressable>
        </View>

        {loading && !data ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingTitle}>Đang tải dữ liệu</Text>
            <Text style={styles.loadingText}>Đang kết nối với VitaLoom...</Text>
          </View>
        ) : null}

        {!loading && !data && error ? (
          <View style={styles.errorCard}>
            <View style={styles.errorIconWrap}>
              <Text style={styles.errorIcon}>!</Text>
            </View>
            <Text style={styles.errorTitle}>Chưa thể tải dữ liệu</Text>
            <Text style={styles.errorDescription}>{error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => void refresh()}
              style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
            >
              <Text style={styles.retryText}>Thử kết nối lại</Text>
            </Pressable>
          </View>
        ) : null}

        {data ? (
          <>
            {error ? (
              <View style={styles.warningBanner}>
                <Text style={styles.warningIcon}>↻</Text>
                <View style={styles.warningCopy}>
                  <Text style={styles.warningTitle}>Chưa cập nhật được dữ liệu mới</Text>
                  <Text style={styles.warningText}>Đang giữ dữ liệu tải thành công gần nhất.</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => void refresh()}>
                  <Text style={styles.warningRetry}>Thử lại</Text>
                </Pressable>
              </View>
            ) : null}

            <View style={styles.metricGrid}>
              <MetricCard
                title="Nhịp tim"
                icon="♥"
                value={formatMetric(data.heartRateBpm)}
                unit="bpm"
                description={data.heartRateBpm === null ? "Chưa có phép đo hôm nay" : "Nhịp tim mô phỏng gần nhất"}
                accent={theme.colors.heart}
                tint={theme.colors.heartBackground}
                simulated
              />
              <MetricCard
                title="Số bước"
                icon="↗"
                value={formatMetric(data.steps)}
                unit="bước"
                description={data.steps === null ? "Chưa có dữ liệu bước chân" : "Tổng bước mô phỏng hôm nay"}
                accent={theme.colors.steps}
                tint={theme.colors.stepsBackground}
                simulated
              />
              <MetricCard
                title="Giấc ngủ"
                icon="☾"
                value={formatMetric(data.sleepHours, 2)}
                unit="giờ"
                description={data.sleepHours === null ? "Chưa nhập thời lượng ngủ" : "Thời lượng ngủ đã ghi nhận"}
                accent={theme.colors.sleep}
                tint={theme.colors.sleepBackground}
              />
              <MetricCard
                title="Nước uống"
                icon="⌁"
                value={formatMetric(data.waterMl)}
                unit="mL"
                description={data.waterMl === null ? "Chưa ghi nhận nước uống" : "Tổng lượng nước hôm nay"}
                accent={theme.colors.water}
                tint={theme.colors.waterBackground}
              />
            </View>

            <View style={styles.sourceNote}>
              <View style={styles.sourceDot} />
              <Text style={styles.sourceText}>
                Nhịp tim và bước chân là dữ liệu mô phỏng, không phải từ thiết bị đeo.
              </Text>
            </View>
          </>
        ) : null}

        <View style={styles.sectionHeadingActions}>
          <View style={styles.actionHeadingCopy}>
            <Text style={styles.sectionTitle}>Thói quen của bạn</Text>
            <Text style={styles.sectionSubtitle}>Ghi nhận những điều nhỏ mỗi ngày</Text>
          </View>
        </View>

        <View style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.waterBackground }]}>
            <Text style={styles.actionEmoji}>💧</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Uống nước</Text>
            <Text style={styles.actionDescription}>Thêm một lần uống vào nhật ký hôm nay.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setWaterVisible(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Text style={styles.addButtonText}>+ Thêm</Text>
          </Pressable>
        </View>

        <View style={styles.actionCard}>
          <View style={[styles.actionIcon, { backgroundColor: theme.colors.sleepBackground }]}>
            <Text style={styles.actionEmoji}>🌙</Text>
          </View>
          <View style={styles.actionCopy}>
            <Text style={styles.actionTitle}>Giấc ngủ</Text>
            <Text style={styles.actionDescription}>Cập nhật tổng số giờ ngủ trong ngày.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setSleepVisible(true)}
            style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
          >
            <Text style={styles.addButtonText}>{data?.sleepHours == null ? "Nhập" : "Sửa"}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLine} />
          <Text style={styles.footerBrand}>VitaLoom</Text>
          <Text style={styles.footerCaption}>{formatUpdateTime(lastUpdated)}</Text>
          <Text style={styles.footerDisclaimer}>Một bản demo nhỏ cho những thói quen tốt hơn.</Text>
        </View>
      </ScrollView>

      <WaterIntakeModal
        visible={waterVisible}
        onClose={() => setWaterVisible(false)}
        onSaved={waterSaved}
      />
      <SleepEditorModal
        visible={sleepVisible}
        currentHours={data?.sleepHours ?? null}
        onClose={() => setSleepVisible(false)}
        onSaved={sleepSaved}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 32 },
  brandMark: { width: 44, height: 44, borderRadius: 16, backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" },
  brandMarkInner: { width: 27, height: 27, borderRadius: 10, borderWidth: 1.5, borderColor: "#C8F0E6", alignItems: "center", justifyContent: "center" },
  brandMarkText: { color: "#FFFFFF", fontSize: 17, fontWeight: "900" },
  brandCopy: { flex: 1, gap: 3 },
  brandName: { color: theme.colors.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  brandTagline: { color: theme.colors.secondaryText, fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  liveBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { color: theme.colors.secondaryText, fontSize: 10, fontWeight: "700" },
  greeting: { marginBottom: 28 },
  dateLabel: { color: theme.colors.primary, fontSize: 10, fontWeight: "900", letterSpacing: 1.5, marginBottom: 10 },
  heading: { color: theme.colors.text, fontSize: 32, lineHeight: 38, fontWeight: "900", letterSpacing: -1.1 },
  headingSecond: { color: theme.colors.primary, fontSize: 27, lineHeight: 34, fontWeight: "800", letterSpacing: -0.8 },
  subheading: { color: theme.colors.secondaryText, fontSize: 13, lineHeight: 20, marginTop: 10, maxWidth: 320 },
  sectionHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800", letterSpacing: -0.3 },
  sectionSubtitle: { color: theme.colors.secondaryText, fontSize: 11, marginTop: 4 },
  refreshButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center", justifyContent: "center" },
  refreshIcon: { color: theme.colors.primary, fontSize: 25, fontWeight: "600", lineHeight: 29 },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  loadingCard: { alignItems: "center", justifyContent: "center", minHeight: 220, padding: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24 },
  loadingTitle: { color: theme.colors.text, fontSize: 15, fontWeight: "800", marginTop: 16 },
  loadingText: { color: theme.colors.secondaryText, fontSize: 12, marginTop: 5 },
  errorCard: { alignItems: "center", padding: 24, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24 },
  errorIconWrap: { width: 46, height: 46, borderRadius: 16, backgroundColor: theme.colors.dangerBackground, alignItems: "center", justifyContent: "center" },
  errorIcon: { color: theme.colors.danger, fontSize: 26, fontWeight: "900" },
  errorTitle: { color: theme.colors.text, fontSize: 17, fontWeight: "800", marginTop: 14 },
  errorDescription: { color: theme.colors.secondaryText, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: 8 },
  retryButton: { marginTop: 18, borderRadius: 14, backgroundColor: theme.colors.primary, paddingHorizontal: 18, paddingVertical: 12 },
  retryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, backgroundColor: "#FFF6E9", borderWidth: 1, borderColor: "#F4E2C7", marginBottom: 12 },
  warningIcon: { color: "#A66A19", fontSize: 18, fontWeight: "900" },
  warningCopy: { flex: 1, gap: 3 },
  warningTitle: { color: "#865516", fontSize: 11, fontWeight: "800" },
  warningText: { color: "#98784C", fontSize: 10, lineHeight: 15 },
  warningRetry: { color: "#865516", fontSize: 11, fontWeight: "800" },
  sourceNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingHorizontal: 4, marginTop: 13, marginBottom: 30 },
  sourceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.secondaryText, marginTop: 5 },
  sourceText: { flex: 1, color: theme.colors.secondaryText, fontSize: 10, lineHeight: 16 },
  sectionHeadingActions: { marginBottom: 14 },
  actionHeadingCopy: { gap: 1 },
  actionCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginBottom: 10, borderRadius: 20, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  actionIcon: { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  actionEmoji: { fontSize: 22 },
  actionCopy: { flex: 1, gap: 4 },
  actionTitle: { color: theme.colors.text, fontSize: 14, fontWeight: "800" },
  actionDescription: { color: theme.colors.secondaryText, fontSize: 10, lineHeight: 15, paddingRight: 3 },
  addButton: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 12, backgroundColor: theme.colors.primaryLight },
  addButtonText: { color: theme.colors.primaryDark, fontSize: 11, fontWeight: "900" },
  pressed: { opacity: 0.75 },
  footer: { alignItems: "center", paddingTop: 28, paddingBottom: 8 },
  footerLine: { width: 36, height: 3, borderRadius: 2, backgroundColor: theme.colors.border, marginBottom: 14 },
  footerBrand: { color: theme.colors.primary, fontSize: 14, fontWeight: "900", letterSpacing: 0.4 },
  footerCaption: { color: theme.colors.secondaryText, fontSize: 10, marginTop: 5 },
  footerDisclaimer: { color: "#95A39F", fontSize: 10, marginTop: 8, textAlign: "center" },
});
