import { StyleSheet, Text, View } from "react-native";
import type { SimStatus } from "../hooks/useSimulation";

const COLOR: Record<SimStatus, string> = {
  idle: "#4a4d54",
  paused: "#f5c518",
  running: "#35d07f",
};

const LABEL: Record<SimStatus, string> = {
  idle: "Idle",
  paused: "Paused",
  running: "Running",
};

export function StatusBadge({ status, online }: { status: SimStatus; online: boolean }) {
  const color = online ? COLOR[status] : "#ef5350";
  const label = online ? LABEL[status] : "Offline";
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color, shadowColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#23262d",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
  },
});
