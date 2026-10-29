# Monipa Demo Script — 11 Minutes

The full word-for-word walkthrough script. **SAY** lines are meant to be
rehearsed until they sound like your own words, not read verbatim. **DO**
lines are the on-screen action paired with them.

An interactive version of this script (with a text-to-speech play button per
cue) also exists as a published artifact from the working session that built
it — ask if you'd like that link again.

---

## 0:00 — Opening

**SAY:** Good morning, and thank you for having me today. What I want to show
you isn't something entirely new — it's built on top of the challenge I
submitted a few weeks ago. What I did since then was add a layer on top of
it. And the idea running through this whole presentation is really about
space for creativity: how we can use technology to improve, maintain, build
on, and evaluate a product like this one, in a solid, deliberate way.

**DO:** Nothing on screen yet. Pause a beat after the last line before
opening the app — this sets up everything that follows.

---

## 0:40 — The fleet

**SAY:** This is a simulated fleet of Monipa devices, six of them, built on
top of the coding challenge I submitted.

**DO:** Point at the six device chips across the top. Four online, two
offline.

---

## 1:05 — Spectrum — this device

**SAY:** This is the simplest view — one device, one instant. Absorbance
against wavenumber, refreshing every half second. It's a snapshot, and a
snapshot answers exactly one question: what does the signal look like right
now. It doesn't tell you if it's rising, falling, or already done.

**DO:** Click "This device." Let it sit a second so the line updates once,
visibly.

---

## 2:05 — Compare all online

**SAY:** Same axes, but now all four online devices overlaid, the selected
one highlighted. This is a fleet-level question, not a single-instrument
one: does any device look different from the rest? If one curve sits
noticeably above or below its siblings, that's worth investigating — and
you'd never see that looking at devices one at a time.

**DO:** Click "Compare all online." Trace a finger along the highlighted
curve against the other three.

---

## 3:15 — All readings

**SAY:** This is the whole run at once — every reading on this axis, every
wavenumber on that one, color is absorbance. It draws itself as the run
progresses, because a real instrument can't show you a reading it hasn't
taken yet. The two bright bands are the protein peaks growing over time. And
this scan line sweeping across as new rows arrive isn't just decoration — it
paces the reveal to match the real 500-millisecond poll, so what you see
always matches what the instrument has actually measured, nothing ahead of
it.

**DO:** Click "All readings." Point at where the painted region ends and the
blank region begins, and at the sweeping line as a new row lands.

---

## 4:45 — Trend & threshold

**SAY:** Click any point on the spectrum, and this shows how that one point
evolved across the entire run — the same idea as a single-wavelength HPLC
chromatogram, and again, only the readings actually measured so far, nothing
further. And if I type a min and a max here, in the same raw units as the
axis, the marker turns green, amber, or red depending on where the reading
sits. I'm not telling the system what's correct — the user does. It
compares, it doesn't judge.

**DO:** Click a peak on the spectrum. Type a Min and Max into the Trend
panel. Watch the marker change color.

---

## 6:15 — The 3D model & addons

**SAY:** This model mirrors the same live state as the dashboard, but it's
also become the place where I've been testing ideas for a service and
support layer — three of them are switched on right now. First: this addon
panel — a set of optional overlays, so the base view stays clean and you
only turn on what a given task needs. Second: a physical-looking traffic
light standing next to the unit, the same green-amber-red as the threshold
marker, but readable from across a room without opening a chart — useful on
a plant floor where nobody's staring at a laptop. And third: switching the
housing transparent to see what's actually inside — the controller board,
the spectrometer module, the pump — because when something needs
troubleshooting, knowing where a part physically lives inside the housing
saves real time versus a service manual.

**DO:** Open the Addons panel. Toggle "Show threshold traffic light" — point
at it lighting up in sync with the Trend marker. Toggle "See inside" —
rotate the model to show the internal layout.

---

## 8:15 — Diagnostics

**SAY:** And this button runs a diagnostic pass — connectivity, power,
controller, optics, and the threshold check, each in its own section. It's a
snapshot, on demand, when someone actively wants to know "is everything
actually okay right now."

**DO:** Click "Run diagnostics." Let the checks populate, then scroll through
the five sections.

---

## 8:45 — Debug log

**SAY:** And this is the other half of that idea — a running log, not a
snapshot, that fills in on its own while a run is in progress: dropped
polls, connection loss, a reading crossing outside the range you set —
timestamped, and tagged by whether it's a hardware, software, or data issue.
The diagnostics button answers "is it okay right now"; this answers "what
actually happened while I wasn't looking."

**DO:** Open the Debug Log tab. Trigger a threshold crossing (adjust Min/Max
on the Trend panel) and point at the new entry appearing at the top of the
list with its timestamp and category.

---

## 9:20 — Mobile

**SAY:** And this dashboard lives on a laptop, but the person who needs to
act on it isn't always standing in front of one — so I built the same thing
for a phone. Same backend, same data, just rethought for a small screen.

**DO:** Switch to the mobile view (Simulator). Point at the same fleet, same
spectrum.

---

## Closer

*"Every view answers a question the others can't — and none of them claims
to know more about the chemistry than it actually does."*

---

## Why each piece earns its place

| Component | What it shows | Why it's useful |
|---|---|---|
| Fleet row | Selector + live state for 6 devices | A customer has a **plant**, not one instrument. Without this, monitoring six devices means six separate screens. |
| Spectrum — this device | Current spectrum, one reading | The floor everything else is built on — without a live reading there's no monitoring at all. |
| Compare all online | Four spectra overlaid | **Fleet-level outlier detection.** A device can look normal alone but be off relative to its peers — invisible checking devices one at a time, a single glance here. |
| All readings + scan line | The whole run as one image, revealed in step with the poll | Saves diagnosis time — no scrubbing through 126 readings by hand — and the paced reveal keeps the picture honest about what's actually been measured. |
| Trend + threshold | One point over time, with min/max | **Turns a number into a decision.** Nobody wants to babysit a value that updates twice a second — the system flags the crossing instead. |
| Addons panel | Opt-in overlays on the 3D view | Keeps the default view uncluttered — the traffic light and see-inside modes exist for the moment someone actually needs them. |
| 3D traffic light | Threshold status as a physical-looking lamp | Readable at a glance from across a room — no chart to interpret, just green, amber, or red. |
| See-inside mode | Transparent housing, internal layout | Ties a status signal to a physical location — useful the moment someone needs to service the unit, not just monitor it. |
| Run diagnostics | One-shot health check across 5 subsystems | Answers "is it okay right now" on demand — a snapshot, not a running log. |
| Debug log | Continuous event feed while a run is in progress | Answers "what happened while I wasn't looking" — connectivity drops and threshold crossings, timestamped and categorized. |
| Mobile app | The same system, on a phone | Extends control past the lab door — an alarm nobody sees because they're not at the laptop is worth nothing. |

---

## What's next (named, not built)

If there's time or the conversation goes there — framed as "here's where I'd
take this," not a committed roadmap:

- **Fleet health ranking** — sort the six devices by how long each has spent
  out of range or offline, so attention goes to whichever one needs it most
  instead of checking each device in turn.
- **Run export & annotations** — download a run as CSV, and let a user mark
  an event directly on the Trend chart — "reagent added here" — as a
  persistent, timestamped note others can see later.
- **Saved run profiles** — presets bundling pump speed, default wavenumber,
  and threshold range by experiment type, so starting a familiar run doesn't
  mean re-entering the same settings every time.
