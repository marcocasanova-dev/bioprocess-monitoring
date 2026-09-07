import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { MonipaInfo } from "../hooks/useFleet";
import { deriveStatus } from "../hooks/useSimulation";

type Props = {
  fleet: MonipaInfo[];
  selectedId: string;
  onSelect: (id: string) => void;
};

const DOT_COLOR = {
  offline: "#4a4d54",
  running: "#35d07f",
  paused: "#f5c518",
  idle: "#4c8dff",
} as const;

export function FleetList({ fleet, selectedId, onSelect }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {fleet.map((m) => {
        const status = m.online ? deriveStatus(m) : null;
        const dotColor = m.online ? DOT_COLOR[status!] : DOT_COLOR.offline;
        const label = m.online ? (status === "running" ? "Running" : status === "paused" ? "Paused" : "Idle") : "Offline";
        const selected = m.id === selectedId;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
            style={[styles.chip, selected && styles.chipSelected, !m.online && styles.chipOffline]}
          >
            <View style={[styles.dot, { backgroundColor: dotColor }]} />
            <Text style={styles.name}>{m.name}</Text>
            <Text style={styles.state}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2a2e36",
    backgroundColor: "#1b1e24",
  },
  chipSelected: { borderColor: "#4c8dff", backgroundColor: "#20263a" },
  chipOffline: { opacity: 0.6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  name: { color: "#e6e8eb", fontSize: 12, fontWeight: "700" },
  state: { color: "#9aa0ab", fontSize: 11 },
});
