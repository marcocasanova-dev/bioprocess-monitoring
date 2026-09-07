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

// Real Monipa proportions: 40cm wide × 80cm tall × 80cm deep — narrower and
// much deeper than the earlier guessed shape, scaled here so the height
// stays the same 1.9 units as before (keeps the existing camera framing in
// DevicePanel valid without having to also retune it).
const REAL_WIDTH_CM = 40;
const REAL_HEIGHT_CM = 80;
const REAL_DEPTH_CM = 80;
const SCALE = 1.9 / REAL_HEIGHT_CM;
const BODY_WIDTH = REAL_WIDTH_CM * SCALE;
const BODY_HEIGHT = REAL_HEIGHT_CM * SCALE;
const BODY_DEPTH = REAL_DEPTH_CM * SCALE;

// Previous (guessed) proportions, kept only to derive scale ratios below —
// every width/depth-relative control position was tuned against these, so
// scaling by the ratio preserves "text sits 55% of the way to the edge"
// instead of leaving it at a now-wrong absolute offset.
const OLD_WIDTH = 1.6;
const OLD_DEPTH = 1.15;
const WIDTH_RATIO = BODY_WIDTH / OLD_WIDTH;
const DEPTH_RATIO = BODY_DEPTH / OLD_DEPTH;

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

  // The beveled edge: the top-front edge, replaced by one flat panel instead
  // of the rounded corner — solved so its two ends land exactly on the box's
  // real surfaces, not eyeballed. BEVEL_H is how far down the front face the
  // cut starts; BEVEL_D is how far back along the top face it recedes. Sized
  // to be the dominant feature it is in the reference photo (~30% of the
  // body's height), not a thin decorative accent — the first size (0.35) read
  // as "a box with a line on it" rather than "a cut prism."
  const BEVEL_H = 0.6; // unchanged — height ratio is 1, the body's height didn't change
  const BEVEL_D = 0.4 * DEPTH_RATIO; // scales up: the real body is much deeper
  const BEVEL_LENGTH = Math.hypot(BEVEL_H, BEVEL_D); // panel's own height, exactly spans the cut
  const BEVEL_ANGLE = Math.atan2(-BEVEL_D, BEVEL_H); // tilts local Y to point from the front-seam to the top-seam
  const BEVEL_NORMAL = { y: BEVEL_D / BEVEL_LENGTH, z: BEVEL_H / BEVEL_LENGTH }; // the panel's outward face direction
  const BEVEL_NUDGE = 0.03; // pushed proud along that normal so it doesn't clip the rounded corner underneath
  const BEVEL_CENTER_Y = halfH - BEVEL_H / 2 + BEVEL_NORMAL.y * BEVEL_NUDGE;
  const BEVEL_CENTER_Z = halfD - BEVEL_D / 2 + BEVEL_NORMAL.z * BEVEL_NUDGE;
  const BEVEL_BOTTOM_SEAM_Y = halfH - BEVEL_H; // where the bevel meets the flat front — everything below is the non-beveled part

  // The bigger bevel eats further down the front, so every control shifts
  // down by the same amount to keep clear of it (0.08 margin below the seam,
  // same margin the smaller bevel had).
  const CONTROLS_Y = BEVEL_BOTTOM_SEAM_Y - 0.08;
  const CONTROLS_SHIFT = CONTROLS_Y - 0.52; // 0.52 was the original branding row's y

  // The housing is split into two real volumes, not one uniform box with a
  // panel glued on top — that was the actual bug: a decal doesn't change the
  // silhouette, so it kept reading as "a cube" no matter how big it got.
  //   BACK_BOX:  full height, shallower depth (stops short of the true front)
  //   FRONT_BOX: full depth, shorter height (stops below the true top)
  // The two share the exact seam the bevel panel above already bridges — feed
  // it the same BEVEL_H / BEVEL_D and the notch and the panel always line up.
  const BACK_BOX_DEPTH = BODY_DEPTH - BEVEL_D;
  const BACK_BOX_Z = -BEVEL_D / 2;
  const FRONT_BOX_HEIGHT = BODY_HEIGHT - BEVEL_H;
  const FRONT_BOX_Y = -BEVEL_H / 2;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Back volume — full height, cut short in depth */}
      <RoundedBox
        args={[BODY_WIDTH, BODY_HEIGHT, BACK_BOX_DEPTH]}
        radius={0.14}
        smoothness={4}
        position={[0, 0, BACK_BOX_Z]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e3e6ea" metalness={0.55} roughness={0.35} />
      </RoundedBox>

      {/* Front volume — full depth, cut short in height. Overlaps the back
          volume where both exist; the two together make the actual notched
          silhouette, not just a texture on a plain box. */}
      <RoundedBox
        args={[BODY_WIDTH, FRONT_BOX_HEIGHT, BODY_DEPTH]}
        radius={0.14}
        smoothness={4}
        position={[0, FRONT_BOX_Y, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#e3e6ea" metalness={0.55} roughness={0.35} />
      </RoundedBox>

      {/* Beveled top-front edge — see BEVEL_* above for how this is solved to
          meet the box's real surfaces at both ends instead of floating.
          radius must stay well under half the panel's own thickness (0.05):
          drei's RoundedBox computes extrudeDepth = thickness - radius*2, so a
          radius >= thickness/2 goes negative and the geometry collapses —
          that's what was rendering as a thin line instead of a flat panel. */}
      <RoundedBox
        args={[BODY_WIDTH * 0.85, BEVEL_LENGTH, 0.05]}
        radius={0.012}
        smoothness={4}
        position={[0, BEVEL_CENTER_Y, BEVEL_CENTER_Z]}
        rotation={[BEVEL_ANGLE, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color="#eef1f3" metalness={0.4} roughness={0.55} />
      </RoundedBox>

      {/* Front face branding — on the flat, non-beveled part of the body.
          X offsets scaled by WIDTH_RATIO: the front is much narrower now
          (0.95 vs the old 1.6), so keeping the raw offsets would have pushed
          the LED half off the edge instead of staying proportionally placed. */}
      <Text
        position={[-halfW + 0.44 * WIDTH_RATIO, CONTROLS_Y, halfD + 0.006]}
        fontSize={0.13 * WIDTH_RATIO}
        color="#2b2e33"
        anchorX="center"
        anchorY="middle"
      >
        Monipa
      </Text>

      {/* Status LED */}
      <mesh position={[-halfW + 0.76 * WIDTH_RATIO, CONTROLS_Y, halfD + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow>
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
        radius={0.025}
        smoothness={4}
        position={[0, -0.18 + CONTROLS_SHIFT, halfD + 0.02]}
        castShadow
      >
        <meshStandardMaterial color="#cfd3d8" metalness={0.3} roughness={0.5} />
      </RoundedBox>

      {/* Pump head */}
      <mesh position={[0, -0.18 + CONTROLS_SHIFT, halfD + 0.09]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.17, 0.17, 0.05, 32]} />
        <meshStandardMaterial color="#dfe6ea" metalness={0.2} roughness={0.3} transparent opacity={0.85} />
      </mesh>

      {/* Spinning rotor (only visibly spins while running) */}
      <mesh ref={rotorRef} position={[0, -0.18 + CONTROLS_SHIFT, halfD + 0.125]}>
        <boxGeometry args={[0.24, 0.045, 0.02]} />
        <meshStandardMaterial color="#3a3d42" metalness={0.4} roughness={0.4} />
      </mesh>

      {/* Tubing loop feeding the pump */}
      <mesh position={[0, 0.14 + CONTROLS_SHIFT, halfD - 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.15, 0.018, 12, 32]} />
        <meshStandardMaterial color="#cfe0ea" metalness={0.1} roughness={0.2} transparent opacity={0.55} />
      </mesh>

      {/* Black port / knob */}
      <mesh
        position={[-halfW + 0.46 * WIDTH_RATIO, -halfH + 0.5 + CONTROLS_SHIFT, halfD + 0.03]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.14, 0.14, 0.1, 32]} />
        <meshStandardMaterial color="#17181a" metalness={0.3} roughness={0.6} />
      </mesh>

      {/* Side brand plate — on the side face, which is now much deeper (it
          used to be the shallow dimension); its Z offset scales with
          DEPTH_RATIO so it sits proportionally as off-center as it did before. */}
      <Text
        position={[halfW + 0.006, -halfH + 0.5, 0.1 * DEPTH_RATIO]}
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
