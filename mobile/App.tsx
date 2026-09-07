import { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { ControlButtons } from "./src/components/ControlButtons";
import { FleetList } from "./src/components/FleetList";
import { SpectrumChart } from "./src/components/SpectrumChart";
import { StatusBadge } from "./src/components/StatusBadge";
import { useFleet } from "./src/hooks/useFleet";
import { deriveStatus, useSimulationActions } from "./src/hooks/useSimulation";
import { useSpectrum } from "./src/hooks/useSpectrum";

export default function App() {
  const { fleet } = useFleet();
  const [selectedId, setSelectedId] = useState("monipa-01");
  const selected = fleet.find((m) => m.id === selectedId) ?? null;
  const online = selected?.online ?? true;

  const { spectrum, error: spectrumError } = useSpectrum(selectedId);
  const status = deriveStatus(spectrum);
  const { busy, error: simError, start, pause, stop } = useSimulationActions(selectedId);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <Text style={[styles.title, styles.titlePadding]}>Bioprocess Monitoring</Text>
      <FleetList fleet={fleet} selectedId={selectedId} onSelect={setSelectedId} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>SPECTRUM</Text>
            {spectrum && (
              <Text style={styles.subtitle}>
                reading #{spectrum.index}
                {!online && " · offline"}
              </Text>
            )}
          </View>
          {spectrumError && <Text style={styles.error}>{spectrumError}</Text>}
          <SpectrumChart wavenumbers={spectrum?.wavenumbers ?? []} data={spectrum?.data ?? []} />
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>MONIPA DEVICE</Text>
            <StatusBadge status={status} online={online} />
          </View>
          {!online && <Text style={styles.error}>This Monipa is offline — no control available.</Text>}
          {online && simError && <Text style={styles.error}>{simError}</Text>}
          <ControlButtons busy={busy} status={status} online={online} onStart={start} onPause={pause} onStop={stop} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#14161a" },
  scroll: { padding: 16, paddingTop: 8, gap: 16 },
  title: { color: "#e6e8eb", fontSize: 20, fontWeight: "700" },
  titlePadding: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  card: {
    backgroundColor: "#1b1e24",
    borderColor: "#2a2e36",
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "#9aa0ab", fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  subtitle: { color: "#9aa0ab", fontSize: 12 },
  error: { color: "#ef5350", fontSize: 12 },
});
