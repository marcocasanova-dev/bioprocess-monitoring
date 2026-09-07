# Bioprocess Monitoring — mobile

An Expo (React Native) dashboard showing the same Monipa fleet data and
Start/Pause/Stop controls as `fe/`, laid out for a phone screen. No 3D
device here — just a device picker, the chart, a status badge, and controls,
kept dependency light (a hand-rolled `react-native-svg` chart rather than a
charting library).

## Structure

```
mobile/
  App.tsx                        entry screen — owns the selected device id
  scripts/
    set-api-url.sh                writes the Mac's current LAN IP into .env (runs before start/ios/android)
  src/
    config.ts                    backend base URL (see below)
    client.ts                    openapi-fetch client
    api-types.ts                 generated types, copied from fe/src/api-types.ts
    hooks/
      useFleet.ts                polls GET /monipas every 2s (all 6 devices' status)
      useSpectrum.ts             polls GET /monipas/{id}/spectrum every 500ms
      useSimulation.ts           start/pause/stop actions, plus deriveStatus()
    components/
      FleetList.tsx              horizontal scroll of device chips (online/offline, tap to select)
      SpectrumChart.tsx
      StatusBadge.tsx
      ControlButtons.tsx
```

## How to run

```
cd mobile
npm install
npm run web       # fastest way to preview, runs at http://localhost:8081
npm run ios       # requires Xcode + iOS Simulator
npm run android   # requires Android Studio + emulator
```

The backend needs to be running first (from the project root):

```
uvicorn api:app --reload
```

### Pointing at the backend

`src/config.ts` picks a default backend URL per platform — no setup needed
for the web preview, iOS Simulator, or Android Emulator:

- Web / iOS Simulator → `http://localhost:8000`
- Android Emulator → `http://10.0.2.2:8000` (the emulator's alias for the host's localhost)

For a **physical device** via Expo Go, `localhost` means the phone itself —
it needs your Mac's actual LAN address instead. That address changes every
time the Mac joins a different Wi-Fi network, which used to mean editing
`mobile/.env` by hand before every demo.

### The IP is now handled automatically

`npm start` / `npm run ios` / `npm run android` all run
[`scripts/set-api-url.sh`](scripts/set-api-url.sh) first (wired in as
`pre*` scripts in `package.json`), which detects the Mac's current LAN IP
(`ipconfig getifaddr en0`, falling back to `en1`) and rewrites
`EXPO_PUBLIC_API_URL` in `mobile/.env` to match — every time, no manual step.
Run it by itself any time with:

```
npm run set-ip
```

It only touches that one line in `.env` and leaves everything else there
untouched. If it can't find a LAN IP (Wi-Fi is off, or you're on Ethernet
only) it prints a warning and leaves `.env` as-is rather than writing a bad
value — simulators/emulators don't need this at all, since they use
`localhost`/`10.0.2.2` regardless.

### Running on a real device (same Wi-Fi)

1. **Bind the backend to all interfaces**, not just loopback — from the
   project root:
   ```
   uvicorn api:app --reload --host 0.0.0.0
   ```
2. **Allow the connection through the Mac firewall**, if it's on: System
   Settings → Network → Firewall. The first incoming connection normally
   triggers an "Allow incoming connections for python?" prompt — accept it.
3. From `mobile/`, run `npm start` — this refreshes `.env` with the current
   IP automatically (see above), then starts Metro.
4. **Sanity-check reachability before touching the app**: open
   `http://<the-ip-npm-start-printed>:8000/health` in the phone's browser.
   If that doesn't load, it's a network/firewall issue, not the app —
   fix that first. The most common culprit is the phone and Mac being on
   different Wi-Fi networks (e.g. a guest network with "client/AP
   isolation" enabled, which blocks device-to-device traffic even though
   both show the same SSID).
5. **Install Expo Go** (App Store / Play Store) and scan the QR code
   `npm start` prints.

If the phone genuinely can't reach the Mac directly on that network (step 5
fails and isn't a firewall issue), `npx expo start --tunnel` will get the
Metro bundler itself to the phone over the internet, but it does **not**
tunnel the FastAPI backend — you'd separately need something like
`ngrok http 8000` and to point `EXPO_PUBLIC_API_URL` at that tunnel URL
instead.

Note: unlike the browser-based `fe/` app, native builds aren't subject to
CORS, so nothing else needs to change on the backend for iOS/Android. The
web preview *does* run in a browser, though — `api.py`'s CORS config allows
any `http://localhost:<port>` origin, so it works regardless of which port
`expo start --web` happens to land on.

### Regenerating API types

Same source of truth as `fe/`. With the backend running:

```
cd fe && npx openapi-typescript http://127.0.0.1:8000/openapi.json -o src/api-types.ts
cp src/api-types.ts ../mobile/src/api-types.ts
```

## Notes

- Pause/Stop semantics mirror `fe/`: the API only exposes a start/stop
  toggle, so Pause calls `/monipas/{id}/stop` (freezes in place) and Stop
  calls that then `/monipas/{id}/jump/0` (freezes and resets to the top).
- The spectrum chart's y-axis range (`-0.002` to `0.09`) is hardcoded the
  same way as the web app's Plotly chart.
- Selecting an offline device (`monipa-05`, `monipa-06`) still shows its
  last-known spectrum but disables all three buttons — the backend returns
  409 for start/stop/jump on an offline device, so there's nothing useful
  those buttons could do.
