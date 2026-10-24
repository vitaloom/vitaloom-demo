import { StyleSheet, Text, View } from "react-native";

import { theme } from "../theme";

type MetricCardProps = {
  title: string;
  icon: string;
  value: string;
  unit: string;
  description: string;
  accent: string;
  tint: string;
  simulated?: boolean;
};

export function MetricCard({
  title,
  icon,
  value,
  unit,
  description,
  accent,
  tint,
  simulated = false,
}: MetricCardProps) {
  return (
    <View style={styles.card} accessible accessibilityLabel={title + ": " + value + " " + unit}>
      <View style={[styles.iconWrap, { backgroundColor: tint }]}>
        <Text style={[styles.icon, { color: accent }]}>{icon}</Text>
      </View>
      {simulated ? (
        <View style={styles.simulatedPill}>
          <View style={styles.simulatedDot} />
          <Text style={styles.simulatedText}>Mô phỏng</Text>
        </View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.valueLine}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={styles.value}>{value}</Text>
        {value !== "—" ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
      <Text style={styles.description}>{description}</Text>
      <View style={[styles.accentLine, { backgroundColor: accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    flexShrink: 0,
    minHeight: 190,
    padding: 16,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  icon: { fontSize: 23, fontWeight: "700" },
  simulatedPill: {
    position: "absolute",
    top: 18,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
    backgroundColor: "#F4F6F5",
  },
  simulatedDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: theme.colors.secondaryText },
  simulatedText: { color: theme.colors.secondaryText, fontSize: 9, fontWeight: "700" },
  title: { color: theme.colors.secondaryText, fontSize: 13, fontWeight: "600" },
  valueLine: { minHeight: 38, flexDirection: "row", alignItems: "baseline", gap: 5, marginTop: 5 },
  value: { flexShrink: 1, color: theme.colors.text, fontSize: 30, letterSpacing: -0.8, fontWeight: "800" },
  unit: { color: theme.colors.secondaryText, fontSize: 11, fontWeight: "600" },
  description: { color: theme.colors.secondaryText, fontSize: 11, lineHeight: 16, marginTop: 3 },
  accentLine: { position: "absolute", left: 0, right: 0, bottom: 0, height: 4, opacity: 0.8 },
});
