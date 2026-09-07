# Bioprocess Monitoring Challenge

## About this Project

this mini challenge try to simulated a spectrometer, using a backgorund thread that replays forever data retrieved from a csv file with the condition of showing a row every 500ms. every time the index reach its end, the cycle start again. on top of that there is a FastApi rest that expose start control and jump. the project also count with a basic front end /fe done with vite and typescript and plotly

The backend now simulates a small **fleet of 6 Monipa devices** (`monipa-01`
… `monipa-06`), 4 online and 2 offline, each backed by its own CSV under
`data/` (see `scripts/generate_fleet_data.py`) and its own independent
background thread — every endpoint is scoped to one device by id.

## How to run

pip install -r requirements.txt
uvicorn api:app --reload

uvicorn api:app --reload --host 0.0.0.0


Server runs at http://127.0.0.1:8000
Docs at http://127.0.0.1:8000/docs

## Try the enpoints in the teminal

curl http://127.0.0.1:8000/monipas

curl -X POST http://127.0.0.1:8000/monipas/monipa-01/start

curl -X POST http://127.0.0.1:8000/monipas/monipa-01/stop

curl -X POST http://127.0.0.1:8000/monipas/monipa-01/jump/9999

curl http://127.0.0.1:8000/monipas/monipa-01/spectrum

curl http://127.0.0.1:8000/monipas/spectrum   # every ONLINE device's current spectrum, for an overlay chart

Starting/stopping/jumping an offline device (`monipa-05`, `monipa-06`)
returns `409` — it's not reachable, so it can't be controlled.


## Part II the mini UI (fe/)

a React + TypeScript app split into two panels: a Plotly chart of the current
spectrum, and a stylized React Three Fiber (WebGL) rendering of the device
inspired by the Monipa spectrometer, which you can drag to rotate. Start /
Pause / Stop buttons under the 3D panel drive the simulation.

A row of chips above the split lets you pick which of the 6 fleet devices
you're looking at — online ones show Idle/Running/Paused, offline ones are
greyed out and read-only (their last known spectrum is still shown, but
Start/Pause/Stop are disabled).

## How to run

cd fe
npm install
npm run dev


### Regenerate API types always after changing api.py

for this the backend needs to be running first (`uvicorn api:app --reload` from the
project root), then:

cd fe
npx openapi-typescript http://127.0.0.1:8000/openapi.json -o src/api-types.ts

auto-generated schema and produces the matching
TypeScript types in `src/api-types.ts`, one source of truth to rule them all

## Part III the mobile UI (mobile/)

npx expo start --tunnel


an Expo (React Native) dashboard covering the same data as fe/ — a scrollable
row of the 6 fleet devices, spectrum chart, device status, Start/Pause/Stop —
for a phone screen. See mobile/README.md for how to run it and how to point
it at the backend from a simulator/emulator/physical device.

## Notes 
    - yaxis: { title: "Absorbance [mAU]", range: [-0.002, 0.09] }, range was harcoded after getting max/min across all 6 fleet devices, this could be better handled in the be
    - frontend types are generated for conviniece and mantain one source of true
    - use of lock to avoid race condition 
    - the API only exposes a start/stop toggle, so the UI's Pause and Stop
      buttons are both built on POST /monipas/{id}/stop: Pause freezes the
      simulation in place (Start resumes from there), Stop freezes it and
      jumps back to index 0 (Start begins from the top again). A dedicated
      /pause endpoint would be cleaner if the backend grows further.
    - online/offline is a fixed flag per device (4 online, 2 offline) set in
      fleet.py, not a live connectivity check — a more realistic version
      would let devices randomly disconnect/reconnect with a last-seen
      timestamp
    - CORS on the backend allows any http://localhost:<port> /
      http://127.0.0.1:<port> origin (via allow_origin_regex) rather than a
      fixed list — Vite/Expo fall back to the next free port when their
      default is taken (5173→5174, 8081→8082, ...), which kept breaking a
      hardcoded allowlist. Native iOS/Android builds aren't browsers so CORS
      doesn't apply to them regardless.

## Nice to have with more time 
    - tests
    - type hints 
    - loading state / error messages in the front end
    - fleet-wide overlay chart (all online devices on one chart — GET
      /monipas/spectrum already returns the data for it, just not wired into
      either UI yet)
    - derive a real calibrated value (e.g. titer) from the spectrum instead
      of just plotting raw absorbance
    - basic anomaly flagging: compare each online device's spectrum to the
      fleet average