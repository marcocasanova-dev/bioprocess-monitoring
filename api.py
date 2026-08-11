from contextlib import asynccontextmanager

from fastapi import FastAPI

from biospectrometer import Biospectrometer, read_csv_file


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.spectrometer = Biospectrometer(read_csv_file())
    yield


app = FastAPI(lifespan=lifespan)


@app.get("/health")
def get_health():
    return {"status": "ok", "message": "health enable"}


@app.post("/start")
def start():
    app.state.spectrometer.start_simulation()
    return {"status": "running"}


@app.post("/stop")
def stop():
    app.state.spectrometer.stop_simulation()
    return {"status": "stop"}


@app.post("/jump/{index}")
def jump(index: int):
    app.state.spectrometer.jump_to(index)
    return {"status": "jumping"}


@app.get("/spectrum")
def get_spectrum():
    current_data = app.state.spectrometer.get_current_data()
    return {"status": "running", "data": current_data}
