import { Pressable, StyleSheet, Text, View } from "react-native";
import type { SimStatus } from "../hooks/useSimulation";

type Props = {
  busy: boolean;
  status: SimStatus;
  online: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
};

export function ControlButtons({ busy, status, online, onStart, onPause, onStop }: Props) {
  return (
    <View style={styles.row}>
      <Btn label="▶ Start" color="#35d07f" disabled={!online || busy || status === "running"} onPress={onStart} />
      <Btn label="❚❚ Pause" color="#f5c518" disabled={!online || busy || status !== "running"} onPress={onPause} />
      <Btn label="■ Stop" color="#ef5350" disabled={!online || busy || status === "idle"} onPress={onStop} />
    </View>
  );
}

function Btn({
  label,
  color,
  disabled,
  onPress,
}: {
  label: string;
  color: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          borderColor: disabled ? "#2a2e36" : color,
          backgroundColor: disabled ? "#23262d" : `${color}33`,
        },
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.btnText, { color: disabled ? "#9aa0ab" : color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  pressed: { opacity: 0.75 },
  btnText: { fontSize: 13, fontWeight: "700" },
});
