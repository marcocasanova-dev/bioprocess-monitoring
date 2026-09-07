type Props = {
  ledColor: string;
  dimmed?: boolean;
  pulse?: boolean;
};

/** A small flat-SVG stand-in for the 3D Monipa device, used in the fleet picker. */
export function MonipaIcon({ ledColor, dimmed, pulse }: Props) {
  return (
    <svg width="34" height="40" viewBox="0 0 34 40" fill="none" style={{ opacity: dimmed ? 0.5 : 1 }}>
      {/* body */}
      <rect x="3" y="5" width="28" height="32" rx="5" fill="#e3e6ea" stroke="#9aa0ab" strokeWidth="1" />
      {/* angled brushed-top panel */}
      <path d="M6 8 H24 L21 14 H9 Z" fill="#c7cbd1" />
      {/* pump bezel */}
      <rect x="14" y="19" width="9" height="13" rx="2" fill="#cfd3d8" stroke="#9aa0ab" strokeWidth="0.6" />
      {/* port */}
      <circle cx="9" cy="31" r="2.6" fill="#17181a" />
      {/* status LED */}
      <circle cx="10" cy="23" r="1.8" fill={ledColor} className={pulse ? "monipa-icon-led-pulse" : undefined} />
    </svg>
  );
}
