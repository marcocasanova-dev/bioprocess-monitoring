import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import type { SimStatus } from "../hooks/useSimulation";

const LED_COLOR: Record<SimStatus, string> = {
  idle: "#4a4d54",
  paused: "#f5c518",
  running: "#35d07f",
};

const BODY_WIDTH = 1.6;
const BODY_HEIGHT = 1.9;
const BODY_DEPTH = 1.15;

/** A stylized, procedural stand-in for the Monipa spectrometer housing. */
export function MonipaDevice({ status }: { status: SimStatus }) {
  const groupRef = useRef<Group>(null);
  const rotorRef = useRef<Mesh>(null);
  const ledRef = useRef<MeshStandardMaterial>(null);

  useFrame((state, delta) => {
    if (status === "running" && rotorRef.current) {
      rotorRef.current.rotation.z += delta * 4;
    }
    if (ledRef.current) {
      const target =
        status === "running" ? 1.4 + Math.sin(state.clock.elapsedTime * 4) * 0.5 : status === "paused" ? 0.8 : 0.15;
      ledRef.current.emissiveIntensity += (target - ledRef.current.emissiveIntensity) * 0.15;
    }
  });

  const halfW = BODY_WIDTH / 2;
  const halfH = BODY_HEIGHT / 2;
  const halfD = BODY_DEPTH / 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Main housing */}
      <RoundedBox args={[BODY_WIDTH, BODY_HEIGHT, BODY_DEPTH]} radius={0.14} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e3e6ea" metalness={0.55} roughness={0.35} />
      </RoundedBox>

      {/* Angled brushed-metal top panel */}
      <RoundedBox
        args={[BODY_WIDTH * 0.82, 0.85, 0.06]}
        radius={0.06}
        smoothness={4}
        position={[0, halfH - 0.28, halfD - 0.32]}
        rotation={[-0.55, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#eef1f3" metalness={0.4} roughness={0.55} />
      </RoundedBox>

      {/* Front face branding */}
      <Text
        position={[-halfW + 0.44, 0.52, halfD + 0.006]}
        fontSize={0.13}
        color="#2b2e33"
        anchorX="center"
        anchorY="middle"
      >
        Monipa
      </Text>

      {/* Status LED */}
      <mesh position={[-halfW + 0.76, 0.52, halfD + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.02, 24]} />
        <meshStandardMaterial
          ref={ledRef}
          color={LED_COLOR[status]}
          emissive={LED_COLOR[status]}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Peristaltic pump bezel */}
      <RoundedBox
        args={[0.46, 0.66, 0.08]}
        radius={0.05}
        smoothness={4}
        position={[0, -0.18, halfD + 0.02]}
        castShadow
      >
        <meshStandardMaterial color="#cfd3d8" metalness={0.3} roughness={0.5} />
      </RoundedBox>

      {/* Pump head */}
      <mesh position={[0, -0.18, halfD + 0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 32]} />
        <meshStandardMaterial color="#dfe6ea" metalness={0.2} roughness={0.3} transparent opacity={0.85} />
      </mesh>

      {/* Spinning rotor (only visibly spins while running) */}
      <mesh ref={rotorRef} position={[0, -0.18, halfD + 0.125]}>
        <boxGeometry args={[0.24, 0.045, 0.02]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Tubing loop feeding the pump */}
      <mesh position={[0, 0.14, halfD - 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.018, 12, 32]} />
        <meshStandardMaterial color="#cfe0ea" metalness={0.1} roughness={0.2} transparent opacity={0.55} />
      </mesh>

      {/* Black port / knob */}
      <mesh position={[-halfW + 0.46, -halfH + 0.5, halfD + 0.03]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.14, 0.1, 32]} />
        <meshStandardMaterial color="#17181a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Side brand plate */}
      <Text
        position={[halfW + 0.006, -halfH + 0.5, 0.1]}
        rotation={[0, Math.PI / 2, 0]}
        fontSize={0.1}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
        letterSpacing={0.08}
      >
        IRUBIS
      </Text>
    </group>
  );
}
