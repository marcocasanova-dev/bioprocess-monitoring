import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox, Text } from "@react-three/drei";
import { ExtrudeGeometry, Shape } from "three";
import { toCreasedNormals } from "three-stdlib";
import type { BufferGeometry, Group, Mesh, MeshStandardMaterial } from "three";
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

/**
 * Builds the housing as ONE real mesh instead of separate boxes bridged by a
 * loose panel — that composite approach kept desyncing into a visible gap
 * whenever the proportions changed, because three independent primitives all
 * had to land on the exact same seam by coincidence, not by construction.
 *
 * This draws a rounded pentagon in the (Z, Y) plane — a rectangle with the
 * top-front corner replaced by a straight cut — and extrudes it along X
 * (width). Same technique @react-three/drei's own RoundedBox uses internally
 * (Shape + ExtrudeGeometry + toCreasedNormals), just with 5 rounded corners
 * instead of 4. Verified against the real Three.js output before wiring it
 * in here: bounding box and both seam-corner positions checked in Node.
 */
function buildBeveledHousing(halfD: number, halfH: number, bevelH: number, bevelD: number, width: number): BufferGeometry {
  const cornerRadius = 0.08;

  // Corners, anticlockwise from bottom-back, in a local (u, v) frame where
  // u stands in for Z and v for Y — rotated into the real X/Y/Z axes below.
  const corners: [number, number][] = [
    [-halfD, -halfH], // bottom-back
    [halfD, -halfH], // bottom-front
    [halfD, halfH - bevelH], // front-seam — front face meets the bevel
    [halfD - bevelD, halfH], // top-seam — bevel meets the top face
    [-halfD, halfH], // top-back
  ];

  const shape = new Shape();
  const n = corners.length;
  const unit = (ax: number, ay: number, bx: number, by: number) => {
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    return [dx / len, dy / len];
  };
  let firstPoint: [number, number] | null = null;
  for (let i = 0; i < n; i++) {
    const [px, py] = corners[(i - 1 + n) % n];
    const [cx, cy] = corners[i];
    const [nx, ny] = corners[(i + 1) % n];
    const [inX, inY] = unit(px, py, cx, cy);
    const [outX, outY] = unit(cx, cy, nx, ny);
    const startX = cx - inX * cornerRadius;
    const startY = cy - inY * cornerRadius;
    const endX = cx + outX * cornerRadius;
    const endY = cy + outY * cornerRadius;
    if (i === 0) {
      shape.moveTo(startX, startY);
      firstPoint = [startX, startY];
    } else {
      shape.lineTo(startX, startY);
    }
    // A quadratic curve through the real corner rounds it off without needing
    // per-corner arc-angle bookkeeping — much harder to get a sign wrong than
    // absarc's start/end angles, at the cost of a slightly less exact circle.
    shape.quadraticCurveTo(cx, cy, endX, endY);
  }
  if (firstPoint) shape.lineTo(firstPoint[0], firstPoint[1]);

  // No bevelEnabled here: Three.js's extrude bevel expands the shape OUTWARD
  // by bevelSize at the two end caps (that's what the option is for) — since
  // this shape is already built at its true final size, turning that on
  // double-counts the radius and overshoots (verified: 2.06 instead of the
  // intended 1.9 before this was caught). The 5 corners are already rounded
  // above; skipping the cap bevel just leaves the two far side-faces meeting
  // the body with a sharp, not rounded, seam — minor, not silhouette-defining.
  const geometry = new ExtrudeGeometry(shape, { depth: width, bevelEnabled: false, steps: 1, curveSegments: 8 });
  geometry.center();
  toCreasedNormals(geometry, 0.4);
  // Local X (the shape's u, i.e. Z) → world Z; local Z (the extrude, i.e.
  // width) → world X. A -90° Y-rotation maps (x,y,z) -> (-z,y,x): world Z
  // keeps the sign built into the corners above (front stays front), and
  // width flipping sign is harmless — the cross-section doesn't vary along it.
  geometry.rotateY(-Math.PI / 2);
  return geometry;
}

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

  // Sized so the cut is the dominant feature it is in the reference photo
  // (~30% of the body's height), not a thin decorative accent.
  const BEVEL_H = 0.6; // unchanged — height ratio is 1, the body's height didn't change
  const BEVEL_D = 0.4 * DEPTH_RATIO; // scales up: the real body is much deeper
  const BEVEL_BOTTOM_SEAM_Y = halfH - BEVEL_H; // where the bevel meets the flat front — everything below is the non-beveled part

  // The bigger bevel eats further down the front, so every control shifts
  // down by the same amount to keep clear of it (0.08 margin below the seam,
  // same margin the smaller bevel had).
  const CONTROLS_Y = BEVEL_BOTTOM_SEAM_Y - 0.08;
  const CONTROLS_SHIFT = CONTROLS_Y - 0.52; // 0.52 was the original branding row's y

  const housingGeometry = useMemo(
    () => buildBeveledHousing(halfD, halfH, BEVEL_H, BEVEL_D, BODY_WIDTH),
    [halfD, halfH, BEVEL_H, BEVEL_D],
  );

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <mesh geometry={housingGeometry} castShadow receiveShadow>
        <meshStandardMaterial color="#e3e6ea" metalness={0.55} roughness={0.35} />
      </mesh>

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
