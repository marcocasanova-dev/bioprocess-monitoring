#!/usr/bin/env bash
# Writes EXPO_PUBLIC_API_URL into mobile/.env, pointed at this Mac's current
# LAN IP. Runs automatically before `npm start`/`ios`/`android` (see package.json's
# "pre*" scripts) so a physical device on Expo Go always gets the right address,
# even after switching Wi-Fi networks — no manual editing of .env.
#
# Run it by hand any time with: npm run set-ip

set -euo pipefail

PORT=8000
ENV_FILE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/.env"

# en0 is Wi-Fi on almost every Mac; en1 is the fallback on machines where
# Wi-Fi enumerates differently (e.g. some Ethernet+Wi-Fi combos).
IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$IP" ]; then
  IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi

if [ -z "$IP" ]; then
  echo "⚠️  Could not detect a LAN IP (en0/en1 both empty)."
  echo "    Are you connected to Wi-Fi? Leaving .env untouched."
  echo "    (Simulators/emulators don't need this — they use localhost.)"
  exit 0
fi

URL="http://${IP}:${PORT}"
LINE="EXPO_PUBLIC_API_URL=${URL}"

if [ -f "$ENV_FILE" ] && grep -q '^EXPO_PUBLIC_API_URL=' "$ENV_FILE"; then
  # Replace the existing line, keep everything else in the file untouched.
  tmp="$(mktemp)"
  sed "s|^EXPO_PUBLIC_API_URL=.*|${LINE}|" "$ENV_FILE" > "$tmp" && mv "$tmp" "$ENV_FILE"
else
  echo "$LINE" >> "$ENV_FILE"
fi

echo "📡 mobile/.env → ${URL}"
echo "   (only matters for a physical device via Expo Go — Simulator/Emulator ignore it)"
