from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException

from fleet import Monipa, build_fleet

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.fleet = build_fleet()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Dev-only backend: allow any localhost/127.0.0.1 port rather than
    # hardcoding specific ones. Vite (fe/) and `expo start --web` (mobile/)
    # both fall back to the next free port when their default is taken
    # (5173→5174, 8081→8082, ...), which kept breaking a fixed allowlist.
    # Native iOS/Android builds aren't browsers, so CORS doesn't apply to them.
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def get_health():
    return {"status": "ok", "message": "health enable"}


def get_monipa(monipa_id: str) -> Monipa:
    monipa = app.state.fleet.get(monipa_id)
    if monipa is None:
        raise HTTPException(status_code=404, detail=f"Unknown Monipa '{monipa_id}'")
    return monipa


class MonipaInfo(BaseModel):
    id: str
    name: str
    online: bool
    running: bool
    index: int


class SpectrumResponse(BaseModel):
    index: int
    wavenumbers: list[int]
    data: list[float]
    running: bool


class MonipaSpectrum(SpectrumResponse):
    id: str
    name: str


class TrendResponse(BaseModel):
    wavenumber: int
    values: list[float]
    current_index: int
    total: int


class HeatmapResponse(BaseModel):
    wavenumbers: list[int]
    values: list[list[float]]
    total: int


@app.get("/monipas")
def list_monipas() -> list[MonipaInfo]:
    result = []
    for monipa in app.state.fleet.values():
        index, _ = monipa.spectrometer.get_current_data()
        result.append(
            MonipaInfo(
                id=monipa.id,
                name=monipa.name,
                online=monipa.online,
                running=monipa.spectrometer.is_running(),
                index=index,
            )
        )
    return result


@app.get("/monipas/spectrum")
def list_online_spectra() -> list[MonipaSpectrum]:
    """Current spectrum for every online device — feeds a fleet-wide overlay chart."""
    result = []
    for monipa in app.state.fleet.values():
        if not monipa.online:
            continue
        index, current_data = monipa.spectrometer.get_current_data()
        result.append(
            MonipaSpectrum(
                id=monipa.id,
                name=monipa.name,
                index=index,
                wavenumbers=current_data.index.tolist(),
                data=current_data.tolist(),
                running=monipa.spectrometer.is_running(),
            )
        )
    return result


@app.get("/monipas/{monipa_id}/spectrum")
def get_monipa_spectrum(monipa_id: str) -> SpectrumResponse:
    monipa = get_monipa(monipa_id)
    index, current_data = monipa.spectrometer.get_current_data()
    return SpectrumResponse(
        index=index,
        wavenumbers=current_data.index.tolist(),
        data=current_data.tolist(),
        running=monipa.spectrometer.is_running(),
    )


@app.get("/monipas/{monipa_id}/trend/{wavenumber}")
def get_monipa_trend(monipa_id: str, wavenumber: int) -> TrendResponse:
    """One wavenumber's absorbance across the whole run — the process view.

    /spectrum returns a single reading: one frame. This returns the same column
    for every reading in the CSV, which is what actually answers "is this still
    climbing or has it levelled off?".
    """
    monipa = get_monipa(monipa_id)
    data = monipa.spectrometer.data
    # Snap to the nearest column: a click on the chart lands on whatever x
    # Plotly reports, which won't always be an exact wavenumber we hold.
    nearest = min(data.columns, key=lambda column: abs(column - wavenumber))
    index, _ = monipa.spectrometer.get_current_data()
    return TrendResponse(
        wavenumber=int(nearest),
        values=data[nearest].tolist(),
        current_index=index,
        total=len(data),
    )


@app.get("/monipas/{monipa_id}/heatmap")
def get_monipa_heatmap(monipa_id: str, stride: int = 4) -> HeatmapResponse:
    """The whole run as one grid: every reading × every wavenumber.

    `stride` thins the wavenumber axis — 800 columns is far more than the chart
    has pixels, so sending every 4th keeps the picture identical at a quarter of
    the payload. Absorbances are rounded to 6 decimals for the same reason.
    """
    if stride < 1:
        raise HTTPException(status_code=400, detail="stride must be >= 1")
    monipa = get_monipa(monipa_id)
    data = monipa.spectrometer.data.iloc[:, ::stride].round(6)
    return HeatmapResponse(
        wavenumbers=[int(column) for column in data.columns],
        values=data.to_numpy().tolist(),
        total=len(data),
    )


@app.post("/monipas/{monipa_id}/start")
def start_monipa(monipa_id: str):
    monipa = get_monipa(monipa_id)
    if not monipa.online:
        raise HTTPException(status_code=409, detail=f"'{monipa_id}' is offline")
    monipa.spectrometer.start_simulation()
    return {"status": "running"}


@app.post("/monipas/{monipa_id}/stop")
def stop_monipa(monipa_id: str):
    monipa = get_monipa(monipa_id)
    if not monipa.online:
        raise HTTPException(status_code=409, detail=f"'{monipa_id}' is offline")
    monipa.spectrometer.stop_simulation()
    return {"status": "stop"}


@app.post("/monipas/{monipa_id}/jump/{index}")
def jump_monipa(monipa_id: str, index: int):
    monipa = get_monipa(monipa_id)
    if not monipa.online:
        raise HTTPException(status_code=409, detail=f"'{monipa_id}' is offline")
    try:
        monipa.spectrometer.jump_to(index)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"status": "jumping"}
